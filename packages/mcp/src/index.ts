#!/usr/bin/env node

import { certificateDiagnostics, loadOrCreateCertificate } from "./certs";
import { ManualMcpServer } from "./manualMcpServer";
import { SessionBroker } from "./sessionBroker";
import {
  BrokerClient,
  LocalSessionBrokerClient,
  RemoteSessionBrokerClient,
} from "./brokerClient";

function log(message: string): void {
  if (process.env.TREELOCATOR_MCP_LOG === "1") {
    console.error(message);
  }
}

function isAddressInUse(error: unknown): boolean {
  const e = error as NodeJS.ErrnoException | undefined;
  return e?.code === "EADDRINUSE";
}

async function main(): Promise<void> {
  const cert = loadOrCreateCertificate();
  log(certificateDiagnostics(cert));

  const broker = new SessionBroker({
    key: cert.key,
    cert: cert.cert,
    host: "127.0.0.1",
    port: 7463,
    path: "/treelocator",
    defaultTimeoutMs: 10_000,
  });
  let brokerForShutdown: SessionBroker | null = broker;
  let brokerClient: BrokerClient;

  try {
    await broker.start();
    const address = broker.getAddress();
    log(
      `TreeLocator MCP bridge listening on wss://${address.host}:${address.port}${address.path}`
    );
    brokerClient = new LocalSessionBrokerClient(broker);
  } catch (error) {
    if (!isAddressInUse(error)) {
      throw error;
    }

    // Another process already owns the bridge port.
    // Start stdio in follower mode and proxy requests to the leader.
    brokerForShutdown = null;
    const proxyClient = new RemoteSessionBrokerClient();
    log("TreeLocator MCP running in proxy mode (existing broker leader detected)");
    brokerClient = proxyClient;
  }

  const server = new ManualMcpServer({ broker: brokerClient, toolTimeoutMs: 10_000 });
  await server.start();

  const shutdown = async () => {
    if (brokerForShutdown) {
      await brokerForShutdown.stop();
    }
    process.exit(0);
  };

  process.on("SIGINT", () => {
    void shutdown();
  });
  process.on("SIGTERM", () => {
    void shutdown();
  });
}

void main().catch((error) => {
  const message = error instanceof Error ? error.stack || error.message : String(error);
  console.error(`TreeLocator MCP failed to start: ${message}`);
  process.exit(1);
});
