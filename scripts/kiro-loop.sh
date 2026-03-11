#!/usr/bin/env bash
###############################################################################
# kiro-loop.sh — Ralph-loop style automation for kiro-cli spec work
#
# Repeatedly invokes kiro-cli chat with the jira-mcp-implementer agent to
# progress tasks defined in .kiro/specs/ai-workflow-tracking.md.
#
# Usage:
#   ./kiro-loop.sh [MAX_ITERATIONS] [AGENT]
#
# Examples:
#   ./kiro-loop.sh 1                        # Test run: single iteration
#   ./kiro-loop.sh 3                        # Three iterations
#   ./kiro-loop.sh 5 jira-mcp-tester       # Five iterations with tester agent
#
# Environment variables:
#   KIRO_TIMEOUT        Timeout per iteration in seconds (default: 900)
#   KIRO_PAUSE          Pause between iterations in seconds (default: 5)
#   KIRO_STALE_LIMIT    Stale iterations before abort (default: 2)
#   KIRO_SPEC           Spec file path (default: .kiro/specs/ai-workflow-tracking.md)
#   KIRO_LOG_DIR        Log directory (default: .kiro-loop-logs)
###############################################################################
set -uo pipefail

# === Configuration ===
MAX_ITERATIONS="${1:-1}"
AGENT="${2:-jira-mcp-implementer}"
SPEC_FILE="${KIRO_SPEC:-.kiro/specs/ai-workflow-tracking.md}"
LOG_DIR="${KIRO_LOG_DIR:-.kiro-loop-logs}"
ITERATION_TIMEOUT="${KIRO_TIMEOUT:-900}"
PAUSE_BETWEEN="${KIRO_PAUSE:-5}"
STALE_LIMIT="${KIRO_STALE_LIMIT:-2}"

# === Colors (disable if not a terminal) ===
if [ -t 1 ]; then
  RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
  BLUE='\033[0;34m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'
else
  RED=''; GREEN=''; YELLOW=''; BLUE=''; CYAN=''; BOLD=''; NC=''
fi

# === State ===
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
SESSION_LOG="$LOG_DIR/session_${TIMESTAMP}.log"
stale_count=0
prev_output_file=""
completed_iterations=0
exit_reason="completed"

# === Functions ===
log() {
  local msg="[$(date '+%H:%M:%S')] $1"
  echo -e "$msg" | tee -a "$SESSION_LOG"
}

divider() {
  echo -e "${BLUE}$(printf '=%.0s' {1..60})${NC}" | tee -a "$SESSION_LOG"
}

# Pre-flight: verify everything we need is available
preflight() {
  local ok=true

  if ! command -v kiro-cli &>/dev/null; then
    log "${RED}FATAL: kiro-cli not found in PATH${NC}"
    ok=false
  else
    local ver
    ver=$(kiro-cli --version 2>/dev/null || echo "unknown")
    log "kiro-cli version: ${ver}"
  fi

  # Check for timeout command (macOS may need gtimeout from coreutils)
  if command -v timeout &>/dev/null; then
    HAS_TIMEOUT=true
  elif command -v gtimeout &>/dev/null; then
    HAS_TIMEOUT=true
    # shellcheck disable=SC2317
    timeout() { gtimeout "$@"; }
    export -f timeout 2>/dev/null || true
  else
    HAS_TIMEOUT=false
    log "${YELLOW}WARNING: timeout/gtimeout not found — iterations run without time limit${NC}"
  fi

  if [ ! -f "$SPEC_FILE" ]; then
    log "${RED}FATAL: Spec file not found: $SPEC_FILE${NC}"
    ok=false
  fi

  # Validate agent exists (best-effort; kiro-cli writes listing to stderr,
  # and grep -q with pipefail triggers SIGPIPE — capture output first)
  local agent_list
  agent_list=$(kiro-cli agent list 2>&1 || true)
  if echo "$agent_list" | grep -q "$AGENT" 2>/dev/null; then
    log "Agent ${CYAN}${AGENT}${NC} confirmed"
  else
    log "${YELLOW}WARNING: Could not confirm agent '${AGENT}' — proceeding anyway${NC}"
  fi

  if [ "$ok" = false ]; then
    exit 1
  fi
}

# Build the task prompt for a given iteration
build_prompt() {
  local iteration="$1"

  if [ "$iteration" -eq 1 ]; then
    cat <<'PROMPT'
You are in an automated loop. Review the specification at .kiro/specs/ai-workflow-tracking.md.

1. Check the existing codebase to see which tasks have already been completed.
2. Identify the NEXT incomplete task (in order: 1.1, 1.2, 1.3, 2.1, ...).
3. Implement that task fully — write the code, add types, handle errors.
4. Run `npm run build` to verify your changes compile.
5. If the build fails, fix the errors before finishing.

Focus on ONE task per iteration. Be thorough but concise.
At the end, state clearly which task you completed and what the next task would be.
PROMPT
  else
    cat <<'PROMPT'
Continue the automated implementation loop.

1. Check what was accomplished in the previous iteration.
2. Verify the build still passes: `npm run build`
3. If the last task had issues, fix them first.
4. Otherwise, implement the NEXT incomplete task from the ai-workflow-tracking spec.
5. Run `npm run build` to verify.

Focus on ONE task. State which task you completed and what's next.
PROMPT
  fi
}

