# Contributing to TreeLocatorJS

Thank you for considering contributing to TreeLocatorJS! This document provides guidelines and instructions for contributing.

## Philosophy

TreeLocatorJS is a **focused fork** that emphasizes:
- **Simplicity** - Keep the core feature (Alt+click to copy ancestry) simple and reliable
- **Developer Experience** - Prioritize ease of use and integration
- **Zero Configuration** - Works out of the box with minimal setup
- **Performance** - Minimal runtime overhead

Contributions should align with this philosophy. We're not looking to add every possible feature - we want to do one thing exceptionally well.

## Getting Started

### Prerequisites

- Node.js ≥ 22.0.0
- pnpm 8.7.5+

### Setup

```bash
# Clone the repository
git clone https://github.com/wende/treelocatorjs.git
cd treelocatorjs

# Install dependencies
pnpm install

# Run in development mode
pnpm dev

# Build all packages
pnpm build

# Run tests
pnpm test
```

## Development Workflow

### Project Structure

```
treelocatorjs/
├── packages/
│   ├── runtime/          # Core runtime (Alt+click handler, UI, browser API)
│   ├── shared/           # Shared types and utilities
│   ├── babel-jsx/        # Babel plugin for JSX tracking
│   ├── webpack-loader/   # Webpack integration
│   ├── init/             # Setup CLI tool
│   └── react-devtools-hook/ # React DevTools integration
├── apps/                 # Demo applications for testing
└── playwright/           # E2E tests
```

### Making Changes

1. **Create a branch** for your feature or fix:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following our code style:
   - Use TypeScript for type safety
   - Follow existing code patterns
   - Keep changes focused and minimal

3. **Test your changes**:
   ```bash
   # Unit tests
   pnpm test

   # E2E tests
   cd apps/playwright && pnpm test

   # Manual testing with demo apps
   cd apps/vite-react-project && pnpm dev
   ```

4. **Commit your changes** with a clear message:
   ```bash
   git commit -m "Add feature: description of what you did"
   ```

5. **Push and create a Pull Request**:
   ```bash
   git push origin feature/your-feature-name
   ```

## Types of Contributions

### Bug Fixes
- Always welcome!
- Include a test case that reproduces the bug
- Reference the issue number in your PR

### Features
- **Discuss first!** Open an issue to discuss the feature before implementing
- Ensure it aligns with the project philosophy
- Include tests and documentation
- Consider impact on bundle size and performance

### Documentation
- Fix typos, improve clarity, add examples
- Update README.md, CLAUDE.md, or inline comments
- No need for prior discussion

### Tests
- Add missing test coverage
- Improve existing tests
- E2E tests for framework integrations

## Code Style

- **TypeScript** - All code should be properly typed
- **Formatting** - Run `pnpm format` before committing
- **Linting** - Run `pnpm lint` and fix any issues
- **Comments** - Add comments for complex logic, avoid obvious comments
- **Naming** - Use descriptive variable and function names

## Testing Guidelines

### Unit Tests
- Write tests in Vitest (for runtime) or Jest (for babel plugin)
- Test edge cases and error conditions
- Aim for high coverage on critical paths

### E2E Tests
- Use Playwright for framework integration tests
- Test real-world usage scenarios
- Cover all supported frameworks (React, Vue, Svelte, etc.)

### Manual Testing
Use the demo apps in `apps/` to manually verify:
- Alt+click functionality works
- Tree icon toggle works
- Browser API is accessible
- No console errors
- No visual glitches

## Pull Request Process

1. **Fill out the PR template** with:
   - Description of changes
   - Related issue number
   - Testing performed
   - Breaking changes (if any)

2. **Ensure CI passes**:
   - All tests pass
   - Linting passes
   - Build succeeds

3. **Wait for review** - A maintainer will review your PR
   - Address any feedback
   - Make requested changes
   - Re-request review when ready

4. **Merge** - Once approved, your PR will be merged!

## Versioning

We use [Semantic Versioning](https://semver.org/):
- **MAJOR** (1.0.0 → 2.0.0) - Breaking changes
- **MINOR** (1.0.0 → 1.1.0) - New features, backwards compatible
- **PATCH** (1.0.0 → 1.0.1) - Bug fixes, backwards compatible

## Publishing

Publishing is done by maintainers via:
```bash
pnpm publishPackages
```

This uses Lerna to publish all packages in the monorepo.

## Questions?

- **Issues:** [GitHub Issues](https://github.com/wende/treelocatorjs/issues)
- **Discussions:** [GitHub Discussions](https://github.com/wende/treelocatorjs/discussions)

## Code of Conduct

Be respectful, constructive, and collaborative. We're all here to make TreeLocatorJS better.

## License

By contributing to TreeLocatorJS, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing!** 🌳
