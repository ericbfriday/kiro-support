# Implementation Plan: Unified MCP Server Publish

## Overview

This plan implements the consolidation of four Jira MCP servers into a single publishable package (`@nmdp/jira-mcp`) runnable via `npx`. The work proceeds in six phases: extract tool registrations into importable modules, create the unified server entry point, configure tsup bundling, add CLI flags and startup validation, set up CI/CD, and write onboarding documentation. Each phase includes verification steps to ensure backward compatibility and correct behavior. Publishing to the NMDP private npm registry is a manual step performed only on explicit command.

## Tasks

### Phase 1: Extract Tool Registrations

- [ ] 1. Extract jira-core-mcp tool registrations into importable module
  - Create `servers/jira-core-mcp/src/tools.ts` with a `registerCoreTools(server, client)` function
  - Move all 39 tool definitions from the `ListToolsRequestSchema` handler into an exported `coreToolDefinitions` array
  - Move all tool handler logic from the `CallToolRequestSchema` switch-case into a `handleCoreTool(name, args, client)` function
  - Export both the definitions array and the registration function
  - Update `servers/jira-core-mcp/src/index.ts` to import from `tools.ts` instead of inlining
  - Verify the standalone server still works: `node servers/jira-core-mcp/dist/index.js`
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 8.1, 8.2_

- [ ] 2. Extract jira-dev-mcp tool and prompt registrations into importable module
  - Create `servers/jira-dev-mcp/src/tools.ts` with a `registerDevTools(server, client, agileClient)` function
  - Move all 15 tool definitions and handlers into the module
  - Move all 4 prompt definitions and handlers (`ListPromptsRequestSchema`, `GetPromptRequestSchema`) into the module
  - Export tool definitions array, prompt definitions array, and registration function
  - Update `servers/jira-dev-mcp/src/index.ts` to import from `tools.ts`
  - Verify the standalone server still works with both tools and prompts
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 8.1, 8.2_

- [ ] 3. Extract jira-agile-mcp tool registrations into importable module
  - Create `servers/jira-agile-mcp/src/tools.ts` with a `registerAgileTools(server, agileClient)` function
  - Move all 19 tool definitions and handlers into the module
  - Export tool definitions array and registration function
  - Update `servers/jira-agile-mcp/src/index.ts` to import from `tools.ts`
  - Verify the standalone server still works
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 8.1, 8.2_

- [ ] 4. Extract jira-context-mcp tool and resource registrations into importable module
  - Create `servers/jira-context-mcp/src/tools.ts` with a `registerContextTools(server, client)` function
  - Move all 8 tool definitions and handlers into the module
  - Move resource template definitions and handlers (`ListResourceTemplatesRequestSchema`, `ReadResourceRequestSchema`) into the module
  - Include session storage initialization in the registration function
  - Export tool definitions array, resource template definitions, and registration function
  - Update `servers/jira-context-mcp/src/index.ts` to import from `tools.ts`
  - Verify the standalone server still works with tools and resources
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 8.1, 8.2_

- [ ] 5. Checkpoint: verify all standalone servers still work
  - Run `pnpm run build` across the entire workspace
  - Run `pnpm run test` across the entire workspace
  - Verify each server's tool count is unchanged (39, 15, 19, 8)
  - _Requirements: 8.2, 8.3_

### Phase 2: Create Unified Server

- [ ] 6. Create unified server package scaffold
  - Create `servers/jira-unified-mcp/` directory
  - Create `servers/jira-unified-mcp/package.json` with name `@nmdp/jira-mcp`, bin field, files field, publishConfig, engines, and dependencies
  - Create `servers/jira-unified-mcp/tsconfig.json` extending root tsconfig
  - Add `servers/jira-unified-mcp` to pnpm workspace (already covered by `servers/*` glob)
  - Declare workspace dependencies on `@jira-mcp/shared`, `@jira-mcp/core`, `@jira-mcp/dev`, `@jira-mcp/agile`, `@jira-mcp/context` as devDependencies
  - Declare runtime dependencies: `@modelcontextprotocol/sdk`, `zod`, `dotenv`
  - _Requirements: 2.1, 2.4, 2.5, 3.4, 3.5, 4.1, 4.2, 4.3, 4.6_

- [ ] 7. Implement unified server entry point
  - Create `servers/jira-unified-mcp/src/index.ts` with shebang line
  - Import and call `loadConfig()` for env var validation with actionable error messages
  - Instantiate `JiraClient`, `AgileClient` from shared config
  - Create MCP `Server` instance with capabilities: `{ tools: {}, prompts: {}, resources: {} }`
  - Import and call all four registration functions: `registerCoreTools`, `registerDevTools`, `registerAgileTools`, `registerContextTools`
  - Connect `StdioServerTransport`
  - Add startup assertion: verify no duplicate tool names across modules
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

- [ ] 8. Add CLI flag handling
  - Add `--help` flag: print usage information (required env vars, MCP config example) and exit 0
  - Add `--version` flag: print package version from package.json and exit 0
  - Process CLI flags before `loadConfig()` so `--help` works without env vars
  - Ignore unknown flags to support future MCP host arguments
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

