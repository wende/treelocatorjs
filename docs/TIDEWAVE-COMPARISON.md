# Tidewave vs TreeLocatorJS Implementation Comparison

**Date:** December 24, 2025
**Research Scope:** Analysis of Tidewave's open source repositories (Apache 2.0)

---

## Executive Summary

**TL;DR:** Tidewave's actual DOM inspection feature is **proprietary** (served from `tidewave.ai/tc/tc.js`). Their open source packages are primarily **MCP servers** that provide backend code introspection tools (docs, source location, SQL queries, eval), NOT client-side DOM tracking.

For template tracking (Django/Jinja2), they use **HTML comment injection**, which we could adapt for Rails/HTMX.

---

## Repository Analysis

### 1. tidewave_phoenix (Elixir)

**License:** Apache 2.0
**Purpose:** MCP server for Phoenix LiveView projects

**What it does:**
- ✅ HTTP middleware (`plug Tidewave` in endpoint.ex)
- ✅ Modifies CSP headers (adds `unsafe-eval`, removes `frame-ancestors`)
- ✅ Serves `/tidewave` route with MCP tools
- ❌ **NO custom DOM attribute/comment injection**

**Element Tracking:**
- **Relies 100% on Phoenix's built-in `debug_heex_annotations`**
- Just tells users to enable: `config :phoenix_live_view, debug_heex_annotations: true`
- Reads Phoenix's HTML comments: `<!-- @caller file.ex:123 -->`

**MCP Tools Provided:**
1. `get_source_location` - Find function/module definitions
2. `get_docs` - Extract Elixir documentation
3. `project_eval` - Run Elixir code in app context
4. `execute_sql_query` - Query Ecto database
5. `get_logs` - Application logs

**Comparison with TreeLocatorJS:**
| Feature | Tidewave Phoenix | TreeLocatorJS |
|---------|------------------|---------------|
| DOM tracking | Phoenix built-in | Phoenix built-in |
| Custom injection | ❌ No | ❌ No |
| Client-side parser | Proprietary (`tc.js`) | ✅ Open source |
| MCP backend | ✅ Yes | ❌ No |
| Code required | Elixir | None (pure client-side) |

**Verdict:** Same approach as ours. No code to reuse.

---

### 2. tidewave_rails (Ruby)

**License:** Apache 2.0
**Purpose:** MCP server for Rails projects

**What it does:**
- ✅ Rack middleware for Rails
- ✅ Modifies CSP headers (same as Phoenix)
- ✅ Serves `/tidewave` route with MCP tools
- ❌ **NO ERB/view helper for template tracking**
- ❌ **NO HTML attribute/comment injection**

**MCP Tools Provided:**
1. `get_source_location` - Find Ruby class/method definitions
2. `get_docs` - Extract YARD docs
3. `project_eval` - Run Ruby code in app context
4. `execute_sql_query` - Query Active Record/Sequel
5. `get_logs` - Application logs
6. `get_models` - List database models

**What's Missing:**
- No view/template tracking code
- No ERB helpers
- No HTML injection mechanism

**Comparison with TreeLocatorJS:**
| Feature | Tidewave Rails | TreeLocatorJS |
|---------|----------------|---------------|
| Template tracking | ❌ None | Planned |
| View helpers | ❌ None | Planned |
| Client-side parser | Proprietary (`tc.js`) | ✅ Open source |
| MCP backend | ✅ Yes | ❌ No |

**Verdict:** No template tracking implementation. Nothing to reuse for our Rails support.

---

### 3. tidewave_js (TypeScript/JavaScript)

**License:** Apache 2.0
**Purpose:** MCP server for Next.js/Vite projects

**What it does:**
- ✅ Vite plugin integration
- ✅ Next.js API route handlers (`/api/tidewave/*`)
- ✅ Serves HTML with MCP tools at `/tidewave`
- ✅ OpenTelemetry instrumentation
- ❌ **NO client-side DOM inspection code**

**HTML Served:**
```html
<meta name="tidewave:config" content='{"project_name":"...","framework_type":"..."}' />
<script type="module" src="https://tidewave.ai/tc/tc.js"></script>
```

**The Proprietary Part:**
The actual DOM inspection happens in **`tidewave.ai/tc/tc.js`** (closed source).

**MCP Tools Provided:**
1. `docs` - Extract TypeScript/JSDoc documentation
2. `source` - Find source file paths for modules
3. `eval` - Evaluate JS/TS code in project context
4. `logs` - Application logs

**What's Missing:**
- No client-side DOM tracking code
- No `data-*` attribute injection
- No element inspector