# Analyze iteration output for health problems
# Returns 0 if healthy, 1 if unhealthy
check_health() {
  local log_file="$1"
  local iteration="$2"

  # Empty output = something went very wrong
  if [ ! -s "$log_file" ]; then
    log "${RED}[Health] Iteration $iteration produced no output${NC}"
    return 1
  fi

  local size lines
  size=$(wc -c < "$log_file" | tr -d ' ')
  lines=$(wc -l < "$log_file" | tr -d ' ')
  log "Output: ${lines} lines, ${size} bytes"

  # Infrastructure errors (kiro-cli itself, not code errors the agent is working on)
  local infra_errors=0
  local pattern
  for pattern in \
    "MCP server.*failed" \
    "connection refused" \
    "ECONNREFUSED" \
    "authentication.*failed" \
    "login.*required" \
    "kiro.*panic" \
    "kiro.*fatal" \
    "out of memory"; do
    if grep -qi "$pattern" "$log_file" 2>/dev/null; then
      log "${RED}[Health] Infrastructure error: ${pattern}${NC}"
      infra_errors=$((infra_errors + 1))
    fi
  done

  if [ "$infra_errors" -gt 0 ]; then
    log "${RED}[Health] $infra_errors infrastructure error(s) detected${NC}"
    return 1
  fi

  # Agent stuck patterns (multiple occurrences suggest a real problem)
  local stuck_count=0
  stuck_count=$(grep -ci "I cannot\|I'm unable\|I can't proceed\|permission denied\|access denied" "$log_file" 2>/dev/null || true)
  stuck_count=${stuck_count:-0}
  if [ "$stuck_count" -gt 2 ]; then
    log "${YELLOW}[Health] Agent appears stuck ($stuck_count refusal patterns)${NC}"
    return 1
  fi

  # Suspiciously short output (agent did almost nothing)
  if [ "$lines" -lt 5 ] && [ "$size" -lt 200 ]; then
    log "${YELLOW}[Health] Suspiciously short output — agent may not have done useful work${NC}"
  fi

  return 0
}

# Compare two iteration outputs for staleness
# Returns 0 if stale (outputs are essentially identical), 1 if fresh
check_staleness() {
  local current="$1"
  local previous="$2"

  [ -f "$previous" ] || return 1  # No previous = not stale

  # Hash content after stripping timestamps and blank lines.
  # Use md5 (macOS) or md5sum (Linux).
  local hash_cmd="md5sum"
  command -v md5 &>/dev/null && hash_cmd="md5 -q"

  local hash_current hash_previous
  hash_current=$(sed 's/[0-9]\{4\}-[0-9]\{2\}-[0-9]\{2\}[T ][0-9:.ZzZ+-]*//g' "$current" \
    | grep -v '^\s*$' | $hash_cmd 2>/dev/null | awk '{print $1}')
  hash_previous=$(sed 's/[0-9]\{4\}-[0-9]\{2\}-[0-9]\{2\}[T ][0-9:.ZzZ+-]*//g' "$previous" \
    | grep -v '^\s*$' | $hash_cmd 2>/dev/null | awk '{print $1}')

  [ "$hash_current" = "$hash_previous" ]
}

# Show tail of iteration log
show_tail() {
  local log_file="$1"
  local n="${2:-15}"
  if [ -s "$log_file" ]; then
    echo -e "${CYAN}--- Last $n lines ---${NC}" | tee -a "$SESSION_LOG"
    tail -n "$n" "$log_file" | tee -a "$SESSION_LOG"
    echo -e "${CYAN}--- End ---${NC}" | tee -a "$SESSION_LOG"
  fi
}

# Print final summary
print_summary() {
  echo "" | tee -a "$SESSION_LOG"
  divider
  log "${BOLD}Kiro Loop Summary${NC}"
  divider
  log "Agent:               $AGENT"
  log "Iterations:          $completed_iterations / $MAX_ITERATIONS"
  log "Exit reason:         $exit_reason"
  log "Session log:         $SESSION_LOG"
  log "Iteration logs:      $LOG_DIR/iteration_${TIMESTAMP}_*.log"
  divider

  case "$exit_reason" in
    completed)
      log "${GREEN}All $MAX_ITERATIONS iteration(s) completed successfully.${NC}"
      ;;
    stale)
      log "${YELLOW}Stopped: Agent output is repeating (no progress after $stale_count iterations).${NC}"
      ;;
    mcp_failure)
      log "${RED}Stopped: MCP server(s) failed to start.${NC}"
      ;;
    timeout)
      log "${YELLOW}Stopped: Last iteration timed out after ${ITERATION_TIMEOUT}s.${NC}"
      ;;
    unhealthy)
      log "${RED}Stopped: Health check failed — see iteration log for details.${NC}"
      ;;
    error)
      log "${RED}Stopped: kiro-cli exited with an error.${NC}"
      ;;
    interrupted)
      log "${YELLOW}Stopped: Interrupted by user (Ctrl+C).${NC}"
      ;;
  esac
}

# Trap Ctrl+C for clean shutdown
cleanup() {
  exit_reason="interrupted"
  echo ""
  log "${YELLOW}Interrupted — cleaning up...${NC}"
  print_summary
  exit 130
}
trap cleanup INT TERM

# === Main ===

mkdir -p "$LOG_DIR"

divider
log "${BOLD}Kiro Loop${NC} — Ralph-loop for kiro-cli spec work"
divider
log "Max iterations:    $MAX_ITERATIONS"
log "Agent:             $AGENT"
log "Spec:              $SPEC_FILE"
log "Timeout/iteration: ${ITERATION_TIMEOUT}s"
log "Stale limit:       $STALE_LIMIT"
log "Log directory:     $LOG_DIR"
echo "" | tee -a "$SESSION_LOG"

preflight

log "${GREEN}Pre-flight passed. Starting loop.${NC}"
echo "" | tee -a "$SESSION_LOG"

for i in $(seq 1 "$MAX_ITERATIONS"); do
  divider
  log "${BOLD}Iteration $i / $MAX_ITERATIONS${NC}"
  divider

  iteration_log="$LOG_DIR/iteration_${TIMESTAMP}_${i}.log"
  task_prompt=$(build_prompt "$i")

  # Build command array
  kiro_cmd=(kiro-cli chat
    --agent "$AGENT"
    --no-interactive
    --trust-all-tools
    --require-mcp-startup
  )

  # Subsequent iterations resume the previous conversation
  if [ "$i" -gt 1 ]; then
    kiro_cmd+=(--resume)
  fi

  log "Launching kiro-cli (timeout: ${ITERATION_TIMEOUT}s)..."

  # Execute. The task prompt is passed as the positional [INPUT] argument.
  set +e
  if [ "$HAS_TIMEOUT" = true ]; then
    timeout "$ITERATION_TIMEOUT" "${kiro_cmd[@]}" "$task_prompt" > "$iteration_log" 2>&1
  else
    "${kiro_cmd[@]}" "$task_prompt" > "$iteration_log" 2>&1
  fi
  kiro_exit=$?
  set -e

  # --- Evaluate exit code ---
  case $kiro_exit in
    0)
      log "${GREEN}kiro-cli exited cleanly (0)${NC}"
      ;;
    3)
      log "${RED}MCP server startup failed (exit 3)${NC}"
      show_tail "$iteration_log"
      exit_reason="mcp_failure"
      break
      ;;
    124)
      log "${YELLOW}Timed out after ${ITERATION_TIMEOUT}s (exit 124)${NC}"
      show_tail "$iteration_log"
      if [ "$i" -lt "$MAX_ITERATIONS" ]; then
        log "${YELLOW}Continuing to next iteration despite timeout...${NC}"
      else
        exit_reason="timeout"
      fi
      ;;
    *)
      log "${RED}kiro-cli failed (exit $kiro_exit)${NC}"
      show_tail "$iteration_log" 30
      exit_reason="error"
      break
      ;;
  esac

  # --- Health check ---
  if ! check_health "$iteration_log" "$i"; then
    show_tail "$iteration_log" 20
    exit_reason="unhealthy"
    break
  fi

  # --- Staleness check ---
  if [ -n "$prev_output_file" ]; then
    if check_staleness "$iteration_log" "$prev_output_file"; then
      stale_count=$((stale_count + 1))
      log "${YELLOW}Stale output detected (${stale_count}/${STALE_LIMIT})${NC}"
      if [ "$stale_count" -ge "$STALE_LIMIT" ]; then
        exit_reason="stale"
        break
      fi
    else
      stale_count=0
    fi
  fi

  prev_output_file="$iteration_log"
  completed_iterations=$i

  # Show a preview of what the agent did
  log "${CYAN}Iteration $i output preview:${NC}"
  show_tail "$iteration_log" 10

  # Pause between iterations (skip after the last one)
  if [ "$i" -lt "$MAX_ITERATIONS" ]; then
    log "Pausing ${PAUSE_BETWEEN}s before next iteration..."
    sleep "$PAUSE_BETWEEN"
  fi
done

# === Summary ===
print_summary

# Exit code based on outcome
case "$exit_reason" in
  completed)  exit 0 ;;
  stale)      exit 2 ;;
  timeout)    exit 3 ;;
  *)          exit 1 ;;
esac
