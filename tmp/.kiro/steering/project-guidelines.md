# Jira MCP Project Steering

## Project Overview

This project implements a modular MCP server ecosystem for Jira integration, enabling AI agents to manage workflows with persistent session tracking and minimal context bloat.

## Architecture Principles

**Microservices Pattern**: Multiple specialized MCP servers over monolithic design
- `jira-core-mcp`: Basic CRUD operations
- `jira-dev-mcp`: Developer workflows and automation
- `jira-context-mcp`: Session tracking and context management
- `jira-xray-mcp`: Test execution (future)

**Minimal Code**: Only essential functionality, no over-engineering

**Shared Infrastructure**: Common auth, client, and types in `@jira-mcp/shared`

## Code Style

**TypeScript**:
- Strict mode enabled
- ES2022 target
- ES modules (type: "module")
- Explicit return types for public functions

**Naming**:
- Tools: `verb_noun` (e.g., `get_issue`, `start_work`)
- Functions: camelCase
- Types/Interfaces: PascalCase
- Constants: UPPER_SNAKE_CASE

**Error Handling**:
- User-friendly error messages
- Include actionable suggestions
- Log to stderr (stdout reserved for MCP protocol)

## Testing Requirements

**Unit Tests**:
- Mock external dependencies (Jira API, file system)
- Test error paths
- 80%+ code coverage for core logic

**Integration Tests**:
- Test with mock Jira API
- Validate complete workflows
- Test retry and recovery mechanisms

**Test Organization**:
- Colocate tests with source: `src/__tests__/`
- Use `.test.ts` extension
- Follow AAA pattern (Arrange, Act, Assert)

## MCP Server Guidelines

**Tool Design**:
- Clear, descriptive names
- Complete JSON schemas for inputs
- Validate with Zod
- Return structured responses
- Composite tools for multi-step operations

**Resource Design**:
- URI-based access patterns
- Read-only data exposure
- JSON content type
- Resource templates for discovery

**Prompt Design**:
- Reusable workflow templates
- Clear argument definitions
- Formatted output with context

## Session Management

**Storage**:
- JSON files in `.jira-sessions/`
- Atomic writes to prevent corruption
- Separate active/closed directories

**Sync Strategy**:
- Batch operations (5 min intervals)
- Retry with exponential backoff
- Graceful degradation on failures

**Activity Tracking**:
- Progress: Completed work
- Blockers: Impediments with severity
- Discoveries: Learnings and insights

## Jira Integration

**Authentication**:
- PAT (Personal Access Token) only
- Bearer token in Authorization header
- Never log or expose tokens

**API Usage**:
- Prefer v2 API for compatibility
- Handle rate limiting (429) with backoff
- Cache frequently accessed data
- Batch operations when possible

**Error Handling**:
- Transform Jira errors to user-friendly messages
- Suggest corrective actions
- Handle workflow-specific edge cases

## Development Workflow

**Branch Strategy**:
- Feature branches from main
- PR required for merge
- Squash commits on merge

**Commit Messages**:
- Format: `type(scope): description`
- Types: feat, fix, docs, test, refactor
- Example: `feat(context): add session recovery tool`

**Build Process**:
- `pnpm run build` - Build all workspaces
- `pnpm run dev --filter <workspace>` - Dev mode with hot reload
- `pnpm test` - Run all tests

## Documentation

**README.md**:
- Setup instructions
- Configuration examples
- Usage patterns
- Troubleshooting guide

**Code Comments**:
- Document why, not what
- Explain non-obvious decisions
- Link to relevant Jira API docs

**Tool Descriptions**:
- Clear purpose statement
- Parameter descriptions
- Example usage

## Configuration Management

**Environment Variables**:
- `JIRA_URL`: Jira instance URL
- `JIRA_TOKEN`: Personal Access Token
- `SESSION_STORAGE`: Session directory path
- `AUTO_SYNC_INTERVAL`: Sync interval in seconds

**Validation**:
- Validate on startup with Zod
- Fail fast with clear error messages
- Provide example .env file

## Performance Targets

**Context Reduction**: 50%+ fewer tool calls vs naive implementation

**Cache Hit Rate**: 70%+ for repeated data access

**Sync Success**: 99%+ (with retries)

**Session Recovery**: 100% from Jira comments

## Security Considerations

**Token Handling**:
- Never log tokens
- Mask tokens in error messages
- Store in environment variables only

**Session Data**:
- No sensitive data in session files
- Proper file permissions (600)
- Clean up old sessions

**API Calls**:
- Validate all inputs
- Sanitize JQL queries
- Prevent injection attacks

## Rollout Plan

**Phase 1**: Enhance existing servers (jira-core, jira-dev)
**Phase 2**: Build jira-context-mcp with session management
**Phase 3**: Add resources, caching, auto-sync
**Phase 4**: Testing, documentation, polish

## Success Metrics

- Reduced context bloat in AI conversations
- Persistent session state across conversation resets
- Human-readable activity tracking in Jira
- Efficient API usage with caching
- Reliable sync with retry mechanisms
