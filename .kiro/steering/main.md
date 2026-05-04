---
inclusion: always
---

# kiro-transition-toolkit Steering

## Project Overview

A pnpm monorepo providing CLI and library packages to transition projects to Kiro format. Scans environments for runtime versions, migrates existing AI context files (CLAUDE.md, .cursorrules, etc.) to Kiro steering, and scaffolds `.kiro/` directory structures with hooks, skills, and steering templates.

## Architecture

Monorepo with 7 packages under `packages/`:

| Package | Purpose |
|---------|---------|
| `cli` | Commander-based CLI entry point, orchestrates all other packages |
| `env-scanner` | Detects runtime versions (Node, Python, Java, etc.) and CI config |
| `steering-generator` | Generates steering markdown with YAML front-matter |
| `context-migrator` | Parses and converts AI context files to steering format |
| `hooks-library` | Hook templates (lint, format, test, security) |
| `skills-library` | Skill templates (code-reviewer, test-writer, etc.) |
| `steering-library` | Steering templates (TypeScript, Python, React, etc.) |

Dependency flow: `cli` → all libraries; `steering-generator` → `env-scanner`; `context-migrator` → `steering-generator`; `steering-library` → `steering-generator`.

## Tech Stack

- TypeScript 5.9, ES2022 target, ESM (`"type": "module"`)
- Node.js ≥ 20 (Volta-pinned to 24.14.1)
- pnpm 9.15 workspaces
- tsup for bundling (ESM + DTS)
- Node built-in test runner (`node --test`)
- No runtime framework — pure Node.js + Commander for CLI

## Code Conventions

- Strict TypeScript (`strict: true`, `noUnusedLocals`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`)
- ESM imports with `.js` extensions in source
- Explicit return types on exported functions
- camelCase functions, PascalCase types, UPPER_SNAKE_CASE constants
- Tool/template IDs use kebab-case (`typescript-lint`, `code-reviewer`)
- Each package exports from a single `src/index.ts` barrel

## Build & Test

```bash
pnpm build          # Build all packages (tsup)
pnpm test           # Run all tests
pnpm typecheck      # Type-check without emit
pnpm clean          # Remove dist/ from all packages
```

Per-package: `pnpm --filter @kiro-transition/<pkg> build`

## File Structure Conventions

- Source in `src/`, output in `dist/`
- Tests colocated as `*.test.ts` (excluded from tsconfig via `exclude`)
- Each package has its own `tsconfig.json` extending the root
- Templates defined as TypeScript objects in `templates.ts`, types in `types.ts`, logic in `generator.ts`

## Adding a New Template

1. Add the template object to the relevant `templates.ts`
2. Export it from `index.ts`
3. Update the README table
4. Build and verify: `pnpm build`

## Key Design Decisions

- No Zod or runtime validation library — keep dependencies minimal for a scaffolding tool
- Templates are code, not files on disk — simpler distribution, type-safe
- `tmp/.kiro/` contains reference artifacts from a different project (Jira MCP); not part of this toolkit's runtime
- `scripts/kiro-loop.sh` is a reference automation script, not used by the toolkit itself
