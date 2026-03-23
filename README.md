# K8s Homelab Guide

Interactive React/Vite guide for building a home Kubernetes cluster on Mini PCs with Windows 11 + WSL workflows.

[![Deploy Guide Pages](https://github.com/ruslanlap/homelab-k8s/actions/workflows/deploy-guide-pages.yml/badge.svg)](https://github.com/ruslanlap/homelab-k8s/actions/workflows/deploy-guide-pages.yml)
[![Site Health](https://img.shields.io/website?url=https%3A%2F%2Fruslanlap.github.io%2Fhomelab-k8s%2F&up_message=online&down_message=offline&label=site)](https://ruslanlap.github.io/homelab-k8s/)
[![Last Commit](https://img.shields.io/github/last-commit/ruslanlap/homelab-k8s)](https://github.com/ruslanlap/homelab-k8s/commits/main)

## Live Site

- https://ruslanlap.github.io/homelab-k8s/

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

### Local production build

Run from `k8s-homelab-guide`:

```bash
npm run build -- --base=/homelab-k8s/
```

The static output is generated in `k8s-homelab-guide/dist/`.

### CI build

Workflow: `.github/workflows/deploy-guide-pages.yml`

- `Build and Deploy` job installs dependencies with `npm ci`
- Executes Vite production build with the correct base path
- Publishes `k8s-homelab-guide/dist` directly to `gh-pages`

## Deploy

### Automatic deploy (recommended)

On every push to `main` (changes under `k8s-homelab-guide/**`), the workflow deploys `dist` to the `gh-pages` branch.

### Manual deploy (fallback)

Run from `k8s-homelab-guide`:

```bash
npm run build -- --base=/homelab-k8s/ && npx gh-pages -d dist
```

### GitHub Pages settings

In repository settings, configure Pages source as:

- Branch: `gh-pages`
- Folder: `/ (root)`

Site URL: `https://ruslanlap.github.io/homelab-k8s/`

## Useful Scripts

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run preview` — preview production build locally
- `npm run lint` — TypeScript type-check
- `npm run clean` — remove `dist/`
# homelab-k8s
