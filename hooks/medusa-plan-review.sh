#!/bin/bash

# Medusa Plan Review Hook for Claude Code
# Copy this to ~/.claude/hooks/medusa-plan-review.sh

INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // empty')
CWD=$(echo "$INPUT" | jq -r '.cwd // empty')

if [ "$TOOL_NAME" != "ExitPlanMode" ]; then
    echo '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"allow"}}'
    exit 0
fi

PLANS_DIR="$HOME/.claude/plans"
PROJECT_NAME=$(basename "$CWD" 2>/dev/null)

# Find recent plan files
RECENT_PLANS=$(find "$PLANS_DIR" -name "*.md" -mmin -0.17 -type f 2>/dev/null)

if [ -n "$RECENT_PLANS" ]; then
    if [ -n "$PROJECT_NAME" ]; then
        PLAN_FILE=$(echo "$RECENT_PLANS" | xargs grep -l "$PROJECT_NAME" 2>/dev/null | head -1)
    fi
    if [ -z "$PLAN_FILE" ]; then
        PLAN_FILE=$(echo "$RECENT_PLANS" | head -1)
    fi
fi

if [ -z "$PLAN_FILE" ] || [ ! -f "$PLAN_FILE" ]; then
    PLAN_FILE=$(ls -t "$PLANS_DIR"/*.md 2>/dev/null | head -1)
fi

if [ -z "$PLAN_FILE" ] || [ ! -f "$PLAN_FILE" ]; then
    echo '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"allow"}}'
    exit 0
fi

RESPONSE_FILE="/tmp/medusa-response-${SESSION_ID:-$$}"
PENDING_DIR="$HOME/.medusa/pending"
mkdir -p "$PENDING_DIR"

cat > "$PENDING_DIR/$(uuidgen).json" << EOF
{"plan_file": "$PLAN_FILE", "response_file": "$RESPONSE_FILE"}
EOF

# Update this path to your Medusa installation
MEDUSA_APP="/Applications/medusa.app"
open -a "$MEDUSA_APP" 2>/dev/null || true

# Read timeout from settings
SETTINGS_FILE="$HOME/.medusa/settings.json"
TIMEOUT_MINUTES=$(jq -r '.hook_timeout_minutes // 10' "$SETTINGS_FILE" 2>/dev/null || echo "10")
TIMEOUT=$((TIMEOUT_MINUTES * 60))
COUNT=0

while [ $COUNT -lt $TIMEOUT ]; do
    if [ -f "$RESPONSE_FILE" ] && [ -s "$RESPONSE_FILE" ]; then
        RESPONSE=$(cat "$RESPONSE_FILE")
        rm -f "$RESPONSE_FILE"
        DECISION=$(echo "$RESPONSE" | head -1)
        FEEDBACK=$(echo "$RESPONSE" | tail -n +2)

        if [ "$DECISION" = "APPROVED" ]; then
            echo '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"allow"}}'
            exit 0
        else
            echo "$FEEDBACK" >&2
            exit 2
        fi
    fi
    sleep 1
    COUNT=$((COUNT + 1))
done

echo "Plan review timed out after $TIMEOUT_MINUTES minutes. Adjust in Medusa Settings." >&2
exit 2
