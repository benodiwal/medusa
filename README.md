# Medusa

A desktop app for reviewing Claude Code plans before execution.

![Medusa](medusa/public/medusa-logo.png)

## What it does

When Claude Code enters plan mode, Medusa intercepts the plan via a hook and presents it in a review interface. You can:

- Review plans in a kanban-style board
- Add inline annotations (comments, deletions, suggested changes)
- Approve plans or request changes with feedback
- View diffs between plan revisions
- Save plans to Obsidian

Claude Code waits for your decision before proceeding.

## Installation

```bash
cd medusa
npm install
npm run tauri build
```

The app will be at `src-tauri/target/release/bundle/macos/medusa.app`

## Hook Setup

Create `~/.claude/hooks/medusa-plan-review.sh`:

```bash
#!/bin/bash

INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // empty')
CWD=$(echo "$INPUT" | jq -r '.cwd // empty')

if [ "$TOOL_NAME" != "ExitPlanMode" ]; then
    echo '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"allow"}}'
    exit 0
fi

PLANS_DIR="$HOME/.claude/plans"
PLAN_FILE=$(ls -t "$PLANS_DIR"/*.md 2>/dev/null | head -1)

if [ -z "$PLAN_FILE" ]; then
    echo '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"allow"}}'
    exit 0
fi

RESPONSE_FILE="/tmp/medusa-response-${SESSION_ID:-$$}"
PENDING_DIR="$HOME/.medusa/pending"
mkdir -p "$PENDING_DIR"

cat > "$PENDING_DIR/$(uuidgen).json" << EOF
{"plan_file": "$PLAN_FILE", "response_file": "$RESPONSE_FILE"}
EOF

open -a "/path/to/medusa.app"

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

echo "Review timed out" >&2
exit 2
```

Make it executable:
```bash
chmod +x ~/.claude/hooks/medusa-plan-review.sh
```

Add to `~/.claude/settings.json`:
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "ExitPlanMode",
        "hooks": [
          {
            "type": "command",
            "command": "~/.claude/hooks/medusa-plan-review.sh"
          }
        ]
      }
    ]
  }
}
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `⌘K` | Focus search |
| `⌘↵` | Approve plan |
| `⌘⇧↵` | Request changes |
| `Esc` | Close modal |

## Data Storage

- `~/.medusa/queue.json` - Plan queue
- `~/.medusa/settings.json` - Settings
- `~/.medusa/pending/` - Incoming plans from hook

## License

Apache 2.0