### Phase 3: Configure Bundler

- [ ] 9. Add tsup bundler configuration
  - Install `tsup` as a devDependency in `servers/jira-unified-mcp`
  - Create `servers/jira-unified-mcp/tsup.config.ts` with ESM format, node22 target
  - Configure `noExternal: [/^@jira-mcp\//]` to inline all workspace packages
  - Configure `external: ['@modelcontextprotocol/sdk', 'zod', 'dotenv']` to keep runtime deps external
  - Configure `banner: { js: '#!/usr/bin/env node' }` for npx execution
  - Configure `splitting: false` for single-file output
  - Set `outExtension` to `.js` for ESM compatibility
  - Update build script in package.json to run `tsup`
  - _Requirements: 3.1, 3.2, 3.3_

- [ ] 10. Verify bundle output
  - Run `pnpm --filter @nmdp/jira-mcp run build`
  - Verify `servers/jira-unified-mcp/dist/index.js` exists and starts with shebang
  - Verify the bundled file contains inlined workspace code (grep for known function names)
  - Verify the bundled file does NOT contain `workspace:*` references
  - Run `node servers/jira-unified-mcp/dist/index.js --help` to verify CLI works
  - Run `node servers/jira-unified-mcp/dist/index.js --version` to verify version output
  - _Requirements: 3.1, 3.3, 3.6, 5.1, 5.2_

### Phase 4: Pre-Publish Validation

- [ ] 11. Validate package tarball
  - Run `npm pack --dry-run` in `servers/jira-unified-mcp/` and verify only `dist/` files are included
  - Verify no `.env`, `.env.local`, TypeScript source files, or `node_modules` in the tarball
  - Verify `package.json` in the tarball has no `workspace:*` references (tsup resolves them, but verify pnpm's `publishConfig` handling)
  - _Requirements: 3.5, 3.7, 9.1, 9.2_

- [ ] 12. Test local installation from tarball
  - Run `npm pack` to create the tarball
  - Install the tarball in a temporary directory: `npm install /path/to/nmdp-jira-mcp-1.0.0.tgz`
  - Run `jira-mcp --help` from the installed location and verify output
  - Run `jira-mcp --version` and verify correct version
  - Set JIRA_URL and JIRA_TOKEN env vars and verify the server starts (connects to stdio)
  - _Requirements: 9.3, 9.4_

- [ ] 13. Checkpoint: full build and test pass
  - Run `pnpm run build` for entire workspace (all servers + unified)
  - Run `pnpm run test` for entire workspace
  - Verify no regressions in existing servers
  - _Requirements: 8.3_

### Phase 5: CI/CD Updates

- [ ] 14. Update GitLab CI pipeline
  - Add a `build` stage to `.gitlab-ci.yml` that runs `pnpm install --frozen-lockfile && pnpm run build`
  - Include the unified server bundle step in the build
  - Add a `test` stage that runs `pnpm run test`
  - Do NOT add a publish stage (publishing is manual only)
  - Verify YAML syntax is valid
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

### Phase 6: Documentation

- [ ] 15. Write developer onboarding section in README.md
  - Add "Quick Start (npx)" section to README.md with one-time `.npmrc` setup instructions
  - Include copy-paste MCP config block for Claude Desktop, Cursor, and Kiro
  - Explain how to generate a Jira PAT
  - Include version pinning example: `"args": ["-y", "@nmdp/jira-mcp@1.2.0"]`
  - Preserve all existing README.md content
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 16. Update workspace README with unified server architecture
  - Add the unified server to the Architecture section
  - Update the project structure diagram to include `servers/jira-unified-mcp/`
  - Add build instructions for the unified server
  - Document the manual publish workflow: `npm version`, `npm publish`
  - _Requirements: 7.5_

### Phase 7: Final Verification

- [ ] 17. End-to-end validation
  - Build the entire workspace from clean state (`pnpm install && pnpm run build`)
  - Run all tests (`pnpm run test`)
  - Pack and inspect the tarball (`npm pack --dry-run`)
  - Install from tarball and verify `--help`, `--version`
  - Verify all 4 standalone servers still work independently
  - Verify the unified server exposes 81 tools, 4 prompts, and resource templates
  - _Requirements: All requirements_

- [ ] 18. STOP: Await explicit publish command
  - Do NOT run `npm publish`
  - Report readiness to the user with the publish command they should run
  - Include the exact command: `cd servers/jira-unified-mcp && npm publish`
  - _Requirements: 4.4, 4.5_

## Notes

- Publishing is MANUAL ONLY. Task 18 explicitly gates on user command.
- The existing four standalone servers continue to work after refactoring. The extraction creates shared modules that both the standalone and unified servers import.
- Tool name uniqueness is asserted at startup. If two modules register the same tool name, the server fails fast with a clear error.
- The tsup `noExternal` regex `/^@jira-mcp\//` matches all workspace packages. If new workspace packages are added, they are automatically inlined.
- The `prepublishOnly` script ensures the bundle is fresh before every publish.
- Version management uses standard `npm version` commands. No automated versioning.
