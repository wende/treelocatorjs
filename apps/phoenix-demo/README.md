# Phoenix LiveView + TreeLocatorJS Demo

This demo showcases the new Phoenix LiveView server component tracking feature integrated with TreeLocatorJS.

## 🎉 What's New

TreeLocatorJS now displays **unified server → client component ancestry chains**! When you Alt+click on elements in Phoenix LiveView apps, you'll see:

- **Phoenix server components** (e.g., `AppWeb.CoreComponents.button`)
- **Source locations** (e.g., `lib/app_web/core_components.ex:156`)
- **Caller locations** (where the component was invoked)
- **Client components** (React, Vue, etc.) in the same tree

## 🚀 Running the Demo

The server is already running at:

**http://localhost:8080/**

Open this URL in your browser to test the feature!

## 🧪 How to Test

1. **Open the demo** in your browser: http://localhost:8080/
2. **Hold Alt** (Option on Mac) and click on any element
3. **Check your clipboard** - it will contain the unified component ancestry!

### Example Output

When you Alt+click the "Edit Profile" button, you'll see:

```
header [Phoenix: AppWeb.CoreComponents.header]
  at lib/app_web/core_components.ex:45 (called from) lib/app_web/live/home_live.ex:15
└─ div.card [Phoenix: AppWeb.CoreComponents.card]
    at lib/app_web/core_components.ex:78 (called from) lib/app_web/live/home_live.ex:20
  └─ button [Phoenix: AppWeb.CoreComponents.button]
      at lib/app_web/core_components.ex:156 (called from) lib/app_web/live/home_live.ex:30
```

## 🔍 What to Look For

### Server Component Annotations

The demo HTML includes Phoenix LiveView's debug annotations (what you get when `debug_heex_annotations: true` is set):

```html
<!-- @caller lib/app_web/live/home_live.ex:30 -->
<!-- <AppWeb.CoreComponents.button> lib/app_web/core_components.ex:156 -->
<button data-phx-loc="156">Edit Profile</button>
<!-- </AppWeb.CoreComponents.button> -->
```

### Phoenix Detection

TreeLocatorJS automatically detects Phoenix LiveView by looking for:
- `window.liveSocket` (Phoenix JS client)
- `data-phx-main` or `data-phx-session` attributes
- Phoenix debug comment patterns

### Test Cases in the Demo

1. **Header** - Simple Phoenix component
2. **Cards** - Nested Phoenix components
3. **Buttons** - Multiple instances of the same component
4. **Lists with Badges** - Deeply nested component hierarchy

## 🛠️ Technical Details

### How It Works

1. **Comment Parser**: Parses HTML comments above each element
2. **Pattern Matching**: Recognizes Phoenix patterns:
   - `@caller lib/app_web/home_live.ex:20`
   - `<AppWeb.CoreComponents.header> lib/app_web/core_components.ex:45`
3. **Data Merging**: Combines server + client component data
4. **Unified Display**: Shows complete ancestry in one tree

### Architecture

- **No server modifications needed** - uses existing Phoenix debug features
- **Backward compatible** - works without server components
- **Framework agnostic** - works with React, Vue, Svelte on top of Phoenix

## 🎯 Next Steps for Real Phoenix App

To use this in a real Phoenix LiveView application:

1. **Enable debug annotations** in `config/dev.exs`:
   ```elixir
   config :phoenix_live_view,
     debug_heex_annotations: true
   ```

2. **Install TreeLocatorJS runtime**:
   ```bash
   npm install @treelocator/runtime
   ```

3. **Import in your app.js**:
   ```javascript
   import { initRuntime } from "@treelocator/runtime";
   initRuntime();
   ```

That's it! Alt+click will now show server + client component trees.

## 🐛 Troubleshooting

If server components aren't showing:

1. Check browser console for "Phoenix LiveView detected: true"
2. Verify HTML comments are present (View Source)
3. Ensure `data-phx-main` or `data-phx-session` is on page
4. Check that `debug_heex_annotations` is enabled in Phoenix config

## 🎨 Browser API

You can also access component data programmatically:

```javascript
// Get formatted ancestry path
const path = window.__treelocator__.getPath('button');

// Get raw ancestry data
const ancestry = window.__treelocator__.getAncestry(document.querySelector('button'));
```

## 📚 Resources

- [Phoenix LiveView Debug Options](https://hexdocs.pm/phoenix_live_view/Phoenix.Component.html)
- [TreeLocatorJS Documentation](../../README.md)
- [Implementation Plan](../../docs/phoenix-integration-plan.md)
