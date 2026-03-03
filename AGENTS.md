# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

Tybelos is a "Decision OS" PWA built with **Next.js 16** (App Router) + **React 19** + **TypeScript** (strict). The UI is in Italian. All application code lives under `tybelos/`.

- No external database — persistence is browser-side **IndexedDB** (offline-first).
- `/api/predict` is a deterministic stub (no real AI backend).
- No Docker, no external services required.

### Running the app

All commands run from the `tybelos/` directory:

| Task | Command |
|------|---------|
| Install deps | `npm install` |
| Dev server | `npm run dev` (serves at `localhost:3000`) |
| Lint | `npm run lint` |
| Build | `npm run build` |

### Notes

- The project uses **npm** (lock file: `package-lock.json`). Do not use pnpm or yarn.
- ESLint is configured via flat config (`eslint.config.mjs`) with `--max-warnings=0`.
- There are no automated test suites configured yet (no test script in `package.json`).
- The PWA service worker (`public/sw.js`) caches pages for offline use; on `localhost` it works without HTTPS.
