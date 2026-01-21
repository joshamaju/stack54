# Repository Guidelines

## Project Structure & Module Organization
- Monorepo managed with pnpm workspaces (`pnpm-workspace.yaml`).
- Core library lives in `packages/core` (source in `packages/core/src`, tests in `packages/core/test`, build output in `packages/core/dist`).
- CLI scaffolder is in `packages/create`.
- Framework integrations are under `integrations/` (each has its own `src`, `test`, and `package.json`).
- Examples and starters live in `examples/` and `templates/`; experimental apps are in `playground/`.

## Build, Test, and Development Commands
- `pnpm install` installs workspace dependencies.
- `pnpm build` runs the TypeScript build across the workspace (`tsc -b tsconfig.build.json`).
- `pnpm test` runs package tests across the workspace (excluding `templates/` and `playground/`).
- Package-level commands are available; for example `pnpm -C packages/core test` or `pnpm -C integrations/streaming test`.
- Release tooling uses Changesets: `pnpm changeset` to add a changeset, `pnpm version` to apply versions.

## Coding Style & Naming Conventions
- TypeScript + ESM modules are standard across packages.
- Match existing formatting: 2-space indentation, double quotes, and trailing semicolons.
- Files follow conventional naming: `*.ts` for source, `*.test.ts` for unit tests, `*.spec.ts` for Playwright tests.

## Testing Guidelines
- Unit tests use Vitest (e.g., `packages/core/test/*.test.ts`).
- Integration/e2e tests use Playwright in templates and integration test apps (e.g., `templates/express/tests/*.spec.ts`).
- Some Playwright suites require installing browsers first (see package scripts like `playwright:install`).

## Adding a New Package or Integration
- Create a new workspace under `packages/<name>` or `integrations/<name>` with its own `package.json` and `tsconfig.json` (match neighboring packages).
- Use scoped names for integrations (e.g., `@stack54/<integration>`); core packages use unscoped names like `stack54` or `create-stack54`.
- Add the package path to `tsconfig.build.json` under `references` so `pnpm build` includes it.
- If it has tests, add a `test` script and keep tests in `test/` with `*.test.ts` or `*.spec.ts` naming.

## Commit & Pull Request Guidelines
- Commits are short and imperative; `chore:`-style prefixes appear in history and are acceptable.
- PRs should explain the change, link relevant issues, and list testing performed.
- Include screenshots or recordings for UI-facing changes in templates or playground apps.
- Add a Changeset for user-facing package changes.
