import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import selfsigned from "selfsigned";

export interface LocalCertificate {
  key: string;
  cert: string;
  keyPath: string;
  certPath: string;
  source: "existing" | "mkcert" | "selfsigned";
  trusted: boolean;
}

const CERT_DIR = path.join(os.homedir(), ".treelocator", "certs");
const DEFAULT_CERT_PATH = path.join(CERT_DIR, "localhost.pem");
const DEFAULT_KEY_PATH = path.join(CERT_DIR, "localhost-key.pem");

function readIfExists(filePath: string): string | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return null;
  }
}

function getConfiguredPaths(): { certPath: string; keyPath: string } {
  const certPath = process.env.TREELOCATOR_MCP_CERT_PATH || DEFAULT_CERT_PATH;
  const keyPath = process.env.TREELOCATOR_MCP_KEY_PATH || DEFAULT_KEY_PATH;
  return { certPath, keyPath };
}

function tryCreateWithMkcert(certPath: string, keyPath: string): boolean {
  try {
    execFileSync(
      "mkcert",
      [
        "-cert-file",
        certPath,
        "-key-file",
        keyPath,
        "localhost",
        "127.0.0.1",
        "::1",
      ],
      { stdio: "ignore" }
    );
    return true;
  } catch {
    return false;
  }
}

function createSelfSigned(certPath: string, keyPath: string): LocalCertificate {
  const certData = selfsigned.generate(
    [{ name: "commonName", value: "localhost" }],
    {
      days: 365,
      keySize: 2048,
      algorithm: "sha256",
      extensions: [
        {
          name: "subjectAltName",
          altNames: [
            { type: 2, value: "localhost" },
            { type: 7, ip: "127.0.0.1" },
            { type: 7, ip: "::1" },
          ],
        },
      ],
    }
  );

  fs.writeFileSync(keyPath, certData.private, "utf8");
  fs.writeFileSync(certPath, certData.cert, "utf8");

  return {
    key: certData.private,
    cert: certData.cert,
    keyPath,
    certPath,
    source: "selfsigned",
    trusted: false,
  };
}

export function loadOrCreateCertificate(): LocalCertificate {
  const { certPath, keyPath } = getConfiguredPaths();
  fs.mkdirSync(path.dirname(certPath), { recursive: true });
  fs.mkdirSync(path.dirname(keyPath), { recursive: true });

  const existingCert = readIfExists(certPath);
  const existingKey = readIfExists(keyPath);
  if (existingCert && existingKey) {
    return {
      key: existingKey,
      cert: existingCert,
      keyPath,
      certPath,
      source: "existing",
      trusted: true,
    };
  }

  if (tryCreateWithMkcert(certPath, keyPath)) {
    const cert = readIfExists(certPath);
    const key = readIfExists(keyPath);
    if (cert && key) {
      return {
        key,
        cert,
        keyPath,
        certPath,
        source: "mkcert",
        trusted: true,
      };
    }
  }

  return createSelfSigned(certPath, keyPath);
}

export function certificateDiagnostics(cert: LocalCertificate): string {
  if (cert.trusted) {
    return `TreeLocator MCP WSS certificate loaded (${cert.source})\n  cert: ${cert.certPath}\n  key: ${cert.keyPath}`;
  }

  return [
    "TreeLocator MCP is using a self-signed TLS certificate.",
    "HTTPS pages may reject WSS until this certificate is trusted.",
    `  cert: ${cert.certPath}`,
    `  key: ${cert.keyPath}`,
    "Recommended one-time setup:",
    "  1. Install mkcert: https://github.com/FiloSottile/mkcert",
    "  2. Run: mkcert -install",
    `  3. Restart this server so it regenerates trusted certs at ${path.dirname(cert.certPath)}`,
  ].join("\n");
}
