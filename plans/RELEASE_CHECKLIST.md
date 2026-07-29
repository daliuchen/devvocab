# ReadTrace Release Checklist

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
4. Download the `readtrace-extension` artifact, or open the `latest` prerelease.
5. Confirm `readtrace-extension.zip` and `readtrace-firefox.zip` are attached.
6. Upload `readtrace-extension.zip` to the Chrome Web Store Developer Dashboard.

To publish a GitHub Release package:

1. Create and push a version tag, for example `v0.1.0`.
2. Wait for `Build Extension Package` to pass for that tag.
3. Confirm the workflow created or updated the matching GitHub Release.
4. Confirm `readtrace-extension.zip` and `readtrace-firefox.zip` are attached to the Release assets.

Pushes to `main` and manual workflow runs update the `latest` prerelease. Version tags like `v0.1.0` create stable releases.

The zip is created from inside `dist`, so `manifest.json` is at the archive root as required by Chrome Web Store.

## Firefox Package

Local build:

1. Run `npm run build:firefox`.
2. Confirm `readtrace-firefox.zip` exists.
3. In Firefox, open `about:debugging#/runtime/this-firefox`.
4. Click `Load Temporary Add-on`.
5. Select `dist-firefox/manifest.json`.

The Firefox package uses Manifest V3 with `background.scripts` and `type: module`, while the Chrome package uses `background.service_worker`.

## Chrome Extension Metadata

- Name: `ReadTrace`
- Version source: `public/manifest.json`
- Description: `Remember where technical words came from.`
- Category: Productivity or Education
- Store listing draft: [STORE_LISTING.md](STORE_LISTING.md)
- Privacy policy draft: [../PRIVACY.md](../PRIVACY.md)

## Icons

Manifest icons are included:

- `public/icons/readtrace-16.png`
- `public/icons/readtrace-32.png`
- `public/icons/readtrace-48.png`
- `public/icons/readtrace-128.png`

Source SVG:

- `public/readtrace-icon.svg`

Chrome Web Store still needs final promotional assets before public listing:

- Small promo tile: 440 x 280.
- Screenshots: at least one 1280 x 800 or 640 x 400 image.
- Optional marquee promo tile: 1400 x 560.

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
