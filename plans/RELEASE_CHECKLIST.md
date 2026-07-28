# DevVocab Release Checklist

## Build Artifact

- Run `npm run test`.
- Run `npm run build`.
- Run `npm run lint`.
- Run `npm run format:check`.
- Package the `dist` directory.

## GitHub Actions Package

The repository includes `.github/workflows/release-extension.yml`.

To create a package from GitHub:

1. Open GitHub Actions.
2. Run `Build Extension Package` manually, or push to `main`.
3. Wait for the workflow to pass.
4. Download the `devvocab-extension` artifact, or open the `latest` prerelease.
5. Confirm `devvocab-extension.zip` is attached.
6. Upload `devvocab-extension.zip` to the Chrome Web Store Developer Dashboard.

To publish a GitHub Release package:

1. Create and push a version tag, for example `v0.1.0`.
2. Wait for `Build Extension Package` to pass for that tag.
3. Confirm the workflow created or updated the matching GitHub Release.
4. Confirm `devvocab-extension.zip` is attached to the Release assets.

Pushes to `main` and manual workflow runs update the `latest` prerelease. Version tags like `v0.1.0` create stable releases.

The zip is created from inside `dist`, so `manifest.json` is at the archive root as required by Chrome Web Store.

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
