import { afterEach, beforeEach, describe, expect, test } from "vitest";
import selfsigned from "selfsigned";
import { WebSocket } from "ws";
import { SessionBroker } from "../src/sessionBroker";
import { RemoteSessionBrokerClient } from "../src/brokerClient";

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

describe("RemoteSessionBrokerClient", () => {
  let broker: SessionBroker | null = null;
  let runtimeSocket: WebSocket | null = null;
  let client: RemoteSessionBrokerClient | null = null;
  const sessionId = "proxy-session";

  beforeEach(async () => {
    const cert = createTestCert();
    broker = new SessionBroker({
      host: "127.0.0.1",
      port: 0,
      path: "/treelocator",
      key: cert.private,
      cert: cert.cert,
    });
    await broker.start();
    const address = broker.getAddress();

    runtimeSocket = new WebSocket(
      `wss://127.0.0.1:${address.port}/treelocator`,
      undefined,
      { rejectUnauthorized: false }
    );
    await new Promise<void>((resolve, reject) => {
      runtimeSocket?.once("open", () => resolve());
      runtimeSocket?.once("error", reject);
    });
    runtimeSocket.send(
      JSON.stringify({
        type: "hello",
        sessionId,
        url: "https://proxy.test",
        title: "Proxy Test",
        runtimeVersion: "0.5.2",
        capabilities: ["get_path"],
        connectedAt: new Date().toISOString(),
      })
    );
    await waitFor(() => Boolean(broker?.hasSession(sessionId)));

    client = new RemoteSessionBrokerClient({
      controlUrls: [
        `https://127.0.0.1:${address.port}/treelocator-control`,
      ],
    });
  });

  afterEach(async () => {
    if (runtimeSocket && runtimeSocket.readyState === WebSocket.OPEN) {
      runtimeSocket.close();
    }
    runtimeSocket = null;
    if (broker) {
      await broker.stop();
    }
    broker = null;
    client = null;
  });

  test("lists and resolves sessions over control endpoint", async () => {
    const sessions = await client?.listSessions();
    expect(sessions?.some((session) => session.sessionId === sessionId)).toBe(true);

    const session = await client?.getSession(sessionId);
    expect(session?.url).toBe("https://proxy.test");
  });

  test("forwards commands via leader control endpoint", async () => {
    runtimeSocket?.on("message", (raw) => {
      const message = JSON.parse(raw.toString()) as { type: string; id?: string };
      if (message.type !== "command" || !message.id) return;
      runtimeSocket?.send(
        JSON.stringify({
          type: "response",
          id: message.id,
          ok: true,
          result: { proxied: true },
        })
      );
    });

    const result = await client?.sendCommand(sessionId, "get_path", {
      selector: "#target",
    });
    expect(result).toEqual({ proxied: true });
  });
});
