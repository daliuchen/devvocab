# ReadTrace Development Plan

ReadTrace is a source-aware reading memory browser extension for developers reading technical English articles. The product should help users capture unfamiliar words from real technical pages, preserve the original context, and review them later with source-aware flashcards.

## Product Positioning

ReadTrace is not a generic dictionary. It is a developer-focused reading companion.

Core promise:

- Capture words directly from technical webpages.
- Save the original sentence, page title, URL, and lightweight locator.
- Review words later in the context where they were first encountered.
- Explain words in developer-friendly technical context.

## MVP Scope

The first version should be local-first and usable without an account.

Included:

- Chrome extension using Manifest V3.
- Select a word or phrase on any webpage.
- Show a lightweight lookup popover.
- Save the word with its source sentence, page URL, page title, domain, timestamp, and locator data.
- Store data locally in IndexedDB.
- Provide an extension page for library management.
- Search and filter saved words.
- Review saved words using simple flashcards.
- Track mastery state: `new`, `learning`, `known`.
- Export data as JSON and Markdown.

Excluded from MVP:

- User accounts.
- Cloud sync.
- Payment.
- Mobile app.
- Full-page article snapshots.
- Browser support beyond Chromium-based browsers.
- Required AI API usage.

## Technical Stack

- Language: TypeScript
- Extension: Chrome Extension Manifest V3
- UI: React
- Build tool: Vite
- Local database: IndexedDB
- IndexedDB wrapper: Dexie
- Styling: CSS modules or plain CSS first; avoid introducing a heavy UI framework early.
- Testing:
  - Unit tests for text extraction, normalization, and locator matching.
  - Manual extension testing in Chrome.
  - Playwright later for review page and extension page flows if needed.

## Main Extension Surfaces

### Content Script

Runs on webpages and handles reading interactions.

Responsibilities:

- Detect selected text.
- Extract the surrounding sentence.
- Extract paragraph-level context.
- Build a lightweight locator for returning to the source position.
- Render an inline popover near the selection.
- Send save requests to the extension runtime.
- Highlight a saved occurrence when returning from the review page.

### Background Service Worker

Coordinates extension actions.

Responsibilities:

- Handle context menu actions.
- Route messages between content scripts and extension pages.
- Open source pages when the user clicks "open in original page".
- Pass locator data to the destination tab for highlighting.

### Popup

Small extension popup for fast access.

Responsibilities:

- Show recent saved words.
- Provide quick links to library and review pages.
- Show basic stats.

### Library Page

Main management page.

Responsibilities:

- List saved words and occurrences.
- Search by word, sentence, domain, or page title.
- Filter by mastery state and domain.
- Edit note, definition, and mastery state.
- Delete words or individual occurrences.
- Export data.

### Review Page

Flashcard-style review page.

Responsibilities:

- Show word first.
- Reveal sentence, source title, definition, and note.
- Mark as remembered, uncertain, or forgotten.
- Update mastery state and review metadata.

## Data Model

### Word

```ts
type Word = {
  id: string
  text: string
  normalizedText: string
  language: 'en'
  mastery: 'new' | 'learning' | 'known'
  createdAt: number
  updatedAt: number
}
```

### Occurrence

One word can have many occurrences. Each saved selection creates one occurrence.

```ts
type Occurrence = {
  id: string
  wordId: string
  selectedText: string
  sentence: string
  paragraphText?: string
  pageUrl: string
  canonicalUrl?: string
  pageTitle: string
  domain: string
  definition?: string
  note?: string
  createdAt: number
  updatedAt: number
}
```

### Locator

Locator data should be redundant by design. Webpages change, so no single strategy is reliable.

```ts
type Locator = {
  occurrenceId: string
  textQuote: {
    exact: string
    prefix: string
    suffix: string
  }
  cssSelector?: string
  xpath?: string
  textOffset?: number
  paragraphHash?: string
}
```

