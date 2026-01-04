# Medusa

A desktop app for reviewing Claude Code plans before execution.

![Medusa](medusa/public/medusa-logo.png)

**Website:** [heymedusa.net](https://heymedusa.net) | **Documentation:** [heymedusa.net/docs](https://heymedusa.net/docs)

## What it does

When Claude Code enters plan mode, Medusa intercepts the plan via a hook and presents it in a review interface. You can:

- Review plans in a kanban-style board
- Add inline annotations (comments, deletions, suggested changes)
- Approve plans or request changes with feedback
- View diffs between plan revisions
- Browse history of reviewed plans with search
- Save plans to Obsidian

Claude Code waits for your decision before proceeding.

## Installation

### Download (Recommended)

Download the latest `.dmg` from [Releases](https://github.com/benodiwal/medusa/releases).

**macOS users:** The app is not code-signed yet. After installing, you'll need to allow it to run:

1. Open the `.dmg` and drag Medusa to Applications
2. **Right-click** (or Control-click) on Medusa.app and select **Open**
3. Click **Open** in the dialog that appears
4. You only need to do this once

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

## Hook Setup

1. Copy the hook script to your Claude hooks directory:

```bash
cp hooks/medusa-plan-review.sh ~/.claude/hooks/
chmod +x ~/.claude/hooks/medusa-plan-review.sh
```

2. Edit `~/.claude/hooks/medusa-plan-review.sh` and update the `MEDUSA_APP` path to point to your installation.

3. Add the hook configuration to your `~/.claude/settings.json`:

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
            "timeout": 3600
          }
        ]
      }
    ]
  }
}
```

**Important:** The `timeout` value (in seconds) controls how long Claude Code waits for your review. Default is 60 seconds which is too short. Set it to `3600` (1 hour) or higher for comfortable review time.

See [hooks/claude-settings.json](hooks/claude-settings.json) for the full configuration.

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `⌘K` | Focus search |
| `⌘↵` | Approve plan |
| `⌘⇧↵` | Request changes |
| `Esc` | Close modal |

## Data Storage

- `~/.medusa/queue.json` - Plan queue
- `~/.medusa/settings.json` - App settings
- `~/.medusa/history.db` - SQLite database for reviewed plans history
- `~/.medusa/pending/` - Incoming plans from hook

## Stack

- Tauri 2
- React + TypeScript
- Tailwind CSS
- Rust

## Please Consider Giving the Repo a Star ⭐

<a href="https://github.com/benodiwal/medusa">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=benodiwal/medusa&type=Timeline&theme=dark" />
    <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=benodiwal/medusa&type=Timeline" />
    <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=benodiwal/medusa&type=Timeline" />
  </picture>
</a>

## License

Apache 2.0
