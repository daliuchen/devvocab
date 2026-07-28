# devvocab

A context-first vocabulary browser extension for developers reading technical English articles.

## MVP Features

- Select a word or phrase on a webpage and save it from the inline popover.
- Save source sentence, paragraph context, URL, title, domain, and locator metadata.
- Save from the Chrome context menu.
- Manage saved vocabulary in `vocabulary.html`.
- Search and filter by word, context, domain, and mastery state.
- Edit manual definitions and notes.
- Export local data as JSON or Markdown.
- Review saved words with context-first flashcards in `review.html`.
- Reopen the source page and highlight the saved context when the original text can be matched.

## Development

Install dependencies:

```sh
npm install
```

Start the Vite dev server:

```sh
npm run dev
```

Build the app:

```sh
npm run build
```

Check formatting:

```sh
npm run format:check
```

Run lint:

```sh
npm run lint
```

## Load the Extension Locally

Build the extension:

```sh
npm run build
```

Open Chrome and go to:

```text
chrome://extensions
```

Then:

1. Enable Developer mode.
2. Click Load unpacked.
3. Select the `dist` directory from this repository.

The current build includes:

- `popup.html` for the extension popup.
- `vocabulary.html` for the vocabulary management page.
- `review.html` for the review page.
- `assets/background.js` for the Manifest V3 background service worker.
- `assets/content.js` for the webpage content script.

## QA Notes

See [plans/QA_CHECKLIST.md](plans/QA_CHECKLIST.md) for manual verification coverage.

See [plans/RELEASE_CHECKLIST.md](plans/RELEASE_CHECKLIST.md) for Chrome Web Store packaging notes.
