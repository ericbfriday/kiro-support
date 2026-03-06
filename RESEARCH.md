# RESEARCH.md - kiro-transition-toolkit Phase 1 Research

**Date**: March 5-6, 2026  
**Status**: Complete  
**Purpose**: Document all Phase 1 research findings with citations before implementation

---

## Table of Contents

1. [Kiro Format Specifications](#1-kiro-format-specifications)
   - 1.1 [Steering Files](#11-steering-files)
   - 1.2 [Spec Artifacts](#12-spec-artifacts)
   - 1.3 [Hooks System](#13-hooks-system)
   - 1.4 [Powers System](#14-powers-system)
   - 1.5 [CLI & Agent Configuration](#15-cli--agent-configuration)
   - 1.6 [MCP Integration](#16-mcp-integration)
2. [Runtime Version Manager Detection](#2-runtime-version-manager-detection)
   - 2.1 [Node.js](#21-nodejs)
   - 2.2 [Python](#22-python)
   - 2.3 [Java/JVM](#23-javajvm)
   - 2.4 [Ruby/Go/Rust/.NET/PHP](#24-rubygorustnetphp)
3. [CI/CD Environment Detection](#3-cicd-environment-detection)
4. [AI Context File Formats](#4-ai-context-file-formats)
5. [Uncertainties & TODOs](#5-uncertainties--todos)

---

## 1. Kiro Format Specifications

### 1.1 Steering Files

**Location**:
- Workspace: `.kiro/steering/`
- Global: `~/.kiro/steering/`
- AGENTS.md: Project root or `~/.kiro/steering/`

**YAML Front-Matter Schema**:

```yaml
---
inclusion: <mode>              # Required: always | fileMatch | manual | auto
fileMatchPattern: <glob>       # Conditional: for fileMatch mode (array or string)
name: <string>                 # Conditional: for auto mode
description: <string>          # Conditional: for auto mode - when to include
---
```

**Inclusion Modes**:

| Mode | Trigger | Use Case |
|------|---------|----------|
| `always` | Every interaction | Project-wide standards, tech stack |
| `fileMatch` | Files matching glob pattern | Domain-specific rules |
| `manual` | Explicit `#filename` reference | Troubleshooting, specialized guides |
| `auto` | Description matching | Context-heavy guidance loaded on-demand |

**Known Issues**:
- `fileMatch` does NOT work in global steering (workspace only) - [Issue #5027](https://github.com/kirodotdev/Kiro/issues/5027)
- Simple patterns like `"*.py"` may not work; use `"**/*.py"` - [Issue #1643](https://github.com/kirodotdev/Kiro/issues/1643)

**Live References**:
```markdown
#[[file:.nvmrc]]
#[[file:pyproject.toml]]
```
- Max file size: 250KB (truncated if larger)
- Supports text files only (no binary)

**AGENTS.md Standard**:
- Cross-platform format (Kiro, Cursor, Windsurf, Zed, etc.)
- No inclusion modes - always included
- Standard Markdown only
- [Specification](https://agents.md/)

**Sources**:
- [Kiro Steering Docs](https://kiro.dev/docs/steering/)
- [Kiro CLI Steering](https://kiro.dev/docs/cli/steering/)
- [File References](https://kiro.dev/docs/cli/chat/file-references/)

---

### 1.2 Spec Artifacts

**Directory Structure**:
```
.kiro/specs/<feature-name>/
├── spec.json            # Metadata, phase tracking, approvals
├── requirements.md      # User stories + EARS acceptance criteria
├── design.md            # Architecture, components, Mermaid diagrams
├── tasks.md             # 2-level task hierarchy with requirement mapping
└── research.md          # Optional: Discovery findings
```

**Naming**: kebab-case (e.g., `oauth2-email-support`)

**spec.json Format**:
```json
{
  "feature_name": "feature-name",
  "created_at": "2026-02-06T11:43:56Z",
  "updated_at": "2026-02-13T00:00:00Z",
  "language": "en",
  "phase": "tasks-generated",
  "approvals": {
    "requirements": { "generated": true, "approved": true },
    "design": { "generated": true, "approved": true },
    "tasks": { "generated": true, "approved": false }
  },
  "ready_for_implementation": false
}
```

**Phase Values**: `initialized` → `requirements-generated` → `design-generated` → `tasks-generated` → `implementation-complete`

**EARS Notation** (for requirements.md):

| Pattern | Format |
|---------|--------|
| Event-Driven | `When [event], [system] shall [response]` |
| State-Driven | `While [state], [system] shall [response]` |
| Unwanted Behavior | `If [trigger], [system] shall [response]` |
| Optional Feature | `Where [feature], [system] shall [response]` |
| Ubiquitous | `The [system] shall [response]` |

**Requirements ID Format**: Numeric only (e.g., `1.1`, `1.2`) - NOT alphabetic

**design.md Sections**:
- Overview (purpose, users, impact, goals, non-goals)
- Architecture (pattern, Mermaid diagram, integration)
- System Flows (sequence diagrams)
- Requirements Traceability (table mapping to components)
- Components and Interfaces (with requirements mapping)
- Optional: Data Models, Error Handling, Testing, Security, Performance

**tasks.md Format**:
```markdown
- [ ] 1. Major task description
  - Detail item 1
  - _Requirements: 1.1, 1.2_

- [ ] 1.1 Sub-task description (P)
  - _Requirements: 1.3_
```
- Maximum 2 levels (no `1.1.1`)
- `(P)` marker for parallel-capable tasks
- Natural language descriptions (no file paths/method names)

**Sources**:
- [Kiro Specs Docs](https://kiro.dev/docs/specs/)
- [growilabs/growi specs](https://github.com/growilabs/growi/tree/master/.kiro/specs/oauth2-email-support)

---

### 1.3 Hooks System

**File Location**: `.kiro/hooks/*.kiro.hook`

**JSON Schema**:
```json
{
  "enabled": true,
  "name": "Hook Name",
  "description": "What this hook does",
  "version": "1",
  "when": {
    "type": "fileEdited",
    "patterns": ["**/*.ts"]
  },
  "then": {
    "type": "askAgent",
    "prompt": "Instructions for the agent"
  }
}
```

**Event Types (when.type)**:

| Type | Trigger |
|------|---------|
| `fileEdited` | File saved |
| `fileCreated` | New file created |
| `fileDeleted` | File deleted |
| `manual` | Button press in UI |
| `PromptSubmit` | User submits prompt |
| `AgentStop` | Agent finishes responding |
| `PreToolUse` | Before tool invocation |
| `PostToolUse` | After tool execution |
| `PreTaskExecution` | Before task starts |
| `PostTaskExecution` | After task completes |

**Action Types (then.type)**:
- `askAgent` - Send prompt to Kiro agent
- `shellCommand` - Execute shell command

**Best Practices**:
- Use minimal verbosity (`--silent`, `--quiet` flags) to prevent timeouts
- Specific patterns over broad globs
- Disable when not needed

**Sources**:
- [Kiro Hooks Types](https://kiro.dev/docs/hooks/types/)
- [Kiro Hooks Actions](https://kiro.dev/docs/hooks/actions/)
- [kiro-best-practices hooks](https://github.com/awsdataarchitect/kiro-best-practices/tree/main/.kiro/hooks)

---

### 1.4 Powers System

**Purpose**: Bundles MCP servers + documentation + best practices into installable packages

**Two Types**:
1. **Guided MCP Power** - Connects to MCP servers with documentation
2. **Knowledge Base Power** - Pure documentation, no MCP

**POWER.md Format**:
```yaml
---
name: "power-name"              # Required: lowercase kebab-case
displayName: "Human Readable"   # Required: 2-5 words
description: "What it does"     # Required: max 3 sentences
keywords: ["keyword1", "keyword2"]  # Optional: 5-7 terms
author: "Creator"               # Optional
---

# Overview
Content here...

## Available MCP Servers
...

## Best Practices
...
```

**Directory Structure**:
```
power-name/
├── POWER.md         # Required
├── mcp.json         # Required for Guided MCP Powers
└── steering/        # Optional: for dynamic loading
    └── workflow.md
```

**mcp.json Format**:
```json
{
  "mcpServers": {
    "server-name": {
      "command": "uvx",
      "args": ["package@latest"],
      "url": "https://remote.endpoint",
      "env": { "API_KEY": "${API_KEY}" },
      "disabled": false,
      "autoApprove": ["tool1", "tool2"],
      "disabledTools": []
    }
  }
}
```

**Powers vs Skills vs Steering**:

| Feature | Powers | Skills | Steering |
|---------|--------|--------|----------|
| Activation | Keywords | Description | Always/Conditional |
| MCP Servers | ✓ | ✗ | ✗ |
| Installable | ✓ | ✓ | ✗ |
| Cross-platform | ✗ (Kiro-only) | ✓ (11+ tools) | ✗ |
| Location | kiro.dev/GitHub | `.kiro/skills/` | `.kiro/steering/` |

**Sources**:
- [Kiro Powers Docs](https://kiro.dev/docs/powers/)
- [kirodotdev/powers repo](https://github.com/kirodotdev/powers)
- [Power Builder Guide](https://github.com/kirodotdev/powers/blob/master/power-builder/POWER.md)

---

### 1.5 CLI & Agent Configuration

**Key Commands**:

```bash
kiro-cli agent list                    # List agents
kiro-cli agent create <name>           # Create agent
kiro-cli agent validate --path <file>  # Validate config
kiro-cli chat --agent <name>           # Start with agent
kiro-cli mcp add --name <n> --command <cmd>  # Add MCP server
kiro-cli login --social google         # Authenticate
kiro-cli whoami                        # Current user info
```

**Agent JSON Schema** (get via `/agent schema` in chat):

```json
{
  "name": "agent-name",
  "description": "Agent description",
  "prompt": "System instructions",
  "mcpServers": { ... },
  "tools": ["read", "write", "shell"],
  "allowedTools": ["read"],
  "toolAliases": { "@git/git_status": "status" },
  "toolsSettings": {
    "write": { "allowedPaths": ["src/**"] }
  },
  "resources": ["file://README.md"],
  "hooks": {
    "agentSpawn": [{ "command": "git status" }]
  },
  "model": "claude-sonnet-4",
  "keyboardShortcut": "ctrl+a",
  "welcomeMessage": "Ready to help!"
}
```

**Configuration Locations**:
- Global settings: `~/.kiro/settings.json`
- Global MCP: `~/.kiro/settings/mcp.json`
- Global agents: `~/.kiro/agents/`
- Workspace MCP: `.kiro/settings/mcp.json`
- Workspace agents: `.kiro/agents/`

**Agent Precedence**: Local > Global

**Sources**:
- [CLI Commands Reference](https://kiro.dev/docs/cli/reference/cli-commands/)
- [Agent Configuration](https://kiro.dev/docs/cli/custom-agents/configuration-reference/)
- [Agent Examples](https://kiro.dev/docs/cli/custom-agents/examples/)

---

### 1.6 MCP Integration

**Configuration File Structure**:
```json
{
  "mcpServers": {
    "local-server": {
      "command": "uvx",
      "args": ["package@latest"],
      "env": { "API_KEY": "${API_KEY}" },
      "disabled": false,
      "autoApprove": ["tool1"],
      "timeout": 60000
    },
    "remote-server": {
      "type": "http",
      "url": "https://endpoint.url",
      "headers": { "Authorization": "Bearer token" }
    }
  }
}
```

**Loading Priority**: Agent config > Workspace MCP > Global MCP

**Security Best Practices**:
- Store secrets in `.env` files
- Use `autoApprove` sparingly
- Review tool capabilities before auto-approving

**Debugging**:
- Set `FASTMCP_LOG_LEVEL=DEBUG` for verbose logs
- Use MCP Inspector for testing
- Check MCP Server view in Kiro for errors

**Sources**:
- [MCP Configuration](https://kiro.dev/docs/cli/mcp/configuration/)
- [MCP Security](https://kiro.dev/docs/mcp/security/)
- [hustshawn/mcp-configs](https://github.com/hustshawn/mcp-configs)

---

## 2. Runtime Version Manager Detection

### 2.1 Node.js

**Version Managers**:

| Manager | Config Files | Detection |
|---------|--------------|-----------|
| **nvm** | `.nvmrc`, `~/.nvm/alias/default` | `NVM_DIR` env, PATH contains `.nvm/versions/node/` |
| **fnm** | `.node-version`, `.nvmrc` | `FNM_DIR` env, PATH contains `fnm_multishell` |
| **Volta** | `package.json` (`volta.node`), `~/.volta/` | `VOLTA_HOME` env, PATH `~/.volta/bin/node` |
| **asdf** | `.tool-versions` (`nodejs <version>`) | `ASDF_DIR` env, PATH contains `.asdf/shims` |
| **n** | None (replaces system binary) | `N_PREFIX` env, `which n` |
| **nodenv** | `.node-version` | `NODENV_ROOT` env, PATH contains `.nodenv/shims` |

**Detection Priority**:
1. Environment variable (`NODE_VERSION`)
2. Volta (`package.json` `volta.node`)
3. asdf (`.tool-versions` `nodejs`)
4. `.node-version` / `.nvmrc`
5. `package.json` `engines.node`

**File Formats**:
```
# .nvmrc
20.11.0
lts/*
node

# .tool-versions
nodejs 20.11.0

# package.json (Volta)
{ "volta": { "node": "20.11.0" } }
```

**Edge Cases**:
- Monorepos: Search recursively upwards
- Multiple managers: PATH precedence determines active manager
- Version ranges: Extract minimum satisfying version

**Sources**:
- [nvm README](https://github.com/nvm-sh/nvm)
- [fnm Source](https://github.com/Schniz/fnm)
- [Volta Guide](https://docs.volta.sh/)
- [asdf Config](https://asdf-vm.com/manage/configuration.html)

---

### 2.2 Python

**Version Managers**:

| Manager | Config Files | Detection |
|---------|--------------|-----------|
| **pyenv** | `.python-version`, `~/.pyenv/version` | `PYENV_VERSION` env |
| **asdf** | `.tool-versions` (`python <version>`) | `ASDF_DIR` env |
| **conda/mamba** | `environment.yml`, `conda-lock.yml` | `CONDA_PREFIX` env |
| **Poetry** | `pyproject.toml`, `poetry.lock` | Look for `poetry.lock` |
| **pipenv** | `Pipfile`, `Pipfile.lock` | Look for `Pipfile` |
| **uv** | `.python-version`, `uv.lock`, `pyproject.toml` | Look for `uv.lock` |

**File Formats**:
```toml
# pyproject.toml (Poetry)
[tool.poetry.dependencies]
python = "^3.10"

# pyproject.toml (uv/PEP 621)
[project]
requires-python = ">=3.10"
```

```yaml
# environment.yml (conda)
dependencies:
  - python=3.11.2
```

**Precedence**: `PYENV_VERSION` > `.python-version` > `pyproject.toml` > global

**Edge Cases**:
- pyenv + Poetry: Poetry's `virtualenvs.prefer-active-python` setting
- venv detection: Look for `pyvenv.cfg` in `.venv/`, `venv/`, `env/`
- uv vs pip: If `uv.lock` exists, `uv` is primary

**Sources**:
- [pyenv Commands](https://github.com/pyenv/pyenv/blob/master/COMMANDS.md)
- [uv Python Versions](https://docs.astral.sh/uv/concepts/python-versions/)
- [Poetry Docs](https://python-poetry.org/)

---

### 2.3 Java/JVM

**Version Managers**:

| Manager | Config Files | Detection |
|---------|--------------|-----------|
| **SDKMAN!** | `.sdkmanrc` | `SDKMAN_DIR` env |
| **asdf** | `.tool-versions` (`java <version>`) | `ASDF_DIR` env |
| **jenv** | `.java-version`, `~/.jenv/version` | `JENV_VERSION` env |
| **Jabba** | `.jabbarc` | `JABBA_HOME` env |
| **Gradle** | `build.gradle(.kts)` (toolchain) | Parse DSL |
| **Maven** | `.mvn/wrapper/maven-wrapper.properties` | Wrapper config |

**File Formats**:
```
# .sdkmanrc
java=11.0.17-tem

# .tool-versions
java adoptopenjdk-11.0.16+8

# .java-version
17.0.2

# build.gradle.kts (Gradle toolchain)
java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(17)
    }
}
```

**Precedence**: `JENV_VERSION` > `.java-version` > `.jabbarc` > `.tool-versions` > `.sdkmanrc` > global

**Version Candidates** (vendor-version format):
- `adoptopenjdk-11.0.16+8`
- `temurin-17.0.9`
- `zulu-21.0.2`
- `amzn-21` (Amazon Corretto)

**Sources**:
- [SDKMAN CLI](https://github.com/sdkman/sdkman-cli)
- [jenv](https://github.com/jenv/jenv)
- [Jabba](https://github.com/shyiko/jabba)
- [Gradle Toolchains](https://docs.gradle.org/current/userguide/toolchains.html)

---

### 2.4 Ruby/Go/Rust/.NET/PHP

#### Ruby
| Manager | Config | Detection |
|---------|--------|-----------|
| rbenv | `.ruby-version` | `RBENV_VERSION` env |
| rvm | `.ruby-version`, `.rvmrc` | Shell hook |
| asdf | `.tool-versions` (`ruby <version>`) | `ASDF_DIR` env |

#### Go
| Manager | Config | Detection |
|---------|--------|-----------|
| Go toolchain | `go.mod` (`go` directive), `go.work` | Parse directives |
| asdf | `.tool-versions` (`golang <version>`) | `ASDF_DIR` env |
| GVM | `~/.gvm` | `GVM_ROOT` env |

```go
// go.mod
go 1.22.0
toolchain go1.22.5
```

#### Rust
| Manager | Config | Detection |
|---------|--------|-----------|
| rustup | `rust-toolchain.toml`, `rust-toolchain` | `RUSTUP_TOOLCHAIN` env |
| asdf | `.tool-versions` (`rust <version>`) | `ASDF_DIR` env |

```toml
# rust-toolchain.toml
[toolchain]
channel = "1.84.0"
components = ["rust-analyzer", "clippy"]
```

#### .NET
| Manager | Config | Detection |
|---------|--------|-----------|
| .NET CLI | `global.json` | Search upwards |
| asdf | `.tool-versions` (`dotnet-core <version>`) | `ASDF_DIR` env |

```json
// global.json
{
  "sdk": {
    "version": "8.0.100",
    "rollForward": "latestFeature"
  }
}
```

#### PHP
| Manager | Config | Detection |
|---------|--------|-----------|
| phpenv | `.php-version` | `PHPENV_VERSION` env |
| asdf | `.tool-versions` (`php <version>`) | `ASDF_DIR` env |

---

## 3. CI/CD Environment Detection

### GitHub Actions

**File**: `.github/workflows/*.yml`

**Patterns**:
```yaml
# Setup actions
- uses: actions/setup-node@v4
  with:
    node-version: '20.11.0'
    node-version-file: '.nvmrc'

# Matrix strategy
strategy:
  matrix:
    node: [18, 20, 22]
```

**Extraction**: Parse YAML, find `uses: actions/setup-*`, extract `with.*-version`

### GitLab CI

**File**: `.gitlab-ci.yml`

**Patterns**:
```yaml
image: ruby:3.2.2

variables:
  RUBY_VERSION: "3.2.2"

test:
  image: python:${PYTHON_VERSION}
```

### Docker

**Files**: `Dockerfile`, `docker-compose.yml`

**Patterns**:
```dockerfile
FROM node:20.11.0
ARG NODE_VERSION=20.11.0
FROM node:${NODE_VERSION}
```

### Jenkins

**File**: `Jenkinsfile`

**Patterns**:
```groovy
pipeline {
  tools {
    jdk 'OpenJDK 21'
    maven 'apache-maven-3.9.6'
  }
  agent {
    docker { image 'node:20-alpine' }
  }
}
```

### CircleCI

**File**: `.circleci/config.yml`

**Patterns**:
```yaml
jobs:
  build:
    docker:
      - image: cimg/node:20.11.0
```

### Azure Pipelines

**File**: `azure-pipelines.yml`

**Patterns**:
```yaml
resources:
  containers:
    - container: node-20
      image: node:20.11.0
```

### Bitbucket

**File**: `bitbucket-pipelines.yml`

**Patterns**:
```yaml
image: node:20.11.0

pipelines:
  default:
    - step:
        image: python:3.12-slim
```

**Sources**:
- [GitHub Actions setup-node](https://github.com/actions/setup-node)
- [GitLab CI Docker Images](https://docs.gitlab.com/ci/docker/using_docker_images/)
- [Dockerfile Reference](https://docs.docker.com/reference/dockerfile/)
- [Jenkins Pipeline Syntax](https://www.jenkins.io/doc/book/pipeline/syntax/)

---

## 4. AI Context File Formats

### CLAUDE.md (Claude Code)

**Location**: Root `CLAUDE.md`, `.claude/CLAUDE.md`, `~/.claude/CLAUDE.md`

**Structure**: Standard Markdown with sections like `## Build Commands`, `## Code Style`

**Parsing**: Markdown parser, extract headings and code blocks

### .cursor/rules/ (Cursor)

**Location**: `.cursor/rules/*.mdc`, `.cursorrules` (legacy)

**Structure**: Markdown with YAML frontmatter
```yaml
---
description: "Rules for React"
globs: "src/**/*.tsx"
alwaysApply: true
---
```

**Parsing**: Frontmatter parser (gray-matter), extract `globs`

### .github/copilot-instructions.md (Copilot)

**Location**: `.github/copilot-instructions.md`, `.github/instructions/**/*.instructions.md`

**Structure**: Standard Markdown, section-based

### .continue/config.yaml (Continue)

**Location**: `.continue/config.yaml`, `~/.continue/config.yaml`

**Structure**:
```yaml
rules:
  - "Use TypeScript strict mode"
prompts:
  - name: "test"
    description: "Generate tests"
```

### .aider.conf.yml (Aider)

**Location**: Root `.aider.conf.yml`

**Structure**:
```yaml
read:
  - CONVENTIONS.md
  - STYLE.md
model: claude-3-opus
```

### .windsurfrules (Windsurf/Codeium)

**Location**: `.windsurfrules`, `.windsurf/rules/*.md`

**Structure**: Standard Markdown, similar to CLAUDE.md

### AGENTS.md

**Location**: Root `AGENTS.md`, nested in subdirectories

**Structure**: Standard Markdown, "README for agents"
- `## Setup`, `## Testing`, `## Style`
- Hierarchical precedence (nested overrides root)

**Conversion**: Closest to Kiro steering; condense into concise rules

**Sources**:
- [AGENTS.md Specification](https://agents.md/)
- [Cursor Rules](https://cursor.com/docs/context/rules)
- [GitHub Copilot Instructions](https://docs.github.com/en/copilot/customizing-copilot/)
- [Continue Config](https://docs.continue.dev/customize/config)
- [Aider Configuration](https://aider.chat/docs/config/aider_conf.html)

---

## 5. Uncertainties & TODOs

### Items Requiring Verification

1. **Kiro Agent Schema URL**: No public `$schema` URL documented. Must use `/agent schema` command in Kiro CLI session.
   - **TODO**: Verify schema against https://kiro.dev/docs/ when implementing

2. **Hook Event Behavior**: Some edge cases in hook triggering (file copy/move events)
   - **Issue**: [#4738](https://github.com/kirodotdev/Kiro/issues/4738)
   - **TODO**: Test with real Kiro installation

3. **Spec EARS Notation**: Ensure all generated requirements follow exact EARS syntax
   - **TODO**: Validate against real Kiro spec examples

4. **Power Distribution**: Publishing to kiro.dev may have undocumented requirements
   - **TODO**: Research power publishing process

5. **MCP Server Namespace Collision**: Kiro auto-namespaces server names during installation
   - **TODO**: Document how to handle in mcp.json generation

### Implementation Notes

- All date/timestamps use ISO 8601 format
- Version ranges should be preserved as-is (not resolved)
- File references use forward slashes (cross-platform)
- YAML front-matter must be first content (no blank lines before `---`)

---

## Summary

This research provides complete specifications for:
- ✅ Kiro steering files, specs, hooks, powers, CLI, MCP
- ✅ 8 runtime ecosystems (Node, Python, Java, Ruby, Go, Rust, .NET, PHP)
- ✅ 7 CI/CD platforms (GitHub Actions, GitLab, Docker, Jenkins, CircleCI, Azure, Bitbucket)
- ✅ 7 AI context formats (Claude, Cursor, Copilot, Continue, Aider, Windsurf, AGENTS.md)

**Ready for Phase 2**: Implementation can proceed with confidence. All critical specifications have been documented with source URLs for verification.