**Comparison with TreeLocatorJS:**
| Feature | Tidewave JS | TreeLocatorJS |
|---------|-------------|---------------|
| Client DOM tracking | Proprietary | ✅ Open source |
| Next.js data attributes | Unknown (proprietary) | ✅ `@locator/webpack-loader` |
| MCP backend | ✅ Yes | ❌ No |
| Framework detection | Unknown | ✅ 5 frameworks |

**Verdict:** No DOM inspection code. The actual "click element → find source" feature is proprietary.

---

### 4. tidewave_python (Python)

**License:** Apache 2.0
**Purpose:** MCP server for Django/Flask/FastAPI projects

**What it does:**
- ✅ WSGI/ASGI middleware
- ✅ Serves `/tidewave` route with MCP tools
- ✅ **TEMPLATE TRACKING via HTML comments** 🎯
- ✅ Jinja2 extension
- ✅ Django template renderer monkey-patch

**Element Tracking - THE INTERESTING PART:**

#### Jinja2 Extension (`src/tidewave/jinja2/__init__.py`)

**Approach:** AST manipulation to inject `{% template_debug 'filename' %}` tags

**HTML Output:**
```html
<!-- TEMPLATE: templates/base.html -->
<html>
  <!-- BLOCK: content, TEMPLATE: templates/index.html -->
  <div>Hello World</div>
  <!-- END BLOCK: content -->
</html>
<!-- END TEMPLATE: templates/base.html -->

<!-- SUBTEMPLATE: templates/index.html -->
```

**Format:**
- Base templates: `<!-- TEMPLATE: {path} -->` ... `<!-- END TEMPLATE: {path} -->`
- Child templates: `<!-- SUBTEMPLATE: {path} -->`
- Blocks: `<!-- BLOCK: {name}, TEMPLATE: {path} -->` ... `<!-- END BLOCK: {name} -->`

**Implementation:**
1. Preprocess template source with `{% template_debug %}` wrapper
2. Custom Jinja2 extension that renders comment tags
3. Only annotates blocks containing HTML (`if "<" in content`)
4. Relative path normalization

#### Django Templates (`src/tidewave/django/templates.py`)

**Approach:** Monkey-patch `Template.render()` and `BlockNode.render()`

**HTML Output:** Same format as Jinja2

**Implementation:**
1. Wrap original render methods
2. Insert HTML comments before/after rendered content
3. Traverse `ExtendsNode` to get inheritance chain
4. Relative path resolution using Django's `BASE_DIR`

**Comparison with TreeLocatorJS:**
| Feature | Tidewave Python | TreeLocatorJS |
|---------|-----------------|---------------|
| Template tracking | ✅ HTML comments | ❌ Not implemented |
| Format | `<!-- TEMPLATE: path -->` | N/A |
| Django support | ✅ Yes | Planned |
| Flask/Jinja2 | ✅ Yes | Planned |
| Client parser | Proprietary | Would need to write |

**Verdict:** ✅ **THIS IS USEFUL!** Their HTML comment approach for Django/Jinja2 is reusable (Apache 2.0 licensed).

---

## What Can We Reuse?

### ✅ **Reusable (Apache 2.0):**

**1. Template Tracking Pattern (Python):**
- HTML comment format: `<!-- TEMPLATE: path -->` / `<!-- BLOCK: name, TEMPLATE: path -->`
- Path normalization approach
- Only annotate HTML-containing blocks
- Template inheritance chain tracking

**Use Case:**
- Django support (future)
- Flask/Jinja2 support (future)
- Rails ERB (adapt pattern)
- HTMX with any template engine (adapt pattern)

**Required Attribution:**
```
# Adapted from Tidewave (Apache 2.0)
# Copyright 2025 Dashbit
# https://github.com/tidewave-ai/tidewave_python
```

**2. Concepts (Not Code):**
- Phoenix: Use built-in `debug_heex_annotations` (we already do this)
- Next.js: Configuration setup patterns (we already have our own)

### ❌ **NOT Reusable:**

