# Medusa

Your control center for AI-powered development with Claude Code.

![Medusa](medusa/public/medusa-logo.png)

**Website:** [heymedusa.net](https://heymedusa.net) | **Documentation:** [heymedusa.net/docs](https://heymedusa.net/docs)

## What is Medusa?

Medusa is a desktop app that gives you human oversight over Claude Code through two integrated workflows:

### Plans
When Claude Code enters plan mode, Medusa intercepts the plan and lets you review it before execution:
- Review plans in a kanban board
- Add inline annotations (comments, deletions, suggested changes)
- Approve or request changes with structured feedback
- View diffs between plan revisions

### Tasks
Create tasks and let Claude Code work autonomously on isolated git branches:
- Run multiple agents in parallel (each on its own git worktree)
- Monitor progress in real-time
- Review code changes before merging
- One-click merge when ready

Both workflows live in a single unified board—see plans awaiting review alongside running agents and completed tasks.

## Installation

### Download (Recommended)

Download the latest `.dmg` from [Releases](https://github.com/benodiwal/medusa/releases).

**macOS users:** The app is not code-signed yet. After installing:

1. Open the `.dmg` and drag Medusa to Applications
2. **Right-click** (or Control-click) on Medusa.app and select **Open**
3. Click **Open** in the dialog that appears

If that doesn't work, run this in Terminal:
```bash
xattr -cr /Applications/medusa.app
```

### Build from Source

```bash
cd medusa
npm install
npm run tauri build
```

The app will be at `src-tauri/target/release/bundle/macos/medusa.app`

## Quick Start

### Using Tasks (No Setup Required)

1. Open Medusa
2. Click **New Task**
3. Enter a title, description, and select your project folder
4. Click **Start Agent** to begin

The agent runs on an isolated git branch. When it's done, review the changes and merge.

### Using Plans (Requires Hook Setup)

To intercept Claude Code plans, you need to configure a hook:

1. Copy the hook script:
```bash
cp hooks/medusa-plan-review.sh ~/.claude/hooks/
chmod +x ~/.claude/hooks/medusa-plan-review.sh
```

2. Edit `~/.claude/hooks/medusa-plan-review.sh` and update the `MEDUSA_APP` path.

3. Add to `~/.claude/settings.json`:
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "ExitPlanMode",
        "hooks": [
          {
            "type": "command",
            "command": "~/.claude/hooks/medusa-plan-review.sh",
            "timeout": 86400
          }
        ]
      }
    ]
  }
}
```

**Important:** Set `timeout` to `86400` (24 hours). If timeout is reached, Claude proceeds without approval.

## Workflow

### Task Lifecycle

```
Backlog → In Progress → Review → Done
   │           │           │
   │     Agent runs    Review diffs
   │     on worktree   Edit commits
   │                   Merge to main
   └── Click "Start Agent"
```

### Plan Lifecycle

```
Pending → In Review → Approved/Changes Requested
   │          │              │
   │     Add annotations     │
   │     Review content      └── Claude revises
   │                              (back to Pending)
   └── Claude sends plan
```

### Unified Board

Both plans and tasks appear in the same kanban:
- **Backlog**: Tasks waiting to start
- **In Progress**: Running agents + Plans being revised
- **Review**: Task diffs ready for review + Plans awaiting approval
- **Done**: Merged tasks + Approved plans

## Features

| Feature | Plans | Tasks |
|---------|-------|-------|
| Kanban board | ✓ | ✓ |
| Rich annotations | ✓ | — |
| Revision diffs | ✓ | — |
| Code diffs | — | ✓ |
| Parallel execution | — | ✓ |
| Git worktrees | — | ✓ |
| One-click merge | — | ✓ |
| Obsidian export | ✓ | — |
| Plan sharing | ✓ | — |

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `⌘K` | Focus search |
| `⌘↵` | Approve plan |
| `⌘⇧↵` | Request changes |
| `Esc` | Close modal |

## Data Storage

- `~/.medusa/medusa.db` - SQLite database (plans, tasks, history)
- `~/.medusa/sessions/` - Agent session files
- `~/.medusa/pending/` - Incoming plans from hook
- `.medusa-worktrees/` - Git worktrees for tasks (in each project)

## Stack

- Tauri 2
- React + TypeScript
- Tailwind CSS
- Rust

## Contributing

Found a bug or have a feature request? [Open an issue](https://github.com/benodiwal/medusa/issues).

## Please Consider Giving the Repo a Star

<a href="https://github.com/benodiwal/medusa">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=benodiwal/medusa&type=Timeline&theme=dark" />
    <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=benodiwal/medusa&type=Timeline" />
    <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=benodiwal/medusa&type=Timeline" />
  </picture>
</a>

## License

Apache 2.0
