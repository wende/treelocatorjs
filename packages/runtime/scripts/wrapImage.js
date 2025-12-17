/* eslint-disable no-console */
/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */

const fs = require("fs-extra");
const path = require("path");

async function run() {
  const imagePath = path.join(__dirname, "../src/assets/tree-icon.png");
  const content = await fs.readFile(imagePath);
  const base64 = content.toString("base64");
  const dataUrl = `data:image/png;base64,${base64}`;
  const wrapped = `const treeIcon: string = "${dataUrl}";\nexport default treeIcon;`;

  await fs.writeFile("./src/_generated_tree_icon.ts", wrapped);
  console.log("Tree icon file generated");
}

if (process.env.WATCH) {
  const imagePath = path.join(__dirname, "../src/assets/tree-icon.png");
  fs.watchFile(imagePath, run);
}

run();
