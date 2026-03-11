# Design Document: Unified MCP Server Publish

## Overview

This design specifies the implementation of a unified MCP server package (`@nmdp/jira-mcp`) that consolidates the four existing Jira MCP servers into a single npm-publishable, npx-runnable package. The current architecture uses four separate server processes, each with monolithic `index.ts` files containing inline tool definitions and handlers. The unified approach extracts tool registrations into importable modules, composes them onto a single MCP Server instance, and bundles the result with tsup into a self-contained CLI executable published to the NMDP private Nexus registry.

The implementation:
1. Extracts tool/prompt/resource registrations from 4 servers into reusable modules
2. Creates a new unified server entry point that composes all modules
3. Bundles with tsup to inline workspace dependencies and produce a single file
4. Adds CLI flags (`--help`, `--version`) and startup validation
5. Configures for publish to `https://artifacts.nmdp.org/repository/npm-private/`
6. Updates CI/CD to build and test (but not auto-publish)
7. Provides developer onboarding documentation

## Architecture

### Current Architecture (Before)

```
MCP Host (Cursor/Claude/Kiro)
    │
    ├─── stdio ──► jira-core-mcp    (39 tools)  ─── JiraClient ───┐
    ├─── stdio ──► jira-dev-mcp     (15 tools)  ─── JiraClient ───┤
    ├─── stdio ──► jira-agile-mcp   (19 tools)  ─── AgileClient ──┤
    └─── stdio ──► jira-context-mcp  (8 tools)  ─── JiraClient ───┤
                                                                    │
                                                            Jira REST API
```

Each server is a separate process requiring a separate MCP config entry with absolute file paths to `dist/index.js`.

### Target Architecture (After)

```
MCP Host (Cursor/Claude/Kiro)
    │
    └─── stdio ──► @nmdp/jira-mcp (unified)
                    │
                    ├── registerCoreTools(server, client)      ── 39 tools
                    ├── registerDevTools(server, client)        ── 15 tools + 4 prompts
                    ├── registerAgileTools(server, agileClient) ── 19 tools
                    └── registerContextTools(server, client)    ── 8 tools + resources
                    │
                    ├── JiraClient  ─────┐
                    ├── AgileClient ─────┤
                    └── SessionStorage ──┤
                                         │
                                  Jira REST API
```

One `npx @nmdp/jira-mcp` command. One MCP config entry. All 81 tools.

### Package Structure

```
servers/jira-unified-mcp/
├── src/
│   └── index.ts              # Unified entry point: CLI flags, client init, module composition
├── package.json              # @nmdp/jira-mcp with bin, files, publishConfig
├── tsconfig.json             # TypeScript config extending root
└── tsup.config.ts            # Bundler config: inline workspace deps, shebang, ESM
```

The existing servers remain untouched as workspace packages. The new unified server imports from them.

### Build & Publish Flow

```
pnpm run build (workspace)
    │
    ├── tsc (libs/mcp-jira-shared)     → dist/
    ├── tsc (servers/jira-core-mcp)    → dist/
    ├── tsc (servers/jira-dev-mcp)     → dist/
    ├── tsc (servers/jira-agile-mcp)   → dist/
    ├── tsc (servers/jira-context-mcp) → dist/
    └── tsup (servers/jira-unified-mcp)
         │
         └── dist/index.js  (single bundled file, ~shebang, ESM)
                │
                npm pack → @nmdp/jira-mcp-1.0.0.tgz
                │
                npm publish (manual) → artifacts.nmdp.org
```

## Components and Interfaces

### Tool Module Interface

Each existing server's tool registrations will be extracted into a module conforming to this interface:

