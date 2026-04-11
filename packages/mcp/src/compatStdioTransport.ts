import process from "node:process";
import { JSONRPCMessageSchema } from "@modelcontextprotocol/sdk/types.js";

type JSONRPCMessage = unknown;
type FramingMode = "content-length" | "newline";

function parseContentLengthHeader(headerBlock: string): number | null {
  const lines = headerBlock.split(/\r?\n/);
  for (const line of lines) {
    const [rawKey, rawValue] = line.split(":");
    if (!rawKey || !rawValue) continue;
    if (rawKey.trim().toLowerCase() !== "content-length") continue;
    const parsed = Number.parseInt(rawValue.trim(), 10);
    if (!Number.isFinite(parsed) || parsed < 0) return null;
    return parsed;
  }
  return null;
}

/**
 * Compatibility stdio transport that accepts both:
 * - Content-Length framed JSON-RPC (legacy/LSP style)
 * - Newline-delimited JSON-RPC (new MCP SDK style)
 *
 * It automatically replies using the framing mode of the first inbound message.
 */
export class CompatStdioServerTransport {
  private readonly stdin: NodeJS.ReadStream;
  private readonly stdout: NodeJS.WriteStream;
  private started = false;
  private readBuffer = Buffer.alloc(0);
  private framingMode: FramingMode = "newline";

  onclose?: () => void;
  onerror?: (error: Error) => void;
  onmessage?: (message: JSONRPCMessage) => void;

  constructor(stdin: NodeJS.ReadStream = process.stdin, stdout: NodeJS.WriteStream = process.stdout) {
    this.stdin = stdin;
    this.stdout = stdout;
  }

  async start(): Promise<void> {
    if (this.started) {
      throw new Error("CompatStdioServerTransport already started");
    }
    this.started = true;
    this.stdin.on("data", this.handleData);
    this.stdin.on("error", this.handleError);
  }

  async close(): Promise<void> {
    this.stdin.off("data", this.handleData);
    this.stdin.off("error", this.handleError);
    if (this.stdin.listenerCount("data") === 0) {
      this.stdin.pause();
    }
    this.readBuffer = Buffer.alloc(0);
    this.onclose?.();
  }

  send(message: JSONRPCMessage): Promise<void> {
    const json = JSON.stringify(message);
    const payload =
      this.framingMode === "content-length"
        ? `Content-Length: ${Buffer.byteLength(json, "utf8")}\r\n\r\n${json}`
        : `${json}\n`;

    return new Promise((resolve) => {
      if (this.stdout.write(payload)) {
        resolve();
      } else {
        this.stdout.once("drain", resolve);
      }
    });
  }

  private handleError = (error: Error): void => {
    this.onerror?.(error);
  };

  private handleData = (chunk: Buffer | string): void => {
    const incoming = typeof chunk === "string" ? Buffer.from(chunk, "utf8") : chunk;
    this.readBuffer = Buffer.concat([this.readBuffer, incoming]);
    this.processBuffer();
  };

  private processBuffer(): void {
    while (this.readBuffer.length > 0) {
      try {
        if (this.tryParseContentLengthMessage()) continue;
        if (this.tryParseNewlineMessage()) continue;
        break;
      } catch (error) {
        this.onerror?.(
          error instanceof Error ? error : new Error("Failed to parse stdin message")
        );
      }
    }
  }

  private tryParseContentLengthMessage(): boolean {
    const crlfDelimiter = Buffer.from("\r\n\r\n");
    const lfDelimiter = Buffer.from("\n\n");
    const crlfHeaderEnd = this.readBuffer.indexOf(crlfDelimiter);
    const lfHeaderEnd = this.readBuffer.indexOf(lfDelimiter);
    const useLf =
      lfHeaderEnd !== -1 && (crlfHeaderEnd === -1 || lfHeaderEnd < crlfHeaderEnd);
    const delimiter = useLf ? lfDelimiter : crlfDelimiter;
    const headerEnd = useLf ? lfHeaderEnd : crlfHeaderEnd;
    if (headerEnd === -1) return false;

    const headerText = this.readBuffer.toString("utf8", 0, headerEnd);
    if (!/^content-length\s*:/im.test(headerText)) {
      return false;
    }

    const contentLength = parseContentLengthHeader(headerText);
    if (contentLength === null) {
      throw new Error("Invalid Content-Length header");
    }

    const bodyStart = headerEnd + delimiter.length;
    const totalLength = bodyStart + contentLength;
    if (this.readBuffer.length < totalLength) {
      return false;
    }

    const body = this.readBuffer.toString("utf8", bodyStart, totalLength);
    this.readBuffer = this.readBuffer.subarray(totalLength);
    this.framingMode = "content-length";
    this.emitParsedMessage(body);
    return true;
  }

  private tryParseNewlineMessage(): boolean {
    const newlineIndex = this.readBuffer.indexOf(0x0a);
    if (newlineIndex === -1) return false;

    const line = this.readBuffer.toString("utf8", 0, newlineIndex).replace(/\r$/, "");
    if (/^content-length\s*:/i.test(line)) {
      return false;
    }

    this.readBuffer = this.readBuffer.subarray(newlineIndex + 1);
    if (!line.trim()) return true;

    this.framingMode = "newline";
    this.emitParsedMessage(line);
    return true;
  }

  private emitParsedMessage(jsonLine: string): void {
    const parsed = JSONRPCMessageSchema.parse(JSON.parse(jsonLine));
    this.onmessage?.(parsed);
  }
}
