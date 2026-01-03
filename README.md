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

1. Copy the hook script to your Claude hooks directory:

```bash
cp hooks/medusa-plan-review.sh ~/.claude/hooks/
chmod +x ~/.claude/hooks/medusa-plan-review.sh
```

2. Edit `~/.claude/hooks/medusa-plan-review.sh` and update the `MEDUSA_APP` path to point to your installation.

3. Merge the hook configuration into your `~/.claude/settings.json`:

```bash
cat hooks/claude-settings.json
```

See [hooks/medusa-plan-review.sh](hooks/medusa-plan-review.sh) and [hooks/claude-settings.json](hooks/claude-settings.json) for the full configuration.

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
- `~/.medusa/pending/` - Incoming plans from hook

## Stack

- Tauri 2
- React + TypeScript
- Tailwind CSS
- Rust

## License

Apache 2.0
