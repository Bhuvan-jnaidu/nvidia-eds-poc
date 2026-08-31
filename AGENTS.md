# NVIDIA Contact Page — EDS POC

> AI agent context. See CLAUDE.md for the full developer reference.

## Project

Adobe Edge Delivery Services proof-of-concept replicating https://www.nvidia.com/en-us/contact/

- **No build step** — plain ES modules, zero runtime npm deps
- **Blocks**: `blocks/{name}/{name}.js` + `blocks/{name}/{name}.css`
- **Entry**: `scripts/scripts.js` → three-phase load (eager / lazy / delayed)

## Key Commands

```bash
npm start          # dev server → http://localhost:3001
npm test           # 59 Playwright e2e tests (headless)
npm run lint       # ESLint + Stylelint
npm run build:json # regenerate Universal Editor component JSON
```

## Conventions

- `export default async function decorate(block)` — required block signature
- Design tokens in `:root` inside `styles/styles.css`
- Never hardcode content in block JS — read from block DOM or authored fragments
- Run `npm run build:json` after editing any `blocks/**/_*.json` file
