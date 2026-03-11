# AI Workflow Tracking Enhancement Specification

**Version:** 1.0  
**Date:** 2026-03-02  
**Status:** Draft

## Problem Statement

The current Jira MCP server ecosystem lacks mechanisms for AI agents to maintain workflow context across sessions, leading to:
- Context bloat from repetitive tool calls
- Loss of work session state when conversations reset
- No structured tracking of progress, blockers, and discoveries
- Inefficient API usage with redundant data fetching

AI-driven workflows need persistent session tracking, batch operations, and structured activity logging to Jira while minimizing context window consumption.

---

## Requirements

### Functional Requirements

**FR-1: Session Management**
- AI must initialize work sessions with issue context
- Sessions must persist across conversation resets
- Sessions must track: start time, goals, issue key, user

**FR-2: Activity Tracking**
- AI must log progress updates with timestamps
- AI must document blockers with severity levels
- AI must capture discoveries/learnings during work
- All activities must be retrievable for session summary

**FR-3: Jira Synchronization**
- AI must batch-sync session activities to Jira
- Sync must create structured, searchable comments
- Sync must update worklogs with time tracking
- Sync must preserve human readability in Jira UI

**FR-4: Context Optimization**
- AI must access issue context without explicit tool calls
- AI must retrieve related issues, history, and dependencies
- AI must cache frequently accessed data locally
- Composite operations must reduce multi-step tool call sequences

**FR-5: Workflow Automation**
- AI must start tracked work with single composite action
- AI must update progress with structured metadata
- AI must retrieve session summaries for status reporting
- AI must recover session state from Jira comments

### Technical Requirements

**TR-1: Architecture**
- New `jira-context-mcp` server for session management
- Local session storage (JSON files or SQLite)
- Minimal additions to existing core/dev servers
- MCP Resources for context-free data access

**TR-2: Data Format**
- Structured comment format with markdown
- Parseable metadata tags for AI/human consumption
- ISO 8601 timestamps for all activities
- Severity levels: LOW, MEDIUM, HIGH, CRITICAL

**TR-3: Performance**
- Session data cached locally to reduce API calls
- Batch sync operations (max 5 min intervals)
- Resource-based access for zero-tool-call context
- Smart caching with TTL for issue data

**TR-4: Integration**
- Compatible with existing jira-core-mcp and jira-dev-mcp
- No breaking changes to current tool signatures
- Environment-based configuration
- Works with Cursor, Claude, and other MCP hosts

### Non-Functional Requirements

**NFR-1: Minimal Code**
- Only essential functionality, no over-engineering
- Reuse existing shared library infrastructure
- Leverage MCP SDK patterns from current servers

**NFR-2: Human Readability**
- All Jira comments readable without AI interpretation
- Session summaries formatted for team visibility
- Blocker/discovery logs useful in retrospectives

**NFR-3: Reliability**
- Session data persists on disk, survives crashes
- Graceful degradation if Jira API unavailable
- Retry logic for sync failures with exponential backoff

---

## Design

### Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                AI Host (Cursor/Claude/Kiro)              │
└─────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┬──────────┐
        │                   │                   │          │
┌───────▼────────┐  ┌──────▼──────┐  ┌────────▼────┐  ┌──▼─────────┐
│ jira-core-mcp  │  │ jira-dev-mcp │  │jira-xray-mcp│  │jira-context│
│                │  │              │  │             │  │    -mcp    │
│ • Issues CRUD  │  │ • Workflows  │  │ • Test Exec │  │ • Sessions │
│ • Comments     │  │ • Composite  │  │ • Uploads   │  │ • Tracking │
│ • Search/JQL   │  │   Actions    │  │             │  │ • Batch    │
│ + History      │  │ + Structured │  │             │  │   Sync     │
│ + Worklogs     │  │   Comments   │  │             │  │ • Cache    │
└────────────────┘  └──────────────┘  └─────────────┘  └────────────┘
        │                   │                   │          │
        └───────────────────┼───────────────────┴──────────┘
                            │
                ┌───────────▼───────────┐
                │   Jira Instance       │
                │   (REST API v2/v3)    │
                └───────────────────────┘
                            
┌─────────────────────────────────────────────────────────┐
│              Local Session Storage                       │
│  .jira-sessions/                                        │
│    ├── session-{uuid}.json                              │
│    └── cache/                                           │
│         └── issue-{key}.json (TTL: 5min)                │
└─────────────────────────────────────────────────────────┘
```

### Component Design

#### 1. jira-context-mcp Server

**New Tools:**

```typescript
track_session_start(issueKey, accountId, goals[])
  → Returns: sessionId, issue context, related issues
  → Creates: Local session file
  → Side effects: None (local only)

