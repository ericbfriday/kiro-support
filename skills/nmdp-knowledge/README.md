# nmdp-knowledge Skill

A Kiro skill that searches NMDP internal knowledge across Confluence, Jira, and GitLab to answer domain questions without requiring user intervention.

## Purpose

This skill acts as a knowledge layer for AI agents working in the NMDP/Be The Match ecosystem. Rather than asking the user about domain terminology, system architecture, or organizational context, the agent searches internal sources first.

It's designed to be invoked implicitly by other skills (diagnosis, implementation, grilling) whenever they encounter NMDP-specific terminology or need organizational context.

## What's Included

| File | Purpose |
|------|---------|
| `SKILL.md` | Skill definition with search strategy, Confluence navigation, and quick glossary |
| `REFERENCE.md` | Full reference: Confluence space directory, domain glossary, search examples, GitLab org structure |
| `mcp.example.json` | Example MCP server configuration showing all required servers |

## MCP Server Dependencies

This skill requires three capabilities, provided by four MCP servers:

| Server | Capability | Key Tools |
|--------|-----------|-----------|
| `lore` | Confluence search & page reading | `search_confluence`, `get_page_content`, `get_page_tree` |
| `matchsync-jimi` | Jira issue search & management | JQL search, issue details, sprint/board navigation |
| `gitlab-bethematch` | GitLab code search | `search` (blobs), `semantic_code_search`, merge requests |
| `atlassian-confluence-dc` | Alternative Confluence access (Data Center) | `confluence_searchContent`, `confluence_getContent` |

The skill degrades gracefully — if only some servers are available, it searches what it can and skips unavailable sources.

## Installation

### 1. Copy skill files to your Kiro skills directory

```bash
# User-level (available in all projects)
cp -r skills/nmdp-knowledge ~/.kiro/skills/

# Or workspace-level (available only in this project)
cp -r skills/nmdp-knowledge .kiro/skills/
```

### 2. Configure MCP servers

Copy the example config and fill in your credentials:

```bash
cp skills/nmdp-knowledge/mcp.example.json ~/.kiro/settings/mcp.json
```

Edit the file to replace:
- `/Users/you/.volta/bin/volta` → your actual Volta path (e.g., `/Users/yourname/.volta/bin/volta`)
- `/absolute/path/to/...` → actual paths to each MCP server's built entry point
- `YOUR_*_TOKEN_HERE` → your personal access tokens

**Important**: MCP configs must use absolute paths because Kiro spawns MCP servers directly via `execve()`, not through a shell. Volta's PATH shims are not available in this context — use the `volta run` pattern shown in the example.

### 3. Required environment variables

| Variable | Description |
|----------|-------------|
| `CONFLUENCE_BASE_URL` | Your Confluence Data Center base URL |
| `CONFLUENCE_TOKEN` | Personal Access Token for Confluence |
| `JIRA_URL` | Your Jira instance URL |
| `JIRA_TOKEN` | Personal Access Token for Jira |
| `GITLAB_URL` | Your GitLab instance URL |
| `GITLAB_TOKEN` | Personal Access Token for GitLab |

## Usage

The skill activates automatically when the agent encounters NMDP domain terms or needs organizational context. You can also invoke it explicitly:

```
Search our Confluence for the Patient Import architecture docs
```

```
What does "GL String" mean in the NMDP context?
```

```
Find the current sprint work for the MatchSync team
```

### Search strategy

The skill routes queries to the appropriate source:

- **Architecture/design/glossary** → Confluence (lore)
- **Who's working on X, sprint status** → Jira (matchsync-jimi)
- **Code patterns, implementations** → GitLab (gitlab-bethematch)
- **How-to, runbooks** → Confluence
- **Cross-team integrations** → Confluence + GitLab

## Domain Coverage

The skill includes a comprehensive glossary covering:

- **Core HLA/genomics concepts** — alleles, haplotypes, GL Strings, MACs, match grades
- **Organizations & standards** — NMDP, WMDA, CIBMTR, EMDIS, IMGT
- **Cell sources & transplant** — PBSC, CBU, workup, engraftment, GVHD
- **Internal systems** — MatchSource, SearchLite, HapLogic, NMSM, DOTS, DRE
- **Technical concepts** — FHIR, HML, GRD, NGS, IDM

See `REFERENCE.md` for the full directory of Confluence spaces, applications, and search examples.
