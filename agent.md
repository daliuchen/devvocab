# ReadTrace Agent Guide

ReadTrace is a source-aware browser extension for technical reading. It helps users save unfamiliar English words or phrases together with the original sentence, page metadata, and locator data so they can revisit the source context later.

## Project Shape

- Frontend: React, TypeScript, Vite.
- Extension target: Chrome Manifest V3, with a Firefox package generated from the same source.
- Local storage: IndexedDB through Dexie.
- Source code lives under `src/`.
- Static extension assets live under `public/`.
- Planning and release notes live under `plans/`.
- `dist/`, `dist-firefox/`, and `*.zip` are generated artifacts and should not be edited by hand.

## Important Workflows

- Install dependencies with `npm ci` in CI and `npm install` locally when needed.
- Run tests with `npm run test`.
- Run formatting checks with `npm run format:check`.
- Run lint with `npm run lint`.
- Build the Chrome extension with `npm run build`.
- Build the Firefox package with `npm run build:firefox`.
- The pipeline builds and packages release artifacts, so source changes should be made in tracked source files, not in generated build output.

## Product Direction

- Keep the popup lightweight: saved mark count and a clear path to the library.
- Treat the library page as the primary product surface for browsing saved sources and marks.
- Preserve the core value: saved words must remain connected to source sentence, URL, title, domain, and locator metadata.
- Do not expose unfinished review flows as primary UI unless the review experience and scheduling logic are intentionally brought back.
- Avoid user-facing labels like "MVP" in the extension UI.

## Coding Notes

- Follow the existing TypeScript and React style.
- Prefer small, focused changes over broad refactors.
- Keep extension message types in `src/shared/messages.ts` aligned with background, popup, and content scripts.
- Keep persisted data model changes in `src/shared/models.ts`, `src/data/database.ts`, and repository helpers consistent.
- If changing capture or source-highlight behavior, update or add focused tests under `src/capture/`.
- If changing storage behavior, update or add focused tests under `src/data/`.

## Build And Release Notes

- GitHub Actions currently uses Node.js 26.
- Local Node versions should satisfy Vite's requirement. Vite 8 warns below Node 20.19 or 22.12.
- Do not commit regenerated zip files unless the release process explicitly requires it.
- If generated `dist` files are present locally, treat them as build output and verify source files first.
