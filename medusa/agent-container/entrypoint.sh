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

# Execute task if provided
if [[ -n "$TASK_DESCRIPTION" ]]; then
    echo "Executing task: $TASK_DESCRIPTION"
    
    # Add your agent logic here
    # For example: claude-code, aider, or custom scripts
    echo "Task: $TASK_DESCRIPTION" > agent_output.txt
    echo "Task logged to agent_output.txt"
    
    # Auto-commit if changes were made
    if [[ -n $(git status --porcelain 2>/dev/null) ]]; then
        git add -A
        git commit -m "Agent $AGENT_ID: $TASK_DESCRIPTION" 2>/dev/null || true
        echo "Changes committed"
    fi
fi

# Keep container alive if needed
if [[ "${KEEP_ALIVE}" == "true" ]] || [[ -z "$TASK_DESCRIPTION" ]]; then
    echo "Agent ready. Container staying alive..."
    exec tail -f /dev/null
else
    echo "Task complete. Exiting."
fi