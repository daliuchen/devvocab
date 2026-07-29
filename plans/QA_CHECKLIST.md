# ReadTrace QA Checklist

Use this checklist before publishing or demoing the MVP.

## Automated Gates

- `npm run test`: Passed, 4 files and 25 tests.
- `npm run build`: Passed.
- `npm run lint`: Passed.
- `npm run format:check`: Passed.
- `npm run qa:smoke`: Passed with Playwright Chromium loading `dist` as an unpacked extension.

## Technical Site Smoke Tests

Run the capture, save, manage, review, and source-reopen flow on:

| Site            | URL                                                       | Capture | Manage | Review | Reopen | Notes                       |
| --------------- | --------------------------------------------------------- | ------- | ------ | ------ | ------ | --------------------------- |
| MDN             | `https://developer.mozilla.org/en-US/docs/Web/JavaScript` | Passed  | Passed | Passed | Passed | Selected `content`; saved.  |
| React Docs      | `https://react.dev/learn`                                 | Passed  | Passed | Passed | Passed | Selected `Search`; saved.   |
| GitHub README   | `https://github.com/facebook/react`                       | Passed  | Passed | Passed | Passed | Selected `Platform`; saved. |
| Blog-style page | `https://web.dev/articles`                                | Passed  | Passed | Passed | Passed | Selected `cookies`; saved.  |

Latest smoke result is recorded in [QA_SMOKE_RESULTS.json](QA_SMOKE_RESULTS.json).

## Manual Flow

1. Build with `npm run build`.
2. Open `chrome://extensions`.
3. Enable Developer mode.
4. Load the `dist` directory as an unpacked extension.
5. Open a technical article.
6. Select a word or phrase.
7. Confirm the ReadTrace popover appears without disrupting page layout.
8. Click Save word.
9. Open the popup and confirm saved word count updates.
10. Open Library from the popup.
11. Confirm the word appears with source sentence, domain, and page title.
12. Edit definition and note, reload, and confirm values persist.
13. Change mastery state.
14. Export JSON and Markdown.
15. Open Review and reveal the card.
16. Mark an outcome and confirm the queue advances.
17. Return to Library and click the source button.
18. Confirm the original page opens and the matching context is highlighted.

## Content Script Isolation

Check the popover and highlight on:

- A documentation page with normal paragraphs.
- A page with inline code.
- A GitHub README.
- A page with a fixed header.

Pass criteria:

- The popover does not shift page layout: Passed in `npm run qa:smoke`.
- The popover stays inside the viewport: Passed in `npm run qa:smoke`.
- The highlight targets a visible source element: Passed in `npm run qa:smoke`.
- Host page buttons and links remain usable: No blocking layout mutation detected in `npm run qa:smoke`.

## Local Data Resilience

1. Save at least two words: Passed, 4 records saved in smoke test.
2. Close and reopen Chrome: Passed, Playwright persistent profile restarted.
3. Reload the extension: Passed, same unpacked extension loaded after restart.
4. Confirm Library still shows saved records: Passed, 4 records before and after restart.
5. Export JSON and confirm records are present: Covered by unit tests for export shape and library smoke data persistence.
