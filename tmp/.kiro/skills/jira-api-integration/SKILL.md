---
name: jira-api-integration
description: Expert in Jira REST API v2/v3 integration patterns, authentication, error handling, and efficient API usage for workflow automation.
---

## Authentication

**✅ Do** use Personal Access Token (PAT) authentication

**✅ Do** send PAT as Bearer token in Authorization header:

```typescript
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

**✅ Do** validate token on startup

**❌ Don't** log or expose tokens in error messages

## API Versions

**✅ Do** understand v2 vs v3 differences:
- v2: Uses wiki markup for rich text, stable and widely supported
- v3: Uses Atlassian Document Format (ADF), newer features

**👍 Prefer** v2 API for compatibility unless v3-specific features needed

**✅ Do** use correct endpoints:
- v2: `/rest/api/2/...`
- v3: `/rest/api/3/...`
- Agile: `/rest/agile/1.0/...`

## Common Operations

**Issue CRUD:**
```typescript
// GET /rest/api/2/issue/{issueKey}
// POST /rest/api/2/issue
// PUT /rest/api/2/issue/{issueKey}
// DELETE /rest/api/2/issue/{issueKey}
```

**Comments:**
```typescript
// POST /rest/api/2/issue/{issueKey}/comment
// Body: { body: "comment text" }
```

**Transitions:**
```typescript
// GET /rest/api/2/issue/{issueKey}/transitions
// POST /rest/api/2/issue/{issueKey}/transitions
// Body: { transition: { id: "transitionId" } }
```

**Worklogs:**
```typescript
// GET /rest/api/2/issue/{issueKey}/worklog
// POST /rest/api/2/issue/{issueKey}/worklog
// Body: { timeSpentSeconds: 3600, comment: "Work done" }
```

**Search (JQL):**
```typescript
// POST /rest/api/2/search
// Body: { jql: "project = TEST AND status = Open", maxResults: 50 }
```

## Error Handling

**✅ Do** handle common HTTP status codes:
- 400: Bad request - validate input
- 401: Unauthorized - check token
- 403: Forbidden - check permissions
- 404: Not found - verify issue key exists
- 429: Rate limited - implement backoff
- 500: Server error - retry with exponential backoff

**✅ Do** parse Jira error responses:

```typescript
interface JiraError {
  errorMessages: string[];
  errors: Record<string, string>;
}
```

**✅ Do** provide actionable error messages:

```typescript
if (status === 404) {
  throw new Error(`Issue ${key} not found. Verify the issue key is correct.`);
}
```

## Rate Limiting

**✅ Do** implement exponential backoff for rate limits

**✅ Do** respect Retry-After header

**👍 Prefer** batch operations over individual calls

**👍 Prefer** caching frequently accessed data

## Field Updates

**✅ Do** use correct field structure for updates:

```typescript
{
  fields: {
    summary: "New summary",
    description: "New description",
    labels: ["label1", "label2"],
    assignee: { accountId: "user-id" }
  }
}
```

**✅ Do** understand field types:
- Simple: summary, description (strings)
- Complex: assignee, reporter (objects with accountId)
- Arrays: labels, components, fixVersions

## Workflow Transitions

**✅ Do** query available transitions before transitioning:

```typescript
const transitions = await getTransitions(issueKey);
const targetTransition = transitions.find(t => 
  t.to.name.toLowerCase().includes('progress')
);
```

**✅ Do** handle workflow-specific transitions (vary by project/issue type)

**❌ Don't** hardcode transition IDs - they vary by instance

## JQL Best Practices

**✅ Do** use proper JQL syntax:

```jql
project = TEST AND status = "In Progress" AND assignee = currentUser()
```

**✅ Do** escape special characters in JQL

**✅ Do** use JQL functions:
- `currentUser()` - current authenticated user
- `now()` - current timestamp
- `startOfDay()`, `endOfDay()` - date boundaries

**👍 Prefer** structured queries over complex JQL when possible

## Pagination

**✅ Do** handle paginated responses:

```typescript
{
  startAt: 0,
  maxResults: 50,
  total: 150,
  issues: [...]
}
```

**✅ Do** implement pagination for large result sets

**👍 Prefer** reasonable maxResults (50-100) to avoid timeouts

## Agile/Sprint Operations

**✅ Do** use Agile API for sprint operations:

```typescript
// GET /rest/agile/1.0/board/{boardId}/sprint
// POST /rest/agile/1.0/sprint/{sprintId}/issue
```

**✅ Do** handle cases where Jira Software is not available

**✅ Do** query board ID before sprint operations

## Performance Optimization

**✅ Do** use field filtering to reduce response size:

```typescript
GET /rest/api/2/issue/{key}?fields=summary,status,assignee
```

**✅ Do** cache static data (users, projects, workflows)

**✅ Do** batch operations when possible

**❌ Don't** poll Jira excessively - use webhooks if available

## Testing with Jira API

**✅ Do** use mock Jira API for tests

**✅ Do** test error scenarios (404, 401, 429)

**✅ Do** validate request payloads match Jira schema

**👍 Prefer** integration tests with test Jira instance for validation

## Common Pitfalls

**❌ Don't** assume transition IDs are consistent across instances

**❌ Don't** assume field IDs are standard (custom fields vary)

**❌ Don't** ignore pagination - large projects have many issues

**❌ Don't** hardcode project keys or issue types

**❌ Don't** forget to handle workflow validation errors

## Structured Comments

**✅ Do** use markdown formatting in comments:

```markdown
**Progress:**
- Item 1
- Item 2

**Blockers:**
- [SEVERITY] Description
```

**✅ Do** add metadata markers for parsing:

```markdown
[AI-TRACKED] 2026-03-02T20:45:00-06:00
Session: {session-id}
```

**✅ Do** keep comments human-readable

## Worklog Best Practices

**✅ Do** use seconds for timeSpentSeconds field

**✅ Do** include descriptive comments in worklogs

**✅ Do** set started timestamp for accurate tracking:

```typescript
{
  timeSpentSeconds: 7200,
  comment: "Implemented authentication module",
  started: "2026-03-02T14:00:00.000-0600"
}
```

**👍 Prefer** aggregating time entries over frequent small worklogs
