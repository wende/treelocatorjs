import fs from "fs";
import path from "path";
import pc from "picocolors";

export function readPackageJson(dir: string): Record<string, any> | null {
  const pkgPath = path.join(dir, "package.json");
  try {
    return JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
  } catch {
    return null;
  }
}

export function exitWithError(message: string): never {
  console.error(pc.red(message));
  process.exit(1);
}
