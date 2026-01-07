# AGENTS.md

Guidance for AI coding agents working in this repository.

## Project

- **Name**: FaceMikeAI (per `README.md`)
- **Goal**: Not yet documented in-repo. When more context exists, update this file with a 2–3 sentence description and the primary entrypoints.

## Before you change anything

- **Scan the repo**: Identify the tech stack (Node/Python/etc.), existing conventions, and any CI requirements.
- **Prefer small, safe diffs**: Minimize churn; avoid mass formatting unless explicitly requested.
- **Do not add secrets**: Never commit API keys, tokens, private URLs, or credentials. Use environment variables and `.env.example` when needed.

## Repository layout (current)

At time of writing, the repo is minimal:

- `README.md` — project name
- `AGENTS.md` — this file

When code is added, update this section with the important top-level directories (e.g., `src/`, `apps/`, `packages/`, `api/`, `infra/`, `docs/`).

## Setup & common commands

This repository does not currently define a build/test toolchain. Once a stack is present, document the exact commands here.

Use these rules to decide what to run:

- **If `package.json` exists**:
  - Install: `npm ci` (or `pnpm i --frozen-lockfile`, `yarn --frozen-lockfile` depending on lockfile)
  - Lint: `npm run lint`
  - Test: `npm test` (or `npm run test`)
  - Build: `npm run build`
- **If `pyproject.toml` / `requirements.txt` exists**:
  - Install: `pip install -r requirements.txt` or `pip install -e .`
  - Lint: `ruff check .` / `flake8` (whichever is configured)
  - Format: `ruff format .` / `black .`
  - Test: `pytest`

If the repo introduces a `Makefile`, prefer documenting a minimal set of `make` targets (e.g., `make setup`, `make lint`, `make test`).

## Coding conventions (defaults until overridden)

- **Follow existing style**: Match formatting and patterns already used in adjacent files.
- **Prefer clarity over cleverness**: Readable names, explicit types (when applicable), and straightforward control flow.
- **Error handling**: Return actionable messages; avoid swallowing exceptions.
- **Logging**: Keep logs structured and non-sensitive; do not log secrets or PII.

## Tests & quality bar

- **Update or add tests** when changing behavior.
- **Run the narrowest relevant checks** (unit tests for the touched modules; avoid running the entire suite if it’s very large unless required).
- **Keep CI green**: If you can run lint/tests locally, do so before concluding work.

## Documentation

- Update `README.md` and/or `docs/` when introducing:
  - new environment variables
  - new services/daemons
  - new scripts/commands
  - breaking changes

## PR / change hygiene

- Write commit/PR descriptions focusing on **why** the change is needed.
- Include a **test plan** (what you ran, or why you couldn’t run it).
- If you must add a dependency, prefer the **latest stable** and document why it’s needed.

