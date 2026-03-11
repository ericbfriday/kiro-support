# Requirements Document

## Introduction

This document specifies the requirements for consolidating the four existing Jira MCP servers (jira-core-mcp, jira-dev-mcp, jira-agile-mcp, jira-context-mcp) into a single unified package (`@nmdp/jira-mcp`) that is publishable to the NMDP private npm registry and runnable via `npx @nmdp/jira-mcp`. Today, developers must clone the monorepo, install dependencies, build from source, and configure absolute file paths to each server's `dist/index.js`. This creates friction for onboarding and makes version management across the org impractical. The unified package eliminates this by providing a single `npx`-invokable command that exposes all 81 tools, 4 prompts, and 2 resources from one MCP server process.

## Glossary

- **Unified_Server**: The new `@nmdp/jira-mcp` package that combines all four existing MCP servers into a single MCP server process
- **Tool_Module**: An importable function that registers a group of related tools onto a shared MCP Server instance (e.g., `registerCoreTools`)
- **Bundler**: tsup (backed by esbuild), used to produce a single self-contained JavaScript file with all workspace dependencies inlined
- **Private_Registry**: The NMDP Nexus npm registry at `https://artifacts.nmdp.org/repository/npm-private/` scoped under `@nmdp`
- **MCP_Host**: An AI tool (Claude Desktop, Cursor, Kiro, etc.) that launches and communicates with MCP servers via stdio
- **Workspace_Dependency**: A monorepo-internal package referenced via `workspace:*` in package.json, which must be resolved before publishing
- **Shebang**: The `#!/usr/bin/env node` line at the top of a JavaScript file that allows it to be executed directly as a CLI command

## Requirements

### Requirement 1: Modularize Tool Registrations

**User Story:** As a developer maintaining the MCP servers, I want tool registrations extracted from monolithic index.ts files into importable modules, so that the unified server can compose them without duplicating code.

#### Acceptance Criteria

1. WHEN tool registrations are extracted, THE Tool_Module SHALL export a function with signature `(server: Server, client: JiraClient, agileClient?: AgileClient) => void`
2. THE Tool_Module SHALL register both tool definitions (ListToolsRequestSchema) and tool handlers (CallToolRequestSchema) for its domain
3. THE Tool_Module SHALL preserve all existing tool names, descriptions, input schemas, and handler logic without modification
4. WHEN a Tool_Module is imported into the Unified_Server, THE Unified_Server SHALL expose all tools from that module identically to the original standalone server
5. THE existing standalone servers SHALL continue to function by importing from the same Tool_Module source

### Requirement 2: Create Unified Server Package

**User Story:** As an org developer, I want a single MCP server that exposes all Jira tools, so that I only need one entry in my MCP client configuration.

#### Acceptance Criteria

1. THE Unified_Server SHALL register all 81 tools from the four existing servers (39 core, 15 dev, 19 agile, 8 context)
2. THE Unified_Server SHALL register all 4 prompts from jira-dev-mcp
3. THE Unified_Server SHALL register all resource templates from jira-context-mcp
4. THE Unified_Server SHALL initialize JiraClient, AgileClient, and session storage during startup
5. THE Unified_Server SHALL use the shared `loadConfig()` function for environment variable validation
6. WHEN JIRA_URL or JIRA_TOKEN environment variables are missing, THE Unified_Server SHALL exit with a clear error message explaining which variable is missing and how to set it
7. THE Unified_Server SHALL communicate via stdio transport, compatible with all MCP hosts

### Requirement 3: Bundle as Self-Contained Package

**User Story:** As an org developer, I want `npx @nmdp/jira-mcp` to work without cloning the monorepo or building from source, so that I can start using Jira tools immediately.

#### Acceptance Criteria

1. THE Bundler SHALL produce a single ESM JavaScript file with all workspace dependencies (`@jira-mcp/shared`) inlined
2. THE Bundler SHALL keep `@modelcontextprotocol/sdk`, `zod`, and `dotenv` as external runtime dependencies declared in package.json
3. THE bundled output SHALL include a shebang (`#!/usr/bin/env node`) as the first line
4. THE package.json SHALL declare a `bin` field mapping `jira-mcp` to the bundled output file
5. THE package.json SHALL declare a `files` field restricting the published tarball to only the `dist/` directory
6. WHEN a developer runs `npx @nmdp/jira-mcp`, THE package SHALL install from the Private_Registry and execute successfully
7. THE bundled output SHALL NOT contain any `.env` files, credentials, or secrets

