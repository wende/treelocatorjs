// Generates .res.js + .res.js.map fixtures that mimic ReScript's output
// when configured with `"jsx": { "version": 4, "preserve": true }`.
//
// The real toolchain is `rescript build` against rescript.json. Committing
// pre-built fixtures lets the demo app and Playwright tests run without a
// rescript binary on the developer's PATH. Run `pnpm fixtures` to regenerate
// them after editing the .res files.

import { SourceMapGenerator } from 'source-map'
import { writeFileSync } from 'node:fs'
import { dirname, join, basename } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SRC = join(__dirname, '..', 'src')

/**
 * @typedef Fixture
 * @property {string} name              Module name, e.g. "Button"
 * @property {string} jsCode            JS body (preserved JSX) to write
 * @property {Array<{
 *   generated: { line: number, column: number },
 *   original: { line: number, column: number }
 * }>} mappings
 */

/** @type {Fixture[]} */
const fixtures = [
  {
    name: 'Button',
    jsCode: `import * as React from "react";

function Button(props) {
  return <button className="submit-button">{props.label}</button>;
}

let make = Button;

export { make };
`,
    mappings: [
      // <button> in compiled JS → line 3 col 9 in Button.res
      { generated: { line: 4, column: 9 }, original: { line: 3, column: 2 } },
      { generated: { line: 4, column: 41 }, original: { line: 4, column: 4 } },
    ],
  },
  {
    name: 'Card',
    jsCode: `import * as React from "react";

function Card(props) {
  return (
    <section className="card">
      <header className="card-header">{props.title}</header>
      <div className="card-body">{props.children}</div>
    </section>
  );
}

let make = Card;

export { make };
`,
    mappings: [
      // <section>
      { generated: { line: 5, column: 4 }, original: { line: 3, column: 2 } },
      // <header>
      { generated: { line: 6, column: 6 }, original: { line: 4, column: 4 } },
      // <div>
      { generated: { line: 7, column: 6 }, original: { line: 5, column: 4 } },
    ],
  },
]

for (const fx of fixtures) {
  const jsName = `${fx.name}.res.js`
  const jsPath = join(SRC, jsName)
  const mapPath = `${jsPath}.map`

  writeFileSync(jsPath, fx.jsCode)

  const gen = new SourceMapGenerator({ file: jsName })
  for (const m of fx.mappings) {
    gen.addMapping({
      source: `${fx.name}.res`,
      generated: m.generated,
      original: m.original,
    })
  }
  // Append the sourceMappingURL pragma so dev tools find it.
  const map = JSON.parse(gen.toString())
  writeFileSync(mapPath, JSON.stringify(map, null, 2))

  // Append sourceMappingURL pragma to the JS (matches what rescript emits).
  writeFileSync(
    jsPath,
    `${fx.jsCode}\n//# sourceMappingURL=${basename(mapPath)}\n`
  )

  console.log(`wrote ${jsName} + ${basename(mapPath)}`)
}