log_progress(sessionId, description, timestamp?)
  → Returns: Confirmation
  → Updates: Session file with progress entry
  → Side effects: None (local only)

log_blocker(sessionId, description, severity, timestamp?)
  → Returns: Confirmation
  → Updates: Session file with blocker entry
  → Side effects: None (local only)

log_discovery(sessionId, description, timestamp?)
  → Returns: Confirmation
  → Updates: Session file with discovery entry
  → Side effects: None (local only)

get_session_summary(sessionId)
  → Returns: Formatted markdown summary
  → Reads: Session file
  → Side effects: None

sync_to_jira(sessionId, closeSession?)
  → Returns: Comment ID, worklog ID
  → Creates: Jira comment with structured format
  → Creates: Worklog entry with duration
  → Updates: Session file with sync timestamp
  → Side effects: Jira API calls

list_active_sessions(accountId?)
  → Returns: Array of active sessions
  → Reads: Session directory
  → Side effects: None

recover_session(issueKey)
  → Returns: sessionId or null
  → Reads: Jira comments for [AI-TRACKED] markers
  → Creates: Session file from parsed comments
  → Side effects: None
```

**New Resources:**

```
jira://session/{sessionId}
  → Current session state (progress, blockers, discoveries)

jira://issue/{key}/context
  → Issue + recent comments + history + worklogs

jira://issue/{key}/related
  → Linked issues, subtasks, parent, dependencies

jira://my/active-work
  → All in-progress issues for authenticated user
```

**Session Data Model:**

```typescript
interface Session {
  id: string;              // UUID
  issueKey: string;
  accountId: string;
  startTime: string;       // ISO 8601
  goals: string[];
  progress: ProgressEntry[];
  blockers: BlockerEntry[];
  discoveries: DiscoveryEntry[];
  lastSyncTime?: string;
  closed: boolean;
}

interface ProgressEntry {
  timestamp: string;
  description: string;
}

