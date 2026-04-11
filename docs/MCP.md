# TreeLocator MCP Bridge

TreeLocator can now expose its browser runtime to MCP clients through a local WebSocket bridge.

## Architecture

1. `@treelocator/runtime` opens a browser-side bridge connection to:
   - `wss://127.0.0.1:7463/treelocator` (default)
   - `wss://localhost:7463/treelocator` (fallback)
2. `@treelocator/mcp` hosts:
   - An MCP stdio server for AI clients
   - A local WSS broker for browser runtime sessions
3. MCP tools route command requests to the selected browser session.

## Runtime Configuration

`setup()` accepts:

```ts
setup({
  mcp: {
    enabled: true,                      // default: true
    bridgeUrl: "wss://127.0.0.1:7463/treelocator",
    reconnectMs: 1000,                  // base reconnect delay (exponential backoff)
  },
});
```

## MCP Tools

- `treelocator_list_sessions`
- `treelocator_connect_session`
- `treelocator_get_path`
- `treelocator_get_ancestry`
- `treelocator_get_path_data`
- `treelocator_get_styles`
- `treelocator_get_css_rules`
- `treelocator_get_css_report`
- `treelocator_click`
- `treelocator_hover`
- `treelocator_type`

All element tools accept:

```json
{ "sessionId": "...", "selector": "...", "index": 0 }
```

`sessionId` is optional if a session was selected with `treelocator_connect_session`.

## Local TLS Certificates

`@treelocator/mcp` loads certs from:

- `$TREELOCATOR_MCP_CERT_PATH` / `$TREELOCATOR_MCP_KEY_PATH`, or
- `~/.treelocator/certs/localhost.pem` and `~/.treelocator/certs/localhost-key.pem`

Startup behavior:

1. Reuse existing cert/key files if present
2. Try `mkcert` if available
3. Fall back to self-signed certs and print trust diagnostics

## Why This Avoids CORS Pitfalls

WebSocket bridge traffic does not use standard CORS preflight handling like `fetch`/`XHR`. The relevant concerns are:

- WebSocket origin checks server-side
- Mixed-content/security requirements (`wss` from HTTPS pages)
