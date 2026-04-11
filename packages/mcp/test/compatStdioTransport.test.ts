import { describe, expect, test } from "vitest";
import { PassThrough } from "node:stream";
import { CompatStdioServerTransport } from "../src/compatStdioTransport";

function createTransportHarness() {
  const stdin = new PassThrough();
  const stdout = new PassThrough();
  const transport = new CompatStdioServerTransport(
    stdin as any,
    stdout as any
  );

  const outChunks: string[] = [];
  stdout.on("data", (chunk) => outChunks.push(chunk.toString("utf8")));

  return { stdin, stdout, transport, outChunks };
}

describe("CompatStdioServerTransport", () => {
  test("parses newline-delimited input and replies in newline mode", async () => {
    const { stdin, transport, outChunks } = createTransportHarness();
    const received: any[] = [];

    transport.onmessage = (msg) => {
      received.push(msg);
    };

    await transport.start();
    stdin.write(
      JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {},
      }) + "\n"
    );

    expect(received).toHaveLength(1);
    await transport.send({ jsonrpc: "2.0", id: 1, result: { ok: true } });
    const out = outChunks.join("");
    expect(out).not.toContain("Content-Length:");
    expect(out.endsWith("\n")).toBe(true);
    expect(JSON.parse(out.trimEnd())).toEqual({
      jsonrpc: "2.0",
      id: 1,
      result: { ok: true },
    });
  });

  test("parses content-length input and replies in content-length mode", async () => {
    const { stdin, transport, outChunks } = createTransportHarness();
    const received: any[] = [];
    transport.onmessage = (msg) => {
      received.push(msg);
    };

    await transport.start();
    const payload = JSON.stringify({
      jsonrpc: "2.0",
      id: 2,
      method: "initialize",
      params: {},
    });
    stdin.write(`Content-Length: ${Buffer.byteLength(payload, "utf8")}\r\n\r\n${payload}`);

    expect(received).toHaveLength(1);
    await transport.send({ jsonrpc: "2.0", id: 2, result: { ok: true } });
    expect(outChunks.join("")).toContain("Content-Length:");
  });

  test("parses LF-only content-length framing", async () => {
    const { stdin, transport } = createTransportHarness();
    const received: any[] = [];
    transport.onmessage = (msg) => {
      received.push(msg);
    };

    await transport.start();
    const payload = JSON.stringify({
      jsonrpc: "2.0",
      id: 3,
      method: "initialize",
      params: {},
    });
    stdin.write(`Content-Length: ${Buffer.byteLength(payload, "utf8")}\n\n${payload}`);

    expect(received).toHaveLength(1);
  });
});
