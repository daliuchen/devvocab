# DevVocab Release Checklist

## Build Artifact

- Run `npm run test`.
- Run `npm run build`.
- Run `npm run lint`.
- Run `npm run format:check`.
- Package the `dist` directory.

## Chrome Extension Metadata

- Name: `DevVocab`
- Version source: `public/manifest.json`
- Description: `Context-first vocabulary for developers reading technical English articles.`
- Category: Productivity or Education

## Permissions

Current permissions:

- `contextMenus`: required for right-click save.

Current host access:

- `http://*/*`
- `https://*/*`

Reason:

- The content script needs to detect selected text and capture source context on webpages where the user reads technical content.

## Privacy Notes

- MVP stores data locally in the browser through IndexedDB.
- MVP does not require an account.
- MVP does not sync data to a server.
- MVP does not call an external dictionary or AI provider.
- User can export local data as JSON or Markdown.

## Manual QA

Complete [QA_CHECKLIST.md](QA_CHECKLIST.md) before packaging.