**1. MCP Server Implementation:**
- Not relevant to TreeLocatorJS (we're client-side only)
- Their backend tools (`get_docs`, `eval`, `execute_sql_query`) are for AI agents, not UI→Source mapping

**2. Client-Side DOM Inspector:**
- **Proprietary** - served from `tidewave.ai/tc/tc.js`
- This is their $10/mo product
- We already have our own open source implementation

**3. Rails Template Tracking:**
- **Doesn't exist** in their open source
- We'll need to implement from scratch

---

## Proposed Action Plan

### Phase 1: Document What We Have ✅
- [x] Phoenix LiveView (complete)
- [x] Next.js RSC (complete)
- [ ] Phoenix setup guide

### Phase 2: Django/Flask Support (Using Tidewave Pattern)

**Approach:** Adapt Tidewave's HTML comment injection for Django/Jinja2

**Implementation:**
1. **Python Package:** `@treelocator/python`
   - Django middleware (similar to Tidewave's)
   - Jinja2 extension (similar to Tidewave's)
   - HTML comment injection
   - Relative path normalization

2. **Client-Side Parser:** `packages/runtime/src/adapters/django/`
   - Parse HTML comments: `<!-- TEMPLATE: path -->`
   - Build ancestry chain
   - Integrate with `formatAncestryChain.ts`

3. **License Compliance:**
   - Include Apache 2.0 license
   - Add attribution comments
   - Document what was adapted

**Effort:** 1-2 weeks

### Phase 3: Rails Support (Original Implementation)

**Approach:** Build from scratch (no Tidewave code exists)

**Implementation:**
1. **Ruby Gem:** `treelocator-rails`
   - ERB template processor
   - Haml/Slim support
   - HTML comment or `data-*` attribute injection
   - View helper methods

2. **Client-Side Parser:** `packages/runtime/src/adapters/rails/`
   - Parse Rails-specific format
   - Turbo/Stimulus integration
   - Listen for `turbo:load` events

**Effort:** 2-3 weeks

### Phase 4: HTMX Support (Framework-Agnostic)

**Approach:** Template plugins for popular backends

**Implementation:**
1. Define standard format: `data-locator-file`, `data-locator-line`
2. Create template plugins:
   - Python: Django template tag, Jinja2 extension (reuse Django work)
   - Go: Template wrapper
   - Node.js: EJS/Handlebars/Pug plugins
3. Client-side: Parse `data-locator-*` attributes
4. Hook into HTMX: `htmx:afterSwap` event

**Effort:** 1 week + 1 week per backend

---

## Comparison Matrix: Tidewave vs TreeLocatorJS

| Feature | Tidewave | TreeLocatorJS |
|---------|----------|---------------|
| **Cost** | $10/mo + AI provider | Free |
| **License** | MCP tools: Apache 2.0<br>Inspector: Proprietary | MIT |
| **Architecture** | MCP server + proprietary client | Pure client-side |
| **DOM Inspection** | Proprietary (`tc.js`) | Open source |
| **Browser API** | ❌ No | ✅ Yes (`window.__treelocator__`) |
| **Phoenix LiveView** | ✅ Yes (built-in) | ✅ Yes (built-in) |
| **Next.js RSC** | ✅ Yes (unknown) | ✅ Yes (`@locator/webpack-loader`) |
| **Django** | ✅ HTML comments | Planned (can reuse pattern) |
| **Flask/Jinja2** | ✅ HTML comments | Planned (can reuse pattern) |
| **Rails** | ❌ No template tracking | Planned (from scratch) |
| **React** | ✅ Yes | ✅ Yes |
| **Vue/Svelte/Preact/Solid** | ❌ No | ✅ Yes |
| **Backend Tools** | ✅ MCP (docs, eval, SQL) | ❌ No |
| **AI Integration** | ✅ Built for AI agents | ❌ No |

---

## Conclusion

### What We Learned:

1. **Tidewave's "inspector" is proprietary** - Their open source repos are MCP servers, not DOM trackers
2. **Phoenix approach is identical** - Both use built-in `debug_heex_annotations`
3. **Django/Jinja2 has reusable patterns** - HTML comment injection is Apache 2.0 licensed
4. **Rails has no implementation** - We're on our own
5. **Next.js approach is unknown** - Their client-side code is closed source

### Our Competitive Advantage:

1. ✅ **Completely free and open source**
2. ✅ **Pure client-side** (no server component needed)
3. ✅ **5 client frameworks** (React, Vue, Svelte, Preact, Solid)
4. ✅ **Browser automation API** (`window.__treelocator__`)
5. ✅ **Full ancestry chain** (not just single location)

### Recommended Next Steps:

**Immediate:**
1. Commit updated `docs/SERVERSIDE.md`
2. Test Phoenix LiveView with real Elixir app
3. Write Phoenix setup guide

**Short-term (if demand exists):**
1. Implement Django/Flask support using Tidewave's pattern (with proper attribution)
2. Test with real Django/Flask apps

**Medium-term:**
1. Implement Rails support from scratch
2. Implement HTMX support

**Not Needed:**
- Don't build MCP server (not our focus)
- Don't build AI agent tools (not our focus)
- Focus on UI→Source mapping (our core value)

---

**Last Updated:** December 24, 2025