### Requirement 4: Publish to NMDP Private Registry

**User Story:** As an org developer, I want the package published to our private npm registry under the `@nmdp` scope, so that it is available to all org developers with registry access.

#### Acceptance Criteria

1. THE package.json SHALL include `publishConfig.registry` pointing to `https://artifacts.nmdp.org/repository/npm-private/`
2. THE package name SHALL be `@nmdp/jira-mcp`
3. THE package SHALL be versioned using semver, starting at `1.0.0`
4. WHEN `npm publish` is run from the unified server directory, THE package SHALL be uploaded to the Private_Registry
5. THE package SHALL NOT be published automatically by CI; publishing SHALL be a manual command only
6. THE package.json SHALL declare `engines.node` matching the monorepo minimum (`>=22.14.0`)

### Requirement 5: Provide CLI Flags

**User Story:** As an org developer, I want `--help` and `--version` flags on the CLI, so that I can verify my installation and understand usage without reading external docs.

#### Acceptance Criteria

1. WHEN the `--help` flag is passed, THE Unified_Server SHALL print usage information including required environment variables and exit with code 0
2. WHEN the `--version` flag is passed, THE Unified_Server SHALL print the package version from package.json and exit with code 0
3. WHEN no flags are passed, THE Unified_Server SHALL start the MCP server normally on stdio transport
4. WHEN unknown flags are passed, THE Unified_Server SHALL ignore them and start normally (to support future MCP host arguments)

### Requirement 6: Update CI/CD Pipeline

**User Story:** As a developer, I want the GitLab CI pipeline to build and test the unified server package, so that regressions are caught before publishing.

#### Acceptance Criteria

1. THE CI pipeline SHALL include a build stage that compiles and bundles the Unified_Server
2. THE CI pipeline SHALL include a test stage that runs all workspace tests
3. THE CI pipeline SHALL NOT include a publish stage; publishing is manual only
4. WHEN the build or test stages fail, THE pipeline SHALL report the failure clearly

### Requirement 7: Provide Developer Onboarding Documentation

**User Story:** As a new org developer, I want clear setup instructions, so that I can configure my MCP client to use `@nmdp/jira-mcp` within 5 minutes.

#### Acceptance Criteria

1. THE documentation SHALL include a one-time `.npmrc` setup instruction for the NMDP private registry
2. THE documentation SHALL include a copy-paste MCP client configuration block for Claude Desktop, Cursor, and Kiro
3. THE documentation SHALL explain how to generate a Jira Personal Access Token
4. THE documentation SHALL include a version pinning example for stability-sensitive teams
5. WHEN documentation is added, THE existing README.md content SHALL be preserved

### Requirement 8: Preserve Existing Server Functionality

**User Story:** As a developer, I want the four existing standalone servers to continue working independently, so that the refactoring does not break current setups.

#### Acceptance Criteria

1. THE refactoring SHALL NOT modify the public API (tool names, input schemas, output formats) of any existing server
2. THE existing standalone server entry points SHALL continue to function when run directly
3. THE existing workspace `pnpm run build` and `pnpm run test` commands SHALL continue to work
4. THE shared library (`@jira-mcp/shared`) SHALL remain a workspace package usable by all servers

### Requirement 9: Validate Package Before Publishing

**User Story:** As a developer about to publish, I want to verify the package tarball is correct and functional, so that I don't ship broken or leaky artifacts.

#### Acceptance Criteria

1. WHEN `npm pack --dry-run` is run, THE output SHALL show only files from the `dist/` directory
2. THE tarball SHALL NOT contain `.env`, `.env.local`, credentials, or source TypeScript files
3. WHEN the tarball is installed locally via `npm install ./nmdp-jira-mcp-1.0.0.tgz`, THE `jira-mcp --help` command SHALL execute successfully
4. WHEN the locally installed package is configured as an MCP server, THE MCP host SHALL discover all 81 tools
