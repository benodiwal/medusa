# Changelog

All notable changes to Medusa will be documented in this file.

## [0.2.2] - 2026-01-16

### Added

- **Base Branch Tracking** - Tasks now remember which branch they were created from and merge back to it
- **Base Commit Tracking** - Accurate diffs showing only agent changes, not inherited branch commits
- **Plan Mode Timeout Setting** - Configurable timeout (5-60 minutes) for plan approval in Settings

### Fixed

- **Merge Target** - Tasks now merge back to their original branch instead of current branch
- **Branch Cleanup** - Task branches are now deleted after merge (previously left behind)
- **Diff Accuracy** - Commits and file diffs now show only agent's work, not parent branch changes
- **Plan Mode Timeout** - Hook script now respects the configured timeout setting

## [0.2.1] - 2026-01-16

### Added

- **Auto Setup** - Automatic hook configuration on app startup for plan mode
- **Diff with Main** - Compare task branch changes against main branch
- **Preview Modal** - View completed tasks and approved plans in read-only preview mode
- **Markdown Parser** - Rich rendering of Claude Code agent output with syntax highlighting
- **Dynamic Version** - Settings page now displays version automatically from app config

### Fixed

- **Done Items Read-only** - Completed tasks and approved plans can no longer be opened for editing
- **Hook Script Permissions** - Setup now checks and ensures hook script has executable permissions
- **Tauri Dialog** - Use native Tauri dialogs instead of browser confirm for proper async handling
- **Memory Limits** - Added memory limits and worktree health checks
- **Event Listener Cleanup** - Improved cleanup to prevent memory leaks
- **Task Race Conditions** - Added pre-flight checks and conflict handling for tasks

### Changed

- Updated docs link in setup banner to heymedusa.net/docs

## [0.2.0] - 2026-01-15

### Added

- **Tasks** - Create tasks and run Claude Code agents autonomously on isolated git branches
- **Unified Kanban** - Plans and tasks in one board with Backlog, In Progress, Review, and Done columns
- **Git Worktrees** - Each task runs on its own git worktree, keeping branches isolated from main
- **Parallel Agents** - Run multiple Claude Code instances simultaneously without conflicts
- **Agent Chat** - Monitor agent output in real-time and send follow-up messages
- **Code Diff Review** - Review file-by-file changes before merging with syntax highlighting
- **One-click Merge** - Merge completed task branches into main with a single click
- **Task Detail Page** - View agent output, commit history, and diffs in a dedicated view
- **Commit Editing** - Update commit messages before merging

### Changed

- Redesigned home screen with unified kanban replacing separate plans view
- Updated landing page to highlight both Plans and Tasks workflows
- Refreshed documentation with Tasks quick start guide
- New screenshots showcasing unified workflow

### Technical

- Added `task_agent.rs` for Claude Code process management
- Git worktree management via Rust commands
- Stream-based agent output using `--output-format stream-json`
- SQLite migrations for tasks table

## [0.1.2] - 2026-01-13

### Added

- **Onboarding Guide** - Interactive setup guide for new users on home screen
- **History Preview** - Preview modal for viewing approved/rejected plans from history
- **Font Customization** - Customize fonts in settings
- **Pricing Page** - Added pricing page with Coming Soon for Pro and Team tiers
- **Mobile Share Page** - Fully responsive share page for mobile devices
- **Landing Page Share** - Share component on landing page

### Fixed

- Hook script URL in onboarding guide
- Mobile view layout on home page
- Mobile scroll issue on share page
- Share page DOM renderer and view issues
- Consistent discount display (17% in both places)
- Pricing updated to USD with Pricing link in header

### Changed

- Simplified onboarding to 3 steps with GitHub script link

### Documentation

- Added timeout auto-approval warning (recommend 86400s)
- Added macOS unsigned app workaround instructions

## [0.1.1] - 2026-01-04

### Added

- **Plan Sharing** - Share plans with collaborators via URL (no backend required)
- **Collaborative Annotations** - Multiple reviewers can add annotations to shared plans
- **Author Attribution** - Each reviewer's annotations are tracked and displayed separately
- **Re-share with Annotations** - Generate new share URLs that include combined feedback
- **Share Page** - Web viewer at heymedusa.net/share for viewing shared plans

### Fixed

- Annotation persistence when closing modal quickly
- Code block rendering on web share page
- Theme color consistency across web components

### Changed

- Updated documentation with sharing feature guide

## [0.1.0] - 2026-01-03

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
