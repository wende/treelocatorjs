process.env.BABEL_ENV = "production";
process.env.NODE_ENV = "production";

const path = require("path");
const fs = require("fs-extra");
const webpack = require("webpack");
const createWebpackConfig = require("../webpack.config");

const projectRoot = path.join(__dirname, "..");
const outputDir = path.join(projectRoot, "build", "production_chrome");

function runWebpack(config) {
  return new Promise((resolve, reject) => {
    webpack(config, (error, stats) => {
      if (error) {
        reject(error);
        return;
      }

      if (!stats || stats.hasErrors()) {
        reject(new Error(stats ? stats.toString({ all: false, errors: true }) : "Webpack failed."));
        return;
      }

      resolve(stats);
    });
  });
}

async function writeManifest() {
  const packageJsonPath = path.join(projectRoot, "package.json");
  const manifestTemplatePath = path.join(projectRoot, "src", "manifest.v3.json");
  const packageJson = await fs.readJson(packageJsonPath);
  const manifestTemplate = await fs.readJson(manifestTemplatePath);

  const manifest = {
    ...manifestTemplate,
    version: packageJson.version,
    description: packageJson.description
  };

  await fs.writeJson(path.join(outputDir, "manifest.json"), manifest, { spaces: 2 });
}

async function copyAssets() {
  const iconsSource = path.join(projectRoot, "src", "assets", "icons");
  const iconsDest = path.join(outputDir, "icons");

  await fs.copy(iconsSource, iconsDest, { overwrite: true });
}

async function main() {
  const config = createWebpackConfig("production", false);

  await runWebpack(config);
  await copyAssets();
  await writeManifest();

  process.stdout.write(`Built extension in ${outputDir}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exit(1);
});
