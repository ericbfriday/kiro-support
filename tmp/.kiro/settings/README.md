# MCP Configuration

This directory contains MCP server configurations for Kiro.

## Files

- `mcp.json` - Workspace configuration using environment variables (safe to commit)
- `mcp.example.json` - Alternative example with hardcoded paths

## Setup

Kiro uses environment variable expansion to keep secrets out of configuration files. The `mcp.json` file references environment variables that you need to set.

### Required Environment Variables

Add these to your shell profile (`~/.zshrc`, `~/.bashrc`, etc.):

```bash
export JIRA_MCP_PROJECT_ROOT="/Users/efriday/btm/ai/jira-helper-mcp"
export JIRA_URL="https://qa.jira.nmdp.org"
export JIRA_TOKEN="your-personal-access-token"
```

Or use a `.env` file with a tool like `direnv` for automatic loading.

### Steps

1. Set the environment variables in your shell profile
2. Reload your shell: `source ~/.zshrc` (or restart your terminal)
3. Build the servers: `pnpm run build`
4. Restart Kiro to load the configuration

### Verifying Configuration

Check that Kiro can expand the variables:
- Open Kiro's MCP Server panel
- Look for the three Jira servers (jira-core, jira-dev, jira-context)
- Check their connection status

## Configuration Priority

Kiro loads MCP configurations in this order (later overrides earlier):
1. User config: `~/.kiro/settings/mcp.json`
2. Workspace config: `.kiro/settings/mcp.json` (this file)

## Security

- Never commit credentials directly in `mcp.json`
- Use environment variable expansion: `${VARIABLE_NAME}`
- Kiro only expands explicitly approved environment variables
- Keep your `.env` or `.env.local` files in `.gitignore`

## Alternative: User-Level Configuration

If you prefer not to use environment variables, you can create a user-level config at `~/.kiro/settings/mcp.json` with hardcoded values. This file is outside version control and won't be shared with the team.

