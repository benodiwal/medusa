# Contributing to Medusa

Thanks for your interest in contributing to Medusa! This document provides guidelines for contributing to the project.

## Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/medusa.git
   cd medusa
   ```

3. Set up the development environment:
   ```bash
   cd medusa
   npm install
   npm run tauri dev
   ```

## Project Structure

```
medusa/
├── medusa/           # Desktop app (Tauri + React)
│   ├── src/          # React frontend
│   ├── src-tauri/    # Rust backend
│   └── public/       # Static assets
├── web/              # Marketing website (Next.js)
├── hooks/            # Claude Code hook scripts
└── docs/             # Documentation
```

## Development

### Desktop App

```bash
cd medusa
npm run tauri dev
```

### Website

```bash
cd web
npm run dev
```

## Making Changes

1. Create a new branch:
   ```bash
   git checkout -b feat/your-feature-name
   ```

2. Make your changes

3. Test your changes locally

4. Commit with a descriptive message:
   ```bash
   git commit -m "feat: add your feature description"
   ```

5. Push and create a pull request

## Commit Convention

We follow conventional commits:

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `refactor:` - Code refactoring
- `chore:` - Maintenance tasks

## Pull Requests

- Keep PRs focused on a single change
- Update documentation if needed
- Test on macOS before submitting

## Reporting Issues

When reporting issues, please include:

- macOS version
- Medusa version
- Steps to reproduce
- Expected vs actual behavior

## Questions?

Feel free to open an issue.

## License

By contributing, you agree that your contributions will be licensed under the Apache 2.0 License.
