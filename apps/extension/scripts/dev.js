process.env.BABEL_ENV = "development";
process.env.NODE_ENV = "development";

const path = require("path");
const fs = require("fs-extra");
const webpack = require("webpack");
const createWebpackConfig = require("../webpack.config");

const projectRoot = path.join(__dirname, "..");
const outputDir = path.join(projectRoot, "build", "production_chrome");

async function syncStaticFiles() {
  const packageJsonPath = path.join(projectRoot, "package.json");
  const manifestTemplatePath = path.join(projectRoot, "src", "manifest.v3.json");
  const packageJson = await fs.readJson(packageJsonPath);
  const manifestTemplate = await fs.readJson(manifestTemplatePath);

  const manifest = {
    ...manifestTemplate,
    version: packageJson.version,
    description: packageJson.description
  };

  await fs.ensureDir(outputDir);
  await fs.copy(path.join(projectRoot, "src", "assets", "icons"), path.join(outputDir, "icons"), {
    overwrite: true
  });
  await fs.writeJson(path.join(outputDir, "manifest.json"), manifest, { spaces: 2 });
}

async function main() {
  await syncStaticFiles();

  const config = createWebpackConfig("development", true);
  const compiler = webpack(config);

  compiler.watch({}, async (error, stats) => {
    if (error) {
      process.stderr.write(`${error.stack || error.message}\n`);
      return;
    }

    if (!stats) {
      return;
    }

    if (stats.hasErrors()) {
      process.stderr.write(`${stats.toString({ all: false, errors: true })}\n`);
      return;
    }

    await syncStaticFiles();
    process.stdout.write("Rebuilt extension bundle and refreshed manifest/icons.\n");
  });

  process.stdout.write(`Watching extension files. Output: ${outputDir}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exit(1);
});
