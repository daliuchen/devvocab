# ReadTrace Store Listing

## One-line Summary

Remember where technical words came from.

## Short Description

ReadTrace helps developers save unfamiliar technical words with the source page, original sentence, and a link back to the exact place they found them.

## Detailed Description

ReadTrace is a source-aware reading memory extension for developers reading technical English articles, docs, and engineering blogs.

When you meet an unfamiliar word or phrase, select it and save it. ReadTrace stores the word together with its original sentence, page title, URL, domain, and a locator that helps reopen the source page and highlight the saved word later.

Use it to:

- Capture technical words without losing their original context.
- Browse saved marks by source page instead of only by word.
- Reopen the original article and jump back to the highlighted word.
- Add definitions and notes for later review.
- Review saved words with source-aware cards.
- Export your local data as JSON or Markdown.

ReadTrace stores data locally in your browser. It does not require an account and does not send saved words, page content, or browsing data to a server.

## Category

Productivity

## Language

English

## Suggested Screenshots

1. Select a word on a technical article and show the small ReadTrace save button.
2. Show the ReadTrace library with Sources, Marks, and Detail columns.
3. Show a source page reopened with the saved word highlighted.
4. Show the review card with source sentence context.
5. Show export actions on the library page.

## Privacy Disclosure Draft

ReadTrace stores saved words, source sentences, page titles, page URLs, domains, notes, definitions, and review state locally in browser storage. This data is used only to provide capture, source lookup, review, and export features.

ReadTrace does not collect, sell, transmit, or share user data with the developer or third parties. The extension does not require account login and does not use remote analytics.

## Permissions Explanation

- `contextMenus`: Adds a right-click action so users can save selected text to ReadTrace.
- Host access for `http://*/*` and `https://*/*`: Allows the content script to detect selected text, capture nearby sentence context, and highlight saved source locations on pages the user chooses to read.