```typescript
// Shared interface for all tool modules
interface ToolModule {
  registerTools(server: Server, client: JiraClient, agileClient?: AgileClient): void;
}

// Example: Core tools module
// servers/jira-core-mcp/src/tools.ts
export function registerCoreTools(server: Server, client: JiraClient): void {
  // Moves ListToolsRequestSchema handler content here
  // Moves CallToolRequestSchema handler content here
}

// Example: Dev tools module (includes prompts)
// servers/jira-dev-mcp/src/tools.ts
export function registerDevTools(server: Server, client: JiraClient, agileClient: AgileClient): void {
  // Tool definitions + handlers
  // Prompt definitions + handlers (ListPromptsRequestSchema, GetPromptRequestSchema)
}

// Example: Agile tools module
// servers/jira-agile-mcp/src/tools.ts
export function registerAgileTools(server: Server, agileClient: AgileClient): void {
  // Tool definitions + handlers
}

// Example: Context tools module (includes resources)
// servers/jira-context-mcp/src/tools.ts
export function registerContextTools(server: Server, client: JiraClient): void {
  // Tool definitions + handlers
  // Resource template definitions + handlers
  // Storage initialization
}
```

### Unified Server Entry Point

```typescript
// servers/jira-unified-mcp/src/index.ts
#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { loadConfig, JiraAuth, JiraClient, AgileClient } from '@jira-mcp/shared';
import { registerCoreTools } from '@jira-mcp/core/tools';
import { registerDevTools } from '@jira-mcp/dev/tools';
import { registerAgileTools } from '@jira-mcp/agile/tools';
import { registerContextTools } from '@jira-mcp/context/tools';

// CLI flag handling
if (process.argv.includes('--help')) { printHelp(); process.exit(0); }
if (process.argv.includes('--version')) { printVersion(); process.exit(0); }

// Config validation (fails fast with actionable error)
const config = loadConfig();
const auth = new JiraAuth(config.JIRA_TOKEN);
const client = new JiraClient(config.JIRA_URL, auth);
const agileClient = new AgileClient(config.JIRA_URL, auth);

const server = new Server(
  { name: '@nmdp/jira-mcp', version: '1.0.0' },
  { capabilities: { tools: {}, prompts: {}, resources: {} } }
);

// Register all tool modules
registerCoreTools(server, client);
registerDevTools(server, client, agileClient);
registerAgileTools(server, agileClient);
registerContextTools(server, client);

// Connect transport
const transport = new StdioServerTransport();
await server.connect(transport);
```

### tsup Bundler Configuration

```typescript
// servers/jira-unified-mcp/tsup.config.ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node22',
  clean: true,
  sourcemap: true,
  splitting: false,                   // Single file output
  noExternal: [/^@jira-mcp\//],      // Inline all workspace packages
  external: [
    '@modelcontextprotocol/sdk',
    'zod',
    'dotenv',
  ],
  banner: {
    js: '#!/usr/bin/env node',        // Required for npx execution
  },
  outExtension() {
    return { js: '.js' };             // Force .js extension for ESM
  },
  esbuildOptions(options) {
    options.platform = 'node';
  },
});
```

### Package Configuration

```json
{
  "name": "@nmdp/jira-mcp",
  "version": "1.0.0",
  "type": "module",
  "description": "Unified Jira MCP server for AI tool integration",
  "main": "./dist/index.js",
  "bin": {
    "jira-mcp": "./dist/index.js"
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsup",
    "prepublishOnly": "npm run build"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.27.1",
    "zod": "^4.3.6",
    "dotenv": "^17.3.1"
  },
  "devDependencies": {
    "@jira-mcp/shared": "workspace:*",
    "@jira-mcp/core": "workspace:*",
    "@jira-mcp/dev": "workspace:*",
    "@jira-mcp/agile": "workspace:*",
    "@jira-mcp/context": "workspace:*",
    "tsup": "^8.0.0",
    "typescript": "^5.9.3"
  },
  "engines": {
    "node": ">=22.14.0"
  },
  "publishConfig": {
    "registry": "https://artifacts.nmdp.org/repository/npm-private/"
  }
}
```

### Developer-Facing MCP Configuration

After setup, developers copy this single block into their MCP client config:

