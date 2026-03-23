# K8s Homelab Guide

Interactive React/Vite guide for building a home Kubernetes cluster on Mini PCs with Windows 11 + WSL workflows.

## Features

- Step-by-step phased guide with progress tracking
- Bilingual UI (`uk` / `en`)
- Search across phases, steps, commands, and notes
- Variable substitution for commands (saved in `localStorage`)
- One-click command copying per step or per phase

## Tech Stack

- React 19
- Vite 6
- TypeScript
- Tailwind CSS 4
- Lucide icons + Motion animations

## Prerequisites

- Node.js 20+
- npm 10+

## Local Development

```bash
npm install
npm run dev
```

App runs on `http://localhost:3000`.

## Build

```bash
npm run build
```

Output is generated in `dist/`.

## Publish to GitHub Pages (repo website)

From this folder (`k8s-homelab-guide`), run:

```bash
npm run build -- --base=/homelab-k8s/ && npx gh-pages -d dist
```

This publishes the built site to the `gh-pages` branch, which can serve the repo website (for example: `https://ruslanlap.github.io/homelab-k8s/`).

## Useful Scripts

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run preview` — preview production build locally
- `npm run lint` — TypeScript type-check
- `npm run clean` — remove `dist/`
