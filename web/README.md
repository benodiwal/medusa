# Medusa Web

Web companion for the [Medusa](https://github.com/anthropics/medusa) desktop app - a plan review tool for Claude Code.

## Features

### Shared Plan Viewer (`/share`)

View and collaborate on plans shared from the Medusa desktop app.

- **View shared plans** - Plans are compressed and embedded in the URL hash, no backend required
- **Collaborative annotations** - Add your own annotations to shared plans
- **Author attribution** - Each reviewer's annotations are color-coded and attributed
- **Re-share with annotations** - Generate a new share URL that includes your annotations

#### How Sharing Works

1. In the Medusa desktop app, click "Share" on any plan
2. A URL is generated with the plan content compressed using lz-string
3. Recipients open the URL to view the plan and add their own annotations
4. They can re-share with their annotations included

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Deployment

Deploy to Vercel or any Next.js-compatible hosting:

```bash
npm run build
```

The share feature works entirely client-side with no backend dependencies.