```json
{
  "mcpServers": {
    "jira": {
      "command": "npx",
      "args": ["-y", "@nmdp/jira-mcp"],
      "env": {
        "JIRA_URL": "https://qa.jira.nmdp.org",
        "JIRA_TOKEN": "<your-personal-access-token>"
      }
    }
  }
}
```

## Data Models

### Tool Registration Merging Strategy

The four servers currently register tools using the same MCP SDK pattern but with a critical difference: they each create their own `ListToolsRequestSchema` and `CallToolRequestSchema` handlers. The unified server needs to merge these.

**Approach: Aggregated Arrays**

Each tool module exports two things:
1. A tool definitions array (for `ListToolsRequestSchema`)
2. A handler map (for `CallToolRequestSchema`)

```typescript
// Tool module export shape
interface ToolRegistration {
  tools: Tool[];                                    // Tool definitions array
  handler: (name: string, args: Record<string, unknown>) => Promise<CallToolResult>;
}

// Unified server merges them
const allTools = [
  ...coreRegistration.tools,
  ...devRegistration.tools,
  ...agileRegistration.tools,
  ...contextRegistration.tools,
];

// Handler routing
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  // Try each module's handler in order; first match wins
  // (tool names are unique across all modules)
});
```

### CLI Flag Handling

```typescript
function printHelp(): void {
  console.log(`
@nmdp/jira-mcp - Unified Jira MCP Server

USAGE:
  npx @nmdp/jira-mcp              Start the MCP server (stdio transport)
  npx @nmdp/jira-mcp --help       Show this help message
  npx @nmdp/jira-mcp --version    Show package version

