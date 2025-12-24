# Demo Projects

This directory contains three minimal demo projects showcasing different web frameworks:

## Projects

### 1. Phoenix LiveView (`phoenix_demo/`)
- **Framework**: Phoenix LiveView (Elixir)
- **Port**: 4000
- **Features**: Real-time counter with server-side state management
- **Status**: ⚠️ Server runs but requires proper Erlang/OTP version for full functionality

**Start server:**
```bash
cd phoenix_demo
mix phx.server
```

**Note:** The Phoenix project has an Erlang/OTP compatibility issue with asset compilation (esbuild/tailwind). The server runs and serves HTML, but LiveView interactivity requires newer Erlang/OTP version.

### 2. Next.js (`nextjs-demo/`)
- **Framework**: Next.js 16 with React 19
- **Port**: 3000
- **Features**: Client-side counter with React state management
- **Status**: ✅ Fully functional

**Start server:**
```bash
cd nextjs-demo
pnpm dev
```

### 3. Ruby on Rails (`rails-demo/`)
- **Framework**: Ruby on Rails 8.1
- **Port**: 3001
- **Features**: Counter with vanilla JavaScript
- **Status**: ✅ Fully functional

**Start server:**
```bash
cd rails-demo
PORT=3001 rails server
```

## E2E Tests

Playwright tests are located in `e2e-tests/`. These verify that all three applications load correctly and the counter functionality works.

**Run tests:**
```bash
cd e2e-tests
pnpm test
```

**Test Results:**
- ⚠️ Phoenix LiveView: Skipped (requires Erlang/OTP fix)
- ✅ Next.js: Passing
- ✅ Ruby on Rails: Passing

## Requirements

- **Phoenix**: Elixir 1.15+ (installed via asdf), Mix, Phoenix 1.8+
- **Next.js**: Node.js, pnpm
- **Rails**: Ruby 3.2+, Rails 8+
- **Tests**: Playwright with Chromium

## Quick Start

All servers are currently running:
- Phoenix LiveView: http://localhost:4000
- Next.js: http://localhost:3000
- Rails: http://localhost:3001

Each demo features a simple counter with Increment, Decrement, and Reset buttons.
