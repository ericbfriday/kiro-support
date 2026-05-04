# Contributing to kiro-transition-toolkit

## Prerequisites

- Node.js ≥ 20 (the repo pins 24.14.1 via Volta)
- pnpm 9.15+

If you use [Volta](https://volta.sh), the correct versions are picked up automatically from `package.json`.

## Setup

```bash
git clone <repo-url>
cd kiro-support
pnpm install
pnpm build
```

## Development Workflow

```bash
pnpm build              # Build all packages
pnpm typecheck          # Type-check without emitting
pnpm test               # Run tests across all packages
pnpm clean              # Remove dist/ directories
```

To work on a single package:

```bash
pnpm --filter @kiro-transition/env-scanner build
pnpm --filter @kiro-transition/cli start -- scan --json
```

## Project Structure

```
packages/
  cli/                  # Commander CLI — orchestrates everything
  env-scanner/          # Runtime & CI detection
  steering-generator/   # Steering file generation with YAML front-matter
  context-migrator/     # Migrates CLAUDE.md, .cursorrules, etc.
  hooks-library/        # Hook templates
  skills-library/       # Skill templates
  steering-library/     # Steering templates
```

Each package follows the same layout: `src/index.ts` barrel export, `types.ts` for interfaces, `templates.ts` for template data, `generator.ts` for logic.

## Adding a Template

1. Add the template object to the relevant `templates.ts` in the appropriate package.
2. Re-export from `src/index.ts` if needed.
3. Update the table in `README.md`.
4. Run `pnpm build` to verify.

## Code Style

- TypeScript strict mode with `exactOptionalPropertyTypes` and `noUncheckedIndexedAccess`.
- ESM only — use `.js` extensions in import paths.
- Explicit return types on exported functions.
- Keep dependencies minimal; this is a scaffolding tool.

## Commit Messages

Format: `type(scope): description`

Types: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`

Scope is the package name without the `@kiro-transition/` prefix, e.g. `feat(cli): add --dry-run flag`.

## Pull Requests

- Branch from `main`.
- Keep PRs focused — one feature or fix per PR.
- Ensure `pnpm build` and `pnpm typecheck` pass before submitting.
- Add or update tests for new functionality.

## License

By contributing you agree that your contributions will be licensed under the MIT License.
