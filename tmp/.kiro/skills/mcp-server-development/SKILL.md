---
name: mcp-server-development
description: Expert in building Model Context Protocol (MCP) servers with TypeScript, focusing on minimal implementations, proper tool/resource/prompt design, and stdio transport patterns.
---

## Core Principles

**✅ Do** follow MCP SDK patterns from @modelcontextprotocol/sdk

**✅ Do** write minimal code - only essential functionality

**✅ Do** use stdio transport for local MCP servers

**✅ Do** implement proper error handling with user-friendly messages

**❌ Don't** over-engineer solutions or add unnecessary abstractions

## Server Structure

**✅ Do** initialize servers with name and version:

```typescript
const server = new Server(
  { name: 'server-name', version: '1.0.0' },
  { capabilities: { tools: {}, resources: {}, prompts: {} } }
);
```

**✅ Do** use separate request handlers for each MCP primitive:

```typescript
server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: [...] }));
server.setRequestHandler(CallToolRequestSchema, async (request) => { ... });
server.setRequestHandler(ListResourcesRequestSchema, async () => ({ resources: [...] }));
server.setRequestHandler(ReadResourceRequestSchema, async (request) => { ... });
server.setRequestHandler(ListPromptsRequestSchema, async () => ({ prompts: [...] }));
server.setRequestHandler(GetPromptRequestSchema, async (request) => { ... });
```

**✅ Do** connect via stdio transport:

```typescript
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Server running on stdio');
}
```

## Tool Design

**✅ Do** validate inputs with Zod schemas:

```typescript
const { key } = z.object({ key: z.string() }).parse(args);
```

**✅ Do** return structured responses:

```typescript
return {
  content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
};
```

**✅ Do** handle errors gracefully:

```typescript
catch (error) {
  return {
    content: [{ 
      type: 'text', 
      text: `Error: ${error instanceof Error ? error.message : String(error)}` 
    }],
    isError: true,
  };
}
```

**✅ Do** use clear, descriptive tool names and descriptions

**✅ Do** define complete JSON schemas for inputSchema

**👍 Prefer** composite tools that reduce multi-step operations

## Resource Design

**✅ Do** use URI patterns for resources:

```typescript
{
  uri: 'protocol://path/{param}',
  name: 'Resource Name',
  description: 'What this resource provides',
  mimeType: 'application/json'
}
```

**✅ Do** implement resource templates for discovery

**✅ Do** return structured JSON content for resources

**👍 Prefer** resources for read-only data access

**❌ Don't** use resources for operations with side effects

## Prompt Design

**✅ Do** create reusable prompt templates:

```typescript
{
  name: 'prompt_name',
  description: 'What this prompt does',
  arguments: [
    { name: 'param', description: 'Parameter description', required: true }
  ]
}
```

**✅ Do** return formatted prompt text with embedded context

**✅ Do** support argument substitution in templates

**👍 Prefer** prompts for common workflow patterns

## Environment Configuration

**✅ Do** load configuration from environment variables

**✅ Do** validate configuration on startup with Zod

**✅ Do** provide clear error messages for missing config

**❌ Don't** hardcode credentials or URLs

## Error Handling

**✅ Do** catch and transform API errors to user-friendly messages

**✅ Do** log errors to stderr (stdout is for MCP protocol)

**✅ Do** include actionable suggestions in error messages

**👍 Prefer** specific error types over generic messages

## Testing

**✅ Do** test tool invocations with valid/invalid inputs

**✅ Do** mock external API calls in tests

**✅ Do** test error handling paths

**👍 Prefer** integration tests with mock servers over unit tests

## Monorepo Patterns

**✅ Do** use npm workspaces for shared libraries

**✅ Do** create shared library for common code (auth, client, types)

**✅ Do** keep servers focused and independent

**👍 Prefer** multiple specialized servers over monolithic servers

## Build Configuration

**✅ Do** use TypeScript with strict mode

**✅ Do** target ES2022 or later

**✅ Do** use ES modules (type: "module")

**✅ Do** compile to dist/ directory

**✅ Do** add shebang to server entry point: `#!/usr/bin/env node`

## Common Patterns

**Composite Tool Pattern:**
```typescript
// Reduces multiple tool calls to one
async function compositeAction(params) {
  await step1(params);
  await step2(params);
  await step3(params);
  return comprehensiveContext;
}
```

**Caching Pattern:**
```typescript
// Reduce redundant API calls
const cache = new Map();
if (cache.has(key) && !isExpired(cache.get(key))) {
  return cache.get(key);
}
const data = await fetchFromAPI(key);
cache.set(key, { data, timestamp: Date.now() });
return data;
```

**Batch Operation Pattern:**
```typescript
// Accumulate operations, sync periodically
const queue = [];
queue.push(operation);
if (queue.length >= BATCH_SIZE || timeSinceLastSync > INTERVAL) {
  await syncBatch(queue);
  queue.length = 0;
}
```
