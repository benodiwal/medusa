# Changelog

All notable changes to Medusa will be documented in this file.

## [1.0.0] - 2026-01-03

### Added

- **Plan Review Interface** - Review Claude Code plans before they execute
- **Kanban Board** - Track plans across Pending, In Review, and Approved columns
- **Inline Annotations** - Add comments, deletions, insertions, and replacements to plan text
- **Global Comments** - Add high-level feedback that applies to the entire plan
- **Revision Diffs** - View line-by-line changes between plan versions
- **Obsidian Export** - Save approved plans to your Obsidian vault
- **Multi-session Support** - Track plans from multiple Claude Code terminals
- **Claude Code Hook** - Native integration via PreToolUse hook system
- **Theme Support** - Light and dark mode
- **Keyboard Shortcuts** - Quick actions for common operations

### Technical

- Built with Tauri 2, React, TypeScript, and Rust
- File-based queue persistence
- macOS support (Apple Silicon and Intel)