REQUIRED ENVIRONMENT VARIABLES:
  JIRA_URL     Your Jira instance URL (e.g., https://qa.jira.nmdp.org)
  JIRA_TOKEN   Personal Access Token for Jira API authentication

MCP CLIENT CONFIGURATION:
  {
    "mcpServers": {
      "jira": {
        "command": "npx",
        "args": ["-y", "@nmdp/jira-mcp"],
        "env": {
          "JIRA_URL": "https://qa.jira.nmdp.org",
          "JIRA_TOKEN": "<your-pat>"
        }
      }
    }
  }
`);
}
```

## Correctness Properties

### Property 1: Tool Count Preservation

*For any* build of the Unified_Server, the total number of tools registered SHALL equal the sum of tools from all four source servers (39 + 15 + 19 + 8 = 81). No tools SHALL be added, removed, or renamed during the consolidation.

**Validates: Requirements 1.3, 2.1, 8.1**

### Property 2: Tool Name Uniqueness

*For any* set of tools registered by the Unified_Server, all tool names SHALL be unique. No two tool modules SHALL register a tool with the same name.

**Validates: Requirements 2.1, 2.2, 2.3**

### Property 3: Bundle Self-Containment

*For any* published tarball of `@nmdp/jira-mcp`, the `dist/index.js` file SHALL contain all code from `@jira-mcp/shared`, `@jira-mcp/core`, `@jira-mcp/dev`, `@jira-mcp/agile`, and `@jira-mcp/context` inlined. No `workspace:*` references SHALL remain in the published `package.json`.

**Validates: Requirements 3.1, 3.6**

### Property 4: Tarball Cleanliness

*For any* published tarball, the contents SHALL consist exclusively of files within the `dist/` directory and `package.json`. No `.env`, `.env.local`, TypeScript source files, `node_modules`, or credential files SHALL be present.

**Validates: Requirements 3.5, 3.7, 9.1, 9.2**

### Property 5: Backward Compatibility

*For any* existing standalone server (`jira-core-mcp`, `jira-dev-mcp`, `jira-agile-mcp`, `jira-context-mcp`), running `node dist/index.js` SHALL produce identical behavior before and after the refactoring. Tool names, input schemas, and output formats SHALL remain unchanged.

**Validates: Requirements 8.1, 8.2, 8.3**

## Error Handling

### Startup Validation Errors

The unified server validates environment variables at startup using the existing `loadConfig()` function from `@jira-mcp/shared`.

**Missing JIRA_URL:**
```
ERROR: JIRA_URL environment variable is required.

Set it in your MCP client configuration:
  "env": { "JIRA_URL": "https://your-jira-instance.com" }

Or export it in your shell:
  export JIRA_URL=https://your-jira-instance.com
```

**Missing JIRA_TOKEN:**
```
ERROR: JIRA_TOKEN environment variable is required.

Generate a Personal Access Token in Jira:
  Profile → Personal Access Tokens → Create Token

Then set it in your MCP client configuration:
  "env": { "JIRA_TOKEN": "your-token-here" }
```

### Build Errors

**tsup bundle failure (workspace dependency not found):**
- Cause: Workspace packages not built before tsup runs
- Fix: Ensure `pnpm run build` runs `tsc` for all workspace packages before `tsup` for the unified server
- The unified server's build script depends on workspace packages being compiled first

**Tool name collision:**
- Cause: Two modules register a tool with the same name
- Detection: A startup assertion checks for duplicate tool names
- Fix: Rename the conflicting tool in the source module

### Publish Errors

**Registry authentication failure:**
- Cause: npm login expired or `.npmrc` misconfigured
- Fix: Re-run `npm login --scope=@nmdp --registry=https://artifacts.nmdp.org/repository/npm-private/`

**Version already exists:**
- Cause: Attempting to publish an already-published version
- Fix: Bump version with `npm version patch|minor|major`

## Testing Strategy

### Unit Testing

1. **Tool Module Extraction**: Verify each extracted module registers the correct number of tools with the expected names
2. **CLI Flags**: Verify `--help` prints usage and exits 0, `--version` prints version and exits 0
3. **Startup Validation**: Verify missing env vars produce actionable error messages

### Integration Testing

1. **Tool Count Verification**: Start the unified server and call `ListToolsRequestSchema`; assert 81 tools returned
2. **Prompt Count Verification**: Call `ListPromptsRequestSchema`; assert 4 prompts returned
3. **Resource Templates**: Call `ListResourceTemplatesRequestSchema`; assert resource templates returned
4. **Backward Compatibility**: Run existing server tests against the extracted modules to verify no behavioral changes

### Pre-Publish Validation

1. **Tarball Inspection**: `npm pack --dry-run` shows only `dist/` files
2. **Local Install Test**: Install from tarball, run `jira-mcp --help`
3. **MCP Discovery Test**: Configure a local MCP client with the tarball-installed binary, verify tool discovery

## Implementation Notes

### Build Order Dependency

The unified server depends on workspace packages being compiled first. The monorepo build order is:

1. `libs/mcp-jira-shared` (no deps)
2. `servers/jira-core-mcp`, `servers/jira-dev-mcp`, `servers/jira-agile-mcp`, `servers/jira-context-mcp` (depend on shared)
3. `servers/jira-unified-mcp` (depends on all above via tsup import resolution)

pnpm's `--recursive` flag handles this automatically when dependency relationships are declared.

### Extracting Tool Registrations

The current servers have ~1000+ line `index.ts` files with tool definitions and handlers inline. The extraction approach:

1. Move tool definition arrays to `src/tools.ts` in each server
2. Move handler switch-case logic to the same file
3. Export a registration function that takes `(server, client)` and wires both
4. Update each server's `index.ts` to import from `tools.ts` (preserving standalone functionality)

This is a pure refactor with no behavioral changes.

### Registry Configuration

Developers need this one-time `.npmrc` setup:

```ini
@nmdp:registry=https://artifacts.nmdp.org/repository/npm-private/
```

This is already present in the workspace `.npmrc`. For developer machines, they need either:
- The same line in their user-level `~/.npmrc`
- Or `npm login --scope=@nmdp --registry=https://artifacts.nmdp.org/repository/npm-private/`

### Version Management

- Use `npm version patch|minor|major` to bump version in the unified server's `package.json`
- Tag the commit with the version (`v1.0.0`, `v1.1.0`, etc.)
- Publish manually with `npm publish` from `servers/jira-unified-mcp/`
- No automated publishing from CI; this is deliberate for safety