### Review

```ts
type Review = {
  id: string
  wordId: string
  occurrenceId?: string
  dueAt: number
  lastReviewedAt?: number
  intervalDays: number
  ease: number
  lapses: number
}
```

## IndexedDB Schema

```ts
db.version(1).stores({
  words: 'id, normalizedText, mastery, createdAt, updatedAt',
  occurrences: 'id, wordId, pageUrl, domain, createdAt, updatedAt',
  locators: 'occurrenceId',
  reviews: 'id, wordId, dueAt, lastReviewedAt',
})
```

## Source Location Strategy

Returning to the original page is best-effort.

When saving:

- Store the page URL and title.
- Store the exact selected text.
- Store 50-100 characters before and after the selection.
- Store the full sentence.
- Store the nearest paragraph text with a length limit.
- Store a CSS selector for the nearest stable text container.
- Store a paragraph hash.

When reopening:

1. Open the original URL.
2. Try the saved CSS selector first.
3. Search within that node using the text quote.
4. If not found, search the full page text using exact text plus prefix and suffix.
5. If exact matching fails, use fuzzy matching against sentence or paragraph text.
6. Scroll the best match into view.
7. Temporarily highlight the occurrence.
8. If matching fails, show the saved sentence in the extension page instead of losing the context.

## Development Milestones

### Milestone 1: Project Foundation

- Scaffold Vite + React + TypeScript.
- Configure Manifest V3.
- Add extension build structure.
- Add content script, background service worker, popup, and options/review pages.
- Add linting and formatting.
- Add basic local development instructions.

Deliverable:

- Extension loads in Chrome.
- Popup opens.
- Content script can receive messages.

### Milestone 2: Capture and Store

- Implement text selection detection.
- Extract sentence and paragraph context.
- Generate locator data.
- Add Dexie database layer.
- Save word and occurrence records.
- Prevent accidental duplicate occurrences.

Deliverable:

- User can select a word on a webpage and save it locally.

### Milestone 3: Library Page

- Build saved words list.
- Show source sentence, page title, domain, and saved time.
- Add search and filters.
- Add delete and mastery update actions.
- Add JSON export.

Deliverable:

- User can manage saved marks from a dedicated page.

### Milestone 4: Source Reopen and Highlight

- Open original page from an occurrence.
- Pass locator data to the content script.
- Match and highlight the saved occurrence.
- Fall back cleanly when the page changed.

Deliverable:

- User can jump from a saved word back to the original webpage context.

### Milestone 5: Review Flow

- Build flashcard review page.
- Add simple review queue.
- Track remembered, uncertain, and forgotten outcomes.
- Update mastery state.

Deliverable:

- User can review saved words with original context.

### Milestone 6: Dictionary and Technical Explanation

- Add a basic dictionary provider.
- Add manual editing for definitions.
- Add optional AI explanation behind a user-provided API key.
- Keep AI optional so the product remains useful for free.

Deliverable:

- Saved words have useful definitions and optional developer-oriented explanations.

## First Implementation Order

1. Scaffold the extension app.
2. Confirm it loads in Chrome.
3. Implement the Dexie database.
4. Implement selection capture and save.
5. Build the library page.
6. Implement return-to-source highlighting.
7. Add review cards.

## Open Product Decisions

- Product name: `ReadTrace`.
- Phrase capture: selected phrases are supported as raw selected text in MVP.
- Dictionary provider: MVP is manual-only, with a provider interface kept for later integrations.
- Review scheduling: MVP uses a simple local review queue and mastery transitions, not full spaced repetition.
- Browser target: publish and test Chromium-based browsers first.

## Quality Bar

- The extension must not break host pages.
- Content script DOM changes must be minimal and isolated.
- Data must remain usable even if source pages disappear.
- Saving a word should feel fast.
- The product must work without login and without paid APIs.
- Export must be available before any cloud sync work starts.
