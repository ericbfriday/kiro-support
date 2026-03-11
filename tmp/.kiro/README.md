# Jira MCP Workspace Configuration

This document describes the Kiro workspace artifacts created for the Jira MCP project.

## Skills

### mcp-server-development
**Location**: `.kiro/skills/mcp-server-development/SKILL.md`

Expert knowledge for building MCP servers with TypeScript:
- Server initialization and configuration
- Tool/Resource/Prompt design patterns
- Error handling and validation
- Stdio transport patterns
- Monorepo organization
- Common implementation patterns (composite tools, caching, batching)

### jira-api-integration
**Location**: `.kiro/skills/jira-api-integration/SKILL.md`

Expert knowledge for Jira REST API integration:
- PAT authentication
- API v2/v3 differences and usage
- Common operations (CRUD, comments, transitions, worklogs, search)
- Error handling and rate limiting
- JQL best practices
- Agile/Sprint operations
- Performance optimization
- Structured comment formatting

### session-management
**Location**: `.kiro/skills/session-management/SKILL.md`

Expert knowledge for session-based workflow tracking:
- Session data modeling
- File storage patterns with atomic writes
- Activity tracking (progress, blockers, discoveries)
- Batch synchronization strategies
- Session recovery mechanisms
- TTL-based caching
- Concurrency handling
- Auto-sync implementation

### javascript-testing-expert
**Location**: `~/.kiro/skills/javascript-testing-expert/SKILL.md` (global)

Expert knowledge for JavaScript/TypeScript testing:
- Test structure and organization
- AAA pattern (Arrange, Act, Assert)
- Property-based testing with fast-check
- Mocking and stubbing
- Vitest framework usage

## Agents

### jira-mcp-implementer
**Location**: `.kiro/agents/jira-mcp-implementer.json`

Specialized agent for implementing features from the ai-workflow-tracking specification:
- **Skills**: mcp-server-development, jira-api-integration, session-management, javascript-testing-expert
- **Context**: Specification, README, implementation docs
- **Focus**: Minimal code, Zod validation, error handling, testing

### jira-mcp-tester
**Location**: `.kiro/agents/jira-mcp-tester.json`

Specialized agent for comprehensive testing:
- **Skills**: javascript-testing-expert, mcp-server-development, jira-api-integration
- **Context**: Specification, testing docs
- **Focus**: Unit tests, integration tests, mocking, edge cases, 80%+ coverage

## Steering

### project-guidelines.md
**Location**: `.kiro/steering/project-guidelines.md`

Project-specific guidelines covering:
- Architecture principles (microservices, minimal code, shared infrastructure)
- Code style (TypeScript, naming conventions, error handling)
- Testing requirements (unit, integration, coverage targets)
- MCP server guidelines (tools, resources, prompts)
- Session management patterns
- Jira integration best practices
- Development workflow (branching, commits, build)
- Documentation standards
- Configuration management
- Performance targets
- Security considerations
- Rollout plan and success metrics

## Specifications

### ai-workflow-tracking.md
**Location**: `.kiro/specs/ai-workflow-tracking.md`

Complete specification for AI workflow tracking enhancements:
- **Requirements**: Functional, technical, and non-functional requirements
- **Design**: Architecture, component design, data models, APIs
- **Tasks**: 14 detailed tasks across 4 phases with acceptance criteria

## Current Status

**Checkpoint**: Foundation Complete + AI Workflow Tracking Specification Ready  
**Date**: 2026-03-02

### Completed
- ✅ jira-core-mcp (6 tools)
- ✅ jira-dev-mcp (4 tools)
- ✅ Shared library with auth, client, types
- ✅ Complete AI workflow tracking specification
- ✅ Kiro workspace with skills, agents, steering

### Next Steps
1. Implement Phase 1 of ai-workflow-tracking.md (Tasks 1.1-1.3)
2. Add history/worklog tools to jira-core-mcp
3. Add structured comments to jira-dev-mcp
4. Create composite `start_tracked_work` tool

See `docs/status.md` for detailed checkpoint information.

## Usage

### Invoke Specialized Agents

```bash
# Use implementer agent for feature development
kiro-cli chat --agent jira-mcp-implementer

# Use tester agent for test creation
kiro-cli chat --agent jira-mcp-tester

# Example: Resume from checkpoint
kiro-cli chat --agent jira-mcp-implementer
# Then: "Implement Task 1.1 from the ai-workflow-tracking specification"
```

### Reference Skills in Prompts

Skills are automatically loaded based on:
1. Workspace skills (`.kiro/skills/`)
2. Global skills (`~/.kiro/skills/`)
3. Agent configuration (when using --agent flag)

### Apply Steering Guidelines

Steering documents are automatically applied when:
1. Working in the project directory
2. Using specialized agents that reference them

## Skill Dependencies

```
jira-mcp-implementer
├── mcp-server-development
├── jira-api-integration
├── session-management
└── javascript-testing-expert

jira-mcp-tester
├── javascript-testing-expert
├── mcp-server-development
└── jira-api-integration
```

## Next Steps

1. Review the specification: `.kiro/specs/ai-workflow-tracking.md`
2. Use `jira-mcp-implementer` agent to implement Phase 1 tasks
3. Use `jira-mcp-tester` agent to create comprehensive tests
4. Follow steering guidelines in `.kiro/steering/project-guidelines.md`
5. Update documentation as features are completed
