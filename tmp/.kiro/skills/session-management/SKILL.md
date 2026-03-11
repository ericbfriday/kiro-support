---
name: session-management
description: Expert in designing and implementing session-based workflow tracking systems with local persistence, batch synchronization, and recovery mechanisms.
---

## Core Principles

**✅ Do** persist session data to disk for crash recovery

**✅ Do** use simple JSON files for session storage (avoid premature database optimization)

**✅ Do** implement atomic writes to prevent corruption

**✅ Do** design for concurrent session support (multiple issues)

**❌ Don't** store sensitive data in session files

## Session Data Model

**✅ Do** include essential metadata:

```typescript
interface Session {
  id: string;              // UUID
  issueKey: string;        // Jira issue key
  accountId: string;       // User identifier
  startTime: string;       // ISO 8601 timestamp
  goals: string[];         // Session objectives
  activities: Activity[];  // Progress, blockers, discoveries
  lastSyncTime?: string;   // Last sync to external system
  closed: boolean;         // Session state
}
```

**✅ Do** use ISO 8601 timestamps for all time fields

**✅ Do** use UUIDs for session IDs

**👍 Prefer** structured activity types over free-form logs

## File Storage Patterns

**✅ Do** organize session files by state:

```
.sessions/
  ├── active/
  │   ├── session-{uuid}.json
  │   └── session-{uuid}.json
  ├── closed/
  │   └── session-{uuid}.json
  └── cache/
      ├── issue-{key}.json
      └── transitions-{key}.json
```

**✅ Do** implement atomic writes:

```typescript
const tempFile = `${filePath}.tmp`;
await fs.writeFile(tempFile, JSON.stringify(data, null, 2));
await fs.rename(tempFile, filePath);
```

**✅ Do** handle file system errors gracefully

**👍 Prefer** moving files over deleting (archive closed sessions)

## Activity Tracking

**✅ Do** categorize activities by type:
- Progress: Completed work, milestones reached
- Blockers: Impediments with severity levels
- Discoveries: Learnings, insights, decisions

**✅ Do** timestamp all activities

**✅ Do** support severity levels for blockers:

```typescript
type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
```

**✅ Do** keep activity descriptions concise and actionable

## Batch Synchronization

**✅ Do** accumulate activities locally before syncing

**✅ Do** implement configurable sync intervals (default: 5 minutes)

**✅ Do** trigger sync on significant events:
- Session close
- Critical blocker logged
- Explicit sync request

**✅ Do** update lastSyncTime after successful sync

**👍 Prefer** batch operations over individual syncs

**❌ Don't** sync on every activity - causes excessive API calls

## Sync Strategy

**✅ Do** calculate time spent since last sync:

```typescript
const duration = lastSyncTime 
  ? Date.now() - new Date(lastSyncTime).getTime()
  : Date.now() - new Date(startTime).getTime();
```

**✅ Do** format activities for external system (e.g., Jira comments)

**✅ Do** handle partial sync failures gracefully

**✅ Do** implement retry queue for failed syncs:

```typescript
interface SyncQueue {
  sessionId: string;
  attempts: number;
  lastAttempt: string;
  nextRetry: string;
}
```

**✅ Do** use exponential backoff for retries

## Session Recovery

**✅ Do** support recovery from external system (e.g., Jira comments)

**✅ Do** parse structured data from external sources

**✅ Do** reconstruct session state from parsed data

**✅ Do** handle malformed or incomplete data gracefully

**✅ Do** merge multiple external entries into single session

## Caching Strategy

**✅ Do** implement TTL-based caching:

```typescript
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}
```

**✅ Do** invalidate cache on updates

**✅ Do** clean up expired cache entries periodically

**👍 Prefer** different TTLs for different data types:
- Issues: 5 minutes (change frequently)
- Workflows: 30 minutes (change rarely)
- Users: 1 hour (static)

**❌ Don't** cache sensitive data without encryption

## Concurrency Handling

**✅ Do** support multiple active sessions per user

**✅ Do** use file locking for concurrent writes (if needed)

**✅ Do** handle race conditions in sync operations

**👍 Prefer** session-level locking over global locks

## Session Lifecycle

**✅ Do** implement clear lifecycle states:
1. **Created**: Session initialized, not yet synced
2. **Active**: Session in progress, periodic syncs
3. **Closed**: Session completed, final sync done
4. **Archived**: Session moved to closed/ directory

**✅ Do** provide session listing by state

**✅ Do** support session reopening if needed

## Error Handling

**✅ Do** handle common errors:
- Session not found
- Invalid session ID format
- Disk write failures
- Sync failures (network, auth, rate limit)

**✅ Do** provide actionable error messages:

```typescript
throw new Error(
  `Session ${sessionId} not found. Use list_active_sessions to see available sessions.`
);
```

**✅ Do** log errors to stderr

**❌ Don't** crash on non-critical errors

## Performance Considerations

**✅ Do** lazy-load session data (don't load all sessions on startup)

**✅ Do** index sessions by issue key for fast lookup

**✅ Do** limit in-memory session cache size

**👍 Prefer** streaming large session lists over loading all at once

## Testing Patterns

**✅ Do** mock file system operations in tests

**✅ Do** test session lifecycle transitions

**✅ Do** test concurrent session operations

**✅ Do** test recovery from corrupted session files

**✅ Do** test sync retry logic with mock failures

## Auto-Sync Implementation

**✅ Do** use interval timers for periodic sync:

```typescript
setInterval(async () => {
  const sessions = await getActiveSessions();
  for (const session of sessions) {
    if (shouldSync(session)) {
      await syncSession(session);
    }
  }
}, SYNC_INTERVAL);
```

**✅ Do** implement graceful shutdown:

```typescript
process.on('SIGTERM', async () => {
  await flushPendingSyncs();
  process.exit(0);
});
```

**✅ Do** track sync statistics for monitoring

## Session Summary Generation

**✅ Do** format summaries for human consumption

**✅ Do** include all activity types in summary

**✅ Do** calculate total time spent

**✅ Do** highlight critical blockers

**✅ Do** suggest next steps based on activities

**Example Summary Format:**
```markdown
# Session Summary: {issueKey}

**Duration:** {duration}
**Goals:** 
- {goal1}
- {goal2}

**Progress:**
- {progress1}
- {progress2}

**Blockers:**
- [SEVERITY] {blocker}

**Discoveries:**
- {discovery}

**Next Steps:**
- {suggested action}
```

## Configuration

**✅ Do** make sync behavior configurable:

```env
SESSION_STORAGE=./.sessions
AUTO_SYNC_INTERVAL=300          # seconds
CACHE_TTL_DEFAULT=300           # seconds
ENABLE_AUTO_SYNC=true
MAX_RETRY_ATTEMPTS=3
RETRY_BACKOFF_BASE=2            # exponential base
```

**✅ Do** validate configuration on startup

**✅ Do** provide sensible defaults