interface BlockerEntry {
  timestamp: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

interface DiscoveryEntry {
  timestamp: string;
  description: string;
}
```

#### 2. Enhanced jira-core-mcp

**New Tools:**

```typescript
get_issue_history(key, maxResults?)
  → Returns: Array of change history entries
  → Useful for: Understanding recent activity

get_worklogs(key)
  → Returns: Array of worklog entries
  → Useful for: Time tracking context

add_worklog(key, timeSpentSeconds, comment?, started?)
  → Returns: Worklog ID
  → Useful for: Session sync time tracking
```

#### 3. Enhanced jira-dev-mcp

**New Tools:**

```typescript
start_tracked_work(issueKey, accountId, goals[])
  → Composite action:
    1. Assign issue to accountId
    2. Transition to "In Progress"
    3. Initialize session via jira-context-mcp
    4. Add comment: "Started tracked work session"
  → Returns: sessionId, issue context, transitions
  → Reduces: 4+ tool calls to 1

add_structured_comment(key, type, content)
  → type: 'progress' | 'blocker' | 'discovery' | 'summary'
  → Formats comment with [AI-TRACKED] marker
  → Returns: Comment ID

update_progress(key, remainingEstimate?, storyPoints?)
  → Updates issue fields
  → Adds structured comment with changes
  → Returns: Confirmation
```

### Structured Comment Format

```markdown
[AI-TRACKED] {ISO-8601-timestamp}
Session: {session-id}

**Progress:**
- {progress item 1}
- {progress item 2}

**Blockers:**
- [SEVERITY] {blocker description}

**Discoveries:**
- {discovery 1}
- {discovery 2}

**Time Spent:** {duration}

**Next Steps:**
- {next step 1}
```

**Example:**

```markdown
[AI-TRACKED] 2026-03-02T20:45:00-06:00
Session: a3f2c8d9-1234-5678-90ab-cdef12345678

**Progress:**
- Implemented JWT authentication module
- Added unit tests with 95% coverage
- Integrated with existing user service

**Blockers:**
- [MEDIUM] Missing OAuth provider documentation
- [LOW] Waiting on security team code review

**Discoveries:**
- JWT refresh tokens require 15min expiry per security policy
- Existing auth library (v2.3.1) has CVE-2025-1234, need upgrade
- Redis session store performs better than in-memory for our scale

**Time Spent:** 2h 30m

**Next Steps:**
- Research OAuth 2.0 providers (Auth0, Okta)
- Schedule security review meeting
- Update auth library to v3.0.0
```

### Caching Strategy

**Issue Cache:**
- Location: `.jira-sessions/cache/issue-{key}.json`
- TTL: 5 minutes
- Invalidation: On update operations
- Reduces: Redundant `get_issue` calls

**Transition Cache:**
- Location: `.jira-sessions/cache/transitions-{key}.json`
- TTL: 30 minutes (workflows change rarely)
- Reduces: Redundant `get_transitions` calls

**User Cache:**
- Location: `.jira-sessions/cache/user-{accountId}.json`
- TTL: 1 hour
- Reduces: User lookup calls

### Batch Sync Logic

```typescript
// Auto-sync triggers:
1. Every 5 minutes (configurable via AUTO_SYNC_INTERVAL)
2. On session close (explicit sync_to_jira call)
3. On significant events (blocker logged, major progress)

// Sync operation:
1. Read session file
2. Format structured comment
3. Calculate time spent (now - startTime or lastSyncTime)
4. Create Jira comment
5. Create worklog entry
6. Update session with lastSyncTime
7. Clear synced entries (optional, keep for summary)
```

### Configuration

**Environment Variables:**

```env
# Existing (jira-core-mcp, jira-dev-mcp)
JIRA_URL=https://qa.jira.nmdp.org
JIRA_TOKEN=your-pat-token

# New (jira-context-mcp)
SESSION_STORAGE=./.jira-sessions
AUTO_SYNC_INTERVAL=300          # seconds (5 min)
CACHE_TTL_ISSUE=300             # seconds (5 min)
CACHE_TTL_TRANSITION=1800       # seconds (30 min)
CACHE_TTL_USER=3600             # seconds (1 hour)
ENABLE_AUTO_SYNC=true
```

### Error Handling

**Session Operations:**
- Session file not found → Return clear error, suggest `list_active_sessions`
- Invalid session ID → Return error with valid format example
- Disk write failure → Log error, retry once, return error to AI

**Jira Sync:**
- API unavailable → Queue sync for retry, return warning to AI
- Authentication failure → Return error, suggest token refresh
- Rate limit exceeded → Exponential backoff, queue for retry
- Network timeout → Retry with backoff (3 attempts)

**Cache Operations:**
- Cache miss → Fetch from Jira, populate cache
- Cache expired → Fetch from Jira, update cache
- Cache read error → Ignore cache, fetch from Jira

---

## Tasks

### Phase 1: Foundation (Prevent Context Bloat)

#### Task 1.1: Enhance jira-core-mcp with History and Worklogs

**Objective:** Add tools for retrieving issue history and worklog data.

**Implementation:**
- Add `getIssueHistory(key, maxResults)` to JiraClient in shared library
- Add `getWorklogs(key)` to JiraClient
- Add `addWorklog(key, timeSpentSeconds, comment, started)` to JiraClient
- Expose three new tools in jira-core-mcp server
- Add Zod schemas for history and worklog responses

**Files to Modify:**
- `libs/mcp-jira-shared/src/client.ts`
- `libs/mcp-jira-shared/src/types.ts`
- `servers/jira-core-mcp/src/index.ts`

**Acceptance Criteria:**
- `get_issue_history` returns array of change history
- `get_worklogs` returns array of worklog entries
- `add_worklog` creates worklog and returns ID
- All tools have proper error handling

---

#### Task 1.2: Add Structured Comments to jira-dev-mcp

**Objective:** Enable AI to create formatted comments with metadata tags.

**Implementation:**
- Create comment template function with markdown formatting
- Add `add_structured_comment` tool to jira-dev-mcp
- Support types: progress, blocker, discovery, summary
- Include [AI-TRACKED] marker and timestamp
- Add session ID field (optional, for future use)

**Files to Modify:**
- `servers/jira-dev-mcp/src/index.ts`
- `servers/jira-dev-mcp/src/templates.ts` (new file)

**Acceptance Criteria:**
- Comments formatted with markdown structure
- [AI-TRACKED] marker present and parseable
- Timestamp in ISO 8601 format
- Human-readable in Jira UI

---

#### Task 1.3: Create Composite start_tracked_work Tool

**Objective:** Reduce multi-step workflow to single tool call.

**Implementation:**
- Add `start_tracked_work` tool to jira-dev-mcp
- Sequence: assign → transition → add comment
- Return comprehensive context: issue, transitions, related issues
- Handle partial failures gracefully (e.g., already assigned)

**Files to Modify:**
- `servers/jira-dev-mcp/src/index.ts`

**Acceptance Criteria:**
- Single tool call replaces 3+ separate calls
- Returns all context needed for AI to proceed
- Handles edge cases (already in progress, no transition available)
- Adds structured comment indicating session start

---

### Phase 2: Session Tracking (Enable Persistence)

#### Task 2.1: Create jira-context-mcp Server Scaffold

**Objective:** Initialize new MCP server with session management foundation.

**Implementation:**
- Create `servers/jira-context-mcp/` directory
- Setup package.json, tsconfig.json
- Initialize MCP server with SDK
- Create session storage directory structure
- Add environment configuration loading

**Files to Create:**
- `servers/jira-context-mcp/package.json`
- `servers/jira-context-mcp/tsconfig.json`
- `servers/jira-context-mcp/src/index.ts`
- `servers/jira-context-mcp/src/storage.ts`
- `servers/jira-context-mcp/src/types.ts`

**Acceptance Criteria:**
- Server starts and connects via stdio
- Session storage directory created on startup
- Environment variables loaded correctly
- Basic health check passes

---

#### Task 2.2: Implement Session Management Tools

**Objective:** Enable AI to create, update, and retrieve work sessions.

**Implementation:**
- Implement `track_session_start` tool
- Implement `log_progress` tool
- Implement `log_blocker` tool with severity validation
- Implement `log_discovery` tool
- Implement `get_session_summary` tool
- Implement `list_active_sessions` tool
- Add session file I/O with atomic writes
- Add UUID generation for session IDs

**Files to Modify:**
- `servers/jira-context-mcp/src/index.ts`
- `servers/jira-context-mcp/src/storage.ts`
- `servers/jira-context-mcp/src/session.ts` (new file)

**Acceptance Criteria:**
- Sessions persist to disk as JSON files
- All CRUD operations work correctly
- Session summary formatted as markdown
- Concurrent session support (multiple issues)

---

#### Task 2.3: Implement Jira Sync Mechanism

**Objective:** Batch-sync session activities to Jira with structured comments.

**Implementation:**
- Implement `sync_to_jira` tool
- Format session data as structured comment
- Calculate time spent since last sync
- Create Jira comment via jira-core-mcp client
- Create worklog entry via jira-core-mcp client
- Update session with sync timestamp
- Add optional session close flag

**Files to Modify:**
- `servers/jira-context-mcp/src/index.ts`
- `servers/jira-context-mcp/src/sync.ts` (new file)
- `servers/jira-context-mcp/src/templates.ts` (new file)

**Acceptance Criteria:**
- Structured comments created in Jira
- Worklogs created with accurate duration
- Session marked with last sync time
- Closed sessions archived (moved to closed/ subdirectory)

---

#### Task 2.4: Implement Session Recovery

**Objective:** Restore session state from Jira comments.

**Implementation:**
- Implement `recover_session` tool
- Parse Jira comments for [AI-TRACKED] markers
- Extract session data from structured comments
- Reconstruct session file from parsed data
- Handle multiple comments (merge into single session)

**Files to Modify:**
- `servers/jira-context-mcp/src/index.ts`
- `servers/jira-context-mcp/src/recovery.ts` (new file)
- `servers/jira-context-mcp/src/parser.ts` (new file)

**Acceptance Criteria:**
- Sessions recovered from Jira comments
- Progress, blockers, discoveries extracted correctly
- Timestamps preserved
- Handles malformed comments gracefully

---

### Phase 3: Context Optimization (Reduce Tool Calls)

#### Task 3.1: Implement MCP Resources for Context Access

**Objective:** Enable zero-tool-call context retrieval via URIs.

**Implementation:**
- Add Resource handlers to jira-context-mcp:
  - `jira://session/{sessionId}`
  - `jira://issue/{key}/context`
  - `jira://issue/{key}/related`
  - `jira://my/active-work`
- Implement resource templates for discovery
- Add caching layer for resource data
- Return structured JSON content

**Files to Modify:**
- `servers/jira-context-mcp/src/index.ts`
- `servers/jira-context-mcp/src/resources.ts` (new file)
- `servers/jira-context-mcp/src/cache.ts` (new file)

**Acceptance Criteria:**
- Resources accessible via URI references
- AI can read context without explicit tool calls
- Cache reduces redundant API calls
- Resource templates listed in server capabilities

---

#### Task 3.2: Implement Smart Caching Layer

**Objective:** Reduce redundant Jira API calls with TTL-based caching.

**Implementation:**
- Create cache storage in `.jira-sessions/cache/`
- Implement TTL-based cache for issues, transitions, users
- Add cache invalidation on update operations
- Add cache statistics for monitoring
- Implement cache cleanup for expired entries

**Files to Create:**
- `servers/jira-context-mcp/src/cache.ts`

**Files to Modify:**
- `libs/mcp-jira-shared/src/client.ts` (add cache layer)

**Acceptance Criteria:**
- Cache hit rate > 70% for repeated issue access
- TTL respected for all cache entries
- Cache invalidated on updates
- Expired entries cleaned up automatically

---

#### Task 3.3: Implement Auto-Sync Background Process

**Objective:** Automatically sync sessions to Jira at intervals.

**Implementation:**
- Add interval timer for auto-sync (configurable)
- Check all active sessions for sync eligibility
- Sync sessions with activity since last sync
- Handle sync failures with retry queue
- Add graceful shutdown to flush pending syncs

**Files to Modify:**
- `servers/jira-context-mcp/src/index.ts`
- `servers/jira-context-mcp/src/sync.ts`
- `servers/jira-context-mcp/src/scheduler.ts` (new file)

**Acceptance Criteria:**
- Auto-sync runs at configured interval
- Only active sessions synced
- Failures queued for retry
- Pending syncs flushed on shutdown

---

#### Task 3.4: Add Workflow-Specific Prompts

**Objective:** Provide reusable prompt templates for common workflows.

**Implementation:**
- Add Prompt handlers to jira-dev-mcp:
  - `start_feature_work`: Template for starting feature development
  - `daily_standup`: Generate standup from active sessions
  - `session_summary`: Format session for team update
  - `blocker_escalation`: Template for escalating blockers
- Include argument placeholders
- Return formatted prompt text with context

**Files to Modify:**
- `servers/jira-dev-mcp/src/index.ts`
- `servers/jira-dev-mcp/src/prompts.ts` (new file)

**Acceptance Criteria:**
- Prompts discoverable in MCP host
- Arguments properly substituted
- Context embedded in prompt text
- Human-readable output

---

### Phase 4: Testing and Documentation

#### Task 4.1: Add Unit Tests for Session Management

**Objective:** Ensure session operations work correctly.

**Implementation:**
- Test session creation, update, retrieval
- Test progress/blocker/discovery logging
- Test session summary generation
- Test session recovery from comments
- Mock file system operations

**Files to Create:**
- `servers/jira-context-mcp/src/__tests__/session.test.ts`
- `servers/jira-context-mcp/src/__tests__/storage.test.ts`
- `servers/jira-context-mcp/src/__tests__/recovery.test.ts`

**Acceptance Criteria:**
- 90%+ code coverage for session logic
- All edge cases tested
- Mock file system prevents disk I/O in tests

---

#### Task 4.2: Add Integration Tests for Sync Operations

**Objective:** Validate Jira sync with mock API.

**Implementation:**
- Test sync_to_jira with mock Jira API
- Test structured comment formatting
- Test worklog creation
- Test retry logic on failures
- Test auto-sync scheduler

**Files to Create:**
- `servers/jira-context-mcp/src/__tests__/sync.test.ts`
- `servers/jira-context-mcp/src/__tests__/scheduler.test.ts`

**Acceptance Criteria:**
- Sync operations tested with mock API
- Retry logic validated
- Auto-sync timing verified

---

#### Task 4.3: Update Documentation

**Objective:** Document new functionality and usage patterns.

**Implementation:**
- Update README.md with jira-context-mcp setup
- Document all new tools and resources
- Add usage examples for tracked workflows
- Document structured comment format
- Add troubleshooting guide for common issues
- Create architecture diagram

**Files to Modify:**
- `README.md`
- `docs/implementation.md`

**Files to Create:**
- `docs/WORKFLOW-TRACKING.md`
- `docs/STRUCTURED-COMMENTS.md`
- `docs/ARCHITECTURE.md`

**Acceptance Criteria:**
- All new tools documented with examples
- Setup instructions clear and complete
- Architecture diagram shows all components
- Troubleshooting covers common issues

---

#### Task 4.4: Create End-to-End Test Scenarios

**Objective:** Validate complete AI workflow from start to finish.

**Implementation:**
- Create E2E test script for tracked workflow:
  1. Start tracked work
  2. Log progress, blockers, discoveries
  3. Sync to Jira
  4. Verify structured comment in Jira
  5. Recover session from Jira
  6. Close session
- Add test for multi-session scenario
- Add test for session recovery after crash

**Files to Create:**
- `test-workflow-tracking.js`

**Acceptance Criteria:**
- Complete workflow tested end-to-end
- Multi-session support validated
- Recovery from Jira comments works
- Test runnable with mock or real Jira instance

---

## Implementation Notes

### Minimal Code Principles

- Reuse existing shared library infrastructure
- Avoid premature optimization
- No unnecessary abstractions
- Direct file I/O (no database for MVP)
- Simple JSON for session storage
- Leverage MCP SDK patterns

### Dependencies

**New Dependencies:**
- None (use existing: @modelcontextprotocol/sdk, zod, dotenv)

**Optional Future:**
- `better-sqlite3` (if session storage needs query capabilities)
- `node-cache` (if in-memory cache preferred over file-based)

### Rollout Strategy

1. **Phase 1** (1-2 days): Enhance existing servers, validate with manual testing
2. **Phase 2** (2-3 days): Build jira-context-mcp, test session management
3. **Phase 3** (2-3 days): Add resources, caching, auto-sync
4. **Phase 4** (1-2 days): Testing, documentation, polish

**Total Estimate:** 6-10 days for complete implementation

### Success Metrics

- **Context Reduction:** 50%+ fewer tool calls for typical workflow
- **Session Persistence:** 100% session recovery rate from Jira
- **API Efficiency:** 70%+ cache hit rate for repeated access
- **Human Readability:** Team can read AI-tracked comments without training
- **Reliability:** 99%+ sync success rate (with retries)

---

## Appendix

### Example AI Workflow

**User:** "Start working on TEST-123 to implement user authentication"

**AI Actions:**
1. Calls `start_tracked_work(TEST-123, user-account-id, ["Implement JWT auth", "Add unit tests"])`
2. Receives: sessionId, issue context, related issues
3. AI works with user, periodically calls:
   - `log_progress(sessionId, "Completed JWT token generation")`
   - `log_blocker(sessionId, "Missing OAuth docs", "MEDIUM")`
   - `log_discovery(sessionId, "Need 15min token expiry per policy")`
4. Every 5 minutes: Auto-sync creates structured comment in Jira
5. User ends session: AI calls `sync_to_jira(sessionId, closeSession=true)`
6. Next day: AI calls `recover_session(TEST-123)` to resume

**Result:** Complete audit trail in Jira, minimal context bloat, persistent state.

### Structured Comment JQL Queries

```jql
# Find all AI-tracked issues
comment ~ "[AI-TRACKED]"

# Find issues with blockers
comment ~ "[AI-TRACKED]" AND comment ~ "[MEDIUM]"

# Find recent AI activity
comment ~ "[AI-TRACKED]" AND commented >= -7d

# Find discoveries
comment ~ "[AI-TRACKED]" AND comment ~ "Discoveries:"
```

### Session File Example

```json
{
  "id": "a3f2c8d9-1234-5678-90ab-cdef12345678",
  "issueKey": "TEST-123",
  "accountId": "5f8a9b0c1d2e3f4g5h6i7j8k",
  "startTime": "2026-03-02T20:45:00-06:00",
  "goals": [
    "Implement JWT authentication",
    "Add unit tests with 90%+ coverage"
  ],
  "progress": [
    {
      "timestamp": "2026-03-02T21:15:00-06:00",
      "description": "Completed JWT token generation module"
    },
    {
      "timestamp": "2026-03-02T21:45:00-06:00",
      "description": "Added unit tests for token validation"
    }
  ],
  "blockers": [
    {
      "timestamp": "2026-03-02T22:00:00-06:00",
      "description": "Missing OAuth provider documentation",
      "severity": "MEDIUM"
    }
  ],
  "discoveries": [
    {
      "timestamp": "2026-03-02T22:10:00-06:00",
      "description": "JWT refresh tokens require 15min expiry per security policy"
    }
  ],
  "lastSyncTime": "2026-03-02T22:15:00-06:00",
  "closed": false
}
```
