import { afterEach, beforeEach, describe, expect, test } from "vitest";
import selfsigned from "selfsigned";
import { WebSocket } from "ws";
import { SessionBroker } from "../src/sessionBroker";

function createTestCert() {
  return selfsigned.generate(
    [{ name: "commonName", value: "localhost" }],
    {
      days: 1,
      keySize: 2048,
      algorithm: "sha256",
      extensions: [
        {
          name: "subjectAltName",
          altNames: [
            { type: 2, value: "localhost" },
            { type: 7, ip: "127.0.0.1" },
          ],
        },
      ],
    }
  );
}

async function waitFor(predicate: () => boolean, timeoutMs = 2_000): Promise<void> {
  const started = Date.now();
  while (!predicate()) {
    if (Date.now() - started > timeoutMs) {
      throw new Error("Timed out waiting for condition");
    }
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
}

describe("SessionBroker", () => {
  let broker: SessionBroker | null = null;
  let client: WebSocket | null = null;
  const sessionId = "test-session";

  beforeEach(async () => {
    const cert = createTestCert();
    broker = new SessionBroker({
      host: "127.0.0.1",
      port: 0,
      path: "/treelocator",
      key: cert.private,
      cert: cert.cert,
      defaultTimeoutMs: 150,
    });
    await broker.start();

    const address = broker.getAddress();
    client = new WebSocket(
      `wss://127.0.0.1:${address.port}/treelocator`,
      undefined,
      { rejectUnauthorized: false }
    );
    await new Promise<void>((resolve, reject) => {
      client?.once("open", () => resolve());
      client?.once("error", reject);
    });

    client.send(
      JSON.stringify({
        type: "hello",
        sessionId,
        url: "https://example.test",
        title: "Test page",
        runtimeVersion: "0.5.2",
        capabilities: ["get_path"],
        connectedAt: new Date().toISOString(),
      })
    );

    await waitFor(() => Boolean(broker?.hasSession(sessionId)));
  });

  afterEach(async () => {
    if (client && client.readyState === WebSocket.OPEN) {
      client.close();
    }
    client = null;
    if (broker) {
      await broker.stop();
    }
    broker = null;
  });

  test("lists sessions after hello", () => {
    const sessions = broker?.listSessions() || [];
    expect(sessions).toHaveLength(1);
    expect(sessions[0]?.sessionId).toBe(sessionId);
    expect(sessions[0]?.url).toBe("https://example.test");
  });

  test("routes command and resolves response", async () => {
    client?.on("message", (raw) => {
      const parsed = JSON.parse(raw.toString()) as {
        id: string;
        type: string;
      };
      if (parsed.type !== "command") return;
      client?.send(
        JSON.stringify({
          type: "response",
          id: parsed.id,
          ok: true,
          result: { value: "ok" },
        })
      );
    });

    const result = await broker?.sendCommand(sessionId, "get_path", {
      selector: "#target",
    });
    expect(result).toEqual({ value: "ok" });
  });

  test("returns timeout when no response arrives", async () => {
    await expect(
      broker?.sendCommand(
        sessionId,
        "get_path",
        { selector: "#target" },
        { timeoutMs: 50 }
      )
    ).rejects.toMatchObject({
      code: "command_timeout",
    });
  });

  test("rejects pending command when session disconnects", async () => {
    const commandPromise = broker?.sendCommand(
      sessionId,
      "get_path",
      { selector: "#target" },
      { timeoutMs: 1_000 }
    );

    client?.close();

    await expect(commandPromise).rejects.toMatchObject({
      code: "session_disconnected",
    });
  });
});
