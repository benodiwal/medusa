#!/bin/bash
set -e

# Configuration from environment
AGENT_ID="${AGENT_ID:-agent-$(hostname)}"
AGENT_BRANCH="${AGENT_BRANCH:-agent-work}"
TASK_DESCRIPTION="${TASK_DESCRIPTION:-}"

echo "Medusa Agent Starting"
echo "========================"
echo "Agent ID: $AGENT_ID"
echo "Branch: $AGENT_BRANCH"
echo "Task: ${TASK_DESCRIPTION:-None}"
echo "========================"

# Set API key directly
export ANTHROPIC_API_KEY="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"

# Clone repository if provided
if [[ -d "/host/repo/.git" ]]; then
    echo "Cloning repository..."
    git clone /host/repo /workspace
    cd /workspace
    
    # Configure git
    git config --global user.name "Medusa Agent $AGENT_ID"
    git config --global user.email "agent-$AGENT_ID@medusa.local"
    git config --global safe.directory /workspace
    
    # Create agent branch
    git checkout -b "$AGENT_BRANCH" 2>/dev/null || git checkout "$AGENT_BRANCH"
    echo "Repository ready on branch: $AGENT_BRANCH"
fi

# Auto-detect and install dependencies
if [[ -f "requirements.txt" ]]; then
    echo "Installing Python dependencies..."
    pip3 install -q -r requirements.txt 2>/dev/null || true
fi

if [[ -f "package.json" ]]; then
    echo "Installing Node.js..."
    apk add --no-cache nodejs npm >/dev/null 2>&1
    npm install --silent 2>/dev/null || true
fi

# Setup output logging
CLAUDE_OUTPUT_FILE="/tmp/claude_output.log"
CLAUDE_STATUS_FILE="/tmp/claude_status.txt"

# Create named pipes for real-time streaming
mkfifo /tmp/claude_stream 2>/dev/null || true

# Function to stream Claude output
stream_claude_output() {
    echo "RUNNING" > "$CLAUDE_STATUS_FILE"

    claude --version &> /dev/null || {
        echo "[$(date +'%H:%M:%S')] ERROR: Claude Code not available"
        echo "ERROR" > "$CLAUDE_STATUS_FILE"
        return 1
    }

    # Execute task with Claude Code
    echo "[$(date +'%H:%M:%S')] Starting Claude Code with task: $1"
    echo "===== CLAUDE CODE SESSION STARTED ====="

    # Run Claude in non-interactive mode with real-time output
    claude "$1" 2>&1 | while IFS= read -r line; do
        echo "[$(date +'%H:%M:%S')] $line"
        echo "$line" >> "$CLAUDE_OUTPUT_FILE"

        # Check for file changes and commit
        if [[ -n $(git status --porcelain 2>/dev/null) ]]; then
            git add -A 2>/dev/null
            git commit -m "Claude Code: Auto-save changes" 2>/dev/null || true
        fi
    done

    echo "===== CLAUDE CODE SESSION COMPLETED ====="
    echo "COMPLETED" > "$CLAUDE_STATUS_FILE"
}

# Create command queue for continuous interaction
CLAUDE_COMMAND_QUEUE="/tmp/claude_commands.txt"
touch "$CLAUDE_COMMAND_QUEUE"

# Function to process Claude commands continuously
process_claude_commands() {
    echo "READY" > "$CLAUDE_STATUS_FILE"

    # Process initial task if provided
    if [[ -n "$TASK_DESCRIPTION" ]]; then
        echo "[$(date +'%H:%M:%S')] Processing initial task: $TASK_DESCRIPTION"
        stream_claude_output "$TASK_DESCRIPTION"
    fi

    echo "[$(date +'%H:%M:%S')] Claude ready for commands. Monitoring queue..."

    # Monitor command queue for new prompts
    tail -f "$CLAUDE_COMMAND_QUEUE" 2>/dev/null | while IFS= read -r command; do
        if [[ -n "$command" ]]; then
            echo "[$(date +'%H:%M:%S')] New command received: $command"
            echo "RUNNING" > "$CLAUDE_STATUS_FILE"

            # Execute Claude with the new command
            claude "$command" 2>&1 | while IFS= read -r line; do
                echo "[$(date +'%H:%M:%S')] $line"
                echo "$line" >> "$CLAUDE_OUTPUT_FILE"
            done

            echo "READY" > "$CLAUDE_STATUS_FILE"
            echo "[$(date +'%H:%M:%S')] Command completed. Ready for next command."

            # Auto-commit changes if any
            if [[ -n $(git status --porcelain 2>/dev/null) ]]; then
                git add -A 2>/dev/null
                git commit -m "Claude: Changes from command - $command" 2>/dev/null || true
            fi
        fi
    done
}

# Start Claude command processor
echo "Starting Claude Code continuous session..."
process_claude_commands &
CLAUDE_PID=$!

# Keep container alive
echo "Container ready. Claude is listening for commands..."
exec tail -f /dev/null