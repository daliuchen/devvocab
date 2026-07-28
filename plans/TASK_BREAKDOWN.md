# ReadTrace Task Breakdown

This file breaks the MVP development plan into executable tasks. Task status should be updated as implementation progresses.

## Task Quality Standard: SMART

Every task should satisfy SMART before implementation starts.

- Specific: The task describes one concrete outcome, not a broad theme.
- Measurable: The task has observable acceptance criteria.
- Achievable: The task is small enough to complete without solving multiple unrelated problems.
- Relevant: The task maps to the MVP user flow or required engineering foundation.
- Time-bound: The task should be sized to finish within about half a day to one day. Larger tasks should be split.

Task review checklist:

- The task has a stable ID.
- The task has one primary deliverable.
- The task has clear dependencies.
- The task has acceptance criteria that can be verified.
- The task avoids mixing product decisions with implementation work.
- The task states or implies what is out of scope.

Status values:

- `todo`: Not started.
- `doing`: In progress.
- `done`: Implemented and verified.
- `blocked`: Waiting on a decision or external dependency.

Recommended task shape:

| ID    | Status  | Task                                           | Depends On   | Acceptance Criteria                                                            | Verification                      |
| ----- | ------- | ---------------------------------------------- | ------------ | ------------------------------------------------------------------------------ | --------------------------------- |
| D2-04 | example | Implement save occurrence repository function. | D2-02, D2-03 | Saving creates or reuses a word and stores occurrence plus locator atomically. | Unit test plus manual save check. |

## Phase 0: Product Decisions

| ID    | Status | Task                                                 | Depends On | Acceptance Criteria                                                                                             | Verification                                                          |
| ----- | ------ | ---------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| P0-01 | done   | Confirm MVP product name and repository naming.      | None       | README and UI use the chosen product name consistently.                                                         | Review README, package metadata, and visible UI labels.               |
| P0-02 | done   | Decide whether phrase capture is first-class in MVP. | None       | Product behavior is documented: selected phrases are either supported explicitly or saved as raw selected text. | Decision is recorded in `plans/DEVELOPMENT_PLAN.md`.                  |
| P0-03 | done   | Decide dictionary provider for MVP.                  | None       | Decision recorded: no provider, free API provider, or manual-only definitions.                                  | Decision is recorded with provider name, cost, and fallback behavior. |
| P0-04 | done   | Decide review algorithm for MVP.                     | None       | Decision recorded: simple mastery flow or spaced repetition from day one.                                       | Decision is recorded with review state transitions.                   |

## Phase 1: Project Foundation

| ID    | Status | Task                                          | Depends On | Acceptance Criteria                                                        | Verification                                                           |
| ----- | ------ | --------------------------------------------- | ---------- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| F1-01 | done   | Scaffold Vite, React, and TypeScript project. | None       | `npm install`, `npm run dev`, and `npm run build` work.                    | Run install, dev startup, and production build locally.                |
| F1-02 | done   | Add Manifest V3 extension structure.          | F1-01      | Build output contains a valid `manifest.json` loadable by Chrome.          | Load `dist` as an unpacked extension in Chrome.                        |
| F1-03 | done   | Add popup entrypoint.                         | F1-02      | Extension popup renders a basic ReadTrace screen.                          | Open extension popup manually after loading unpacked extension.        |
| F1-04 | done   | Add vocabulary page entrypoint.               | F1-02      | Extension can open a vocabulary page route or HTML entry.                  | Open vocabulary page from extension URL and confirm no console errors. |
| F1-05 | done   | Add review page entrypoint.                   | F1-02      | Extension can open a review page route or HTML entry.                      | Open review page from extension URL and confirm no console errors.     |
| F1-06 | done   | Add background service worker.                | F1-02      | Service worker starts without runtime errors.                              | Inspect extension service worker console in Chrome.                    |
| F1-07 | done   | Add content script entrypoint.                | F1-02      | Content script loads on normal webpages and can respond to a ping message. | Send a ping message on a test webpage and verify response.             |
| F1-08 | done   | Add linting and formatting setup.             | F1-01      | `npm run lint` and formatting scripts are documented and pass.             | Run lint and formatting check scripts.                                 |
| F1-09 | done   | Document local extension loading workflow.    | F1-02      | README explains how to build and load unpacked extension in Chrome.        | Follow README steps on a fresh build.                                  |

## Phase 2: Core Data Layer

| ID    | Status | Task                                           | Depends On   | Acceptance Criteria                                                                          | Verification                                                              |
| ----- | ------ | ---------------------------------------------- | ------------ | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| D2-01 | done   | Add shared TypeScript domain models.           | F1-01        | `Word`, `Occurrence`, `Locator`, and `Review` types exist in shared source.                  | TypeScript build passes and models are imported by at least one module.   |
| D2-02 | done   | Add Dexie database setup.                      | D2-01        | IndexedDB database opens with `words`, `occurrences`, `locators`, and `reviews` tables.      | Unit test or manual browser check confirms database schema exists.        |
| D2-03 | done   | Implement word normalization.                  | D2-01        | Inputs normalize consistently for casing, whitespace, and punctuation trimming.              | Unit tests cover uppercase, whitespace, punctuation, and phrase input.    |
| D2-04 | done   | Implement save occurrence repository function. | D2-02, D2-03 | Saving creates or reuses a word and stores occurrence plus locator atomically.               | Unit test confirms word reuse and occurrence plus locator creation.       |
| D2-05 | done   | Add duplicate occurrence prevention.           | D2-04        | Saving the same selected text on the same URL and sentence does not create noisy duplicates. | Unit test saves the same occurrence twice and confirms one stored record. |
| D2-06 | done   | Add data query helpers.                        | D2-02        | UI can query recent words, all words, occurrences by word, and review due items.             | Unit tests seed database and verify each query result.                    |
| D2-07 | done   | Add export helpers.                            | D2-02        | Data can be exported as JSON and Markdown from pure functions.                               | Unit tests compare exported JSON and Markdown snapshots.                  |

## Phase 3: Text Capture and Locator Generation

| ID    | Status | Task                                                          | Depends On                 | Acceptance Criteria                                                                          | Verification                                                                        |
| ----- | ------ | ------------------------------------------------------------- | -------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| C3-01 | done   | Implement selected text extraction.                           | F1-07                      | Content script can read the active selection and reject empty selections.                    | Manual Chrome test selects text and empty whitespace on a sample page.              |
| C3-02 | done   | Implement sentence extraction from selection.                 | C3-01                      | Captured sentence includes selected text and handles common punctuation.                     | Unit tests cover sentence boundaries and selected text in the middle of a sentence. |
| C3-03 | done   | Implement paragraph context extraction.                       | C3-01                      | Captured paragraph text is length-limited and readable.                                      | Unit tests cover nested inline elements and long paragraph truncation.              |
| C3-04 | done   | Implement text quote generation.                              | C3-01                      | Locator includes exact selected text plus prefix and suffix.                                 | Unit tests verify exact, prefix, and suffix values around a selection.              |
| C3-05 | done   | Implement CSS selector generation for nearest text container. | C3-01                      | Locator includes a best-effort selector for the surrounding text node container.             | DOM fixture test resolves generated selector back to the expected element.          |
| C3-06 | done   | Implement paragraph hash generation.                          | C3-03                      | Locator includes a stable hash derived from normalized paragraph text.                       | Unit tests verify stable hash across whitespace-only changes.                       |
| C3-07 | done   | Add unit tests for capture utilities.                         | C3-02, C3-03, C3-04, C3-06 | Tests cover normal text, technical docs, nested inline elements, and punctuation edge cases. | Run unit test suite and confirm all capture utility tests pass.                     |

## Phase 4: Save Interaction

| ID    | Status | Task                               | Depends On          | Acceptance Criteria                                                        | Verification                                                         |
| ----- | ------ | ---------------------------------- | ------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| S4-01 | done   | Add inline selection popover.      | C3-01               | Selecting text shows a small non-invasive save popover near the selection. | Manual Chrome test verifies popover position and dismissal behavior. |
| S4-02 | done   | Add save action from popover.      | S4-01, D2-04        | Clicking save stores the selected word and occurrence in IndexedDB.        | Manual Chrome test saves a word and verifies database record.        |
| S4-03 | done   | Add save success and error states. | S4-02               | User sees clear feedback after save succeeds or fails.                     | Manual Chrome test covers success path and simulated failure path.   |
| S4-04 | done   | Add context menu save action.      | C3-01, D2-04        | User can save selected text from Chrome context menu.                      | Manual Chrome test saves selected text using right-click menu.       |
| S4-05 | done   | Add basic popup stats.             | D2-06, F1-03        | Popup shows recent saved words and total saved count.                      | Manual popup check after seeding or saving records.                  |
| S4-06 | done   | Add popup navigation links.        | F1-03, F1-04, F1-05 | Popup can open vocabulary and review pages.                                | Manual popup check opens both pages successfully.                    |

## Phase 5: Vocabulary Management Page

| ID    | Status | Task                             | Depends On   | Acceptance Criteria                                                     | Verification                                            |
| ----- | ------ | -------------------------------- | ------------ | ----------------------------------------------------------------------- | ------------------------------------------------------- |
| V5-01 | done   | Build vocabulary page layout.    | F1-04        | Page has search, filters, list area, and detail area or modal.          | Manual UI check at desktop and narrow viewport widths.  |
| V5-02 | done   | Render saved words list.         | V5-01, D2-06 | Saved words appear with mastery state and occurrence count.             | Manual check with seeded data or saved words.           |
| V5-03 | done   | Render occurrence details.       | V5-02        | User can view source sentence, page title, URL, domain, and saved time. | Manual check selects a word with multiple occurrences.  |
| V5-04 | done   | Add search.                      | V5-02        | User can search by word, sentence, page title, and domain.              | Unit test filtering logic and manual UI search check.   |
| V5-05 | done   | Add filters.                     | V5-02        | User can filter by mastery state and domain.                            | Unit test filtering logic and manual UI filter check.   |
| V5-06 | done   | Add mastery update action.       | V5-02, D2-06 | User can mark a word as `new`, `learning`, or `known`.                  | Manual UI update followed by database state check.      |
| V5-07 | done   | Add note and definition editing. | V5-03        | User can edit note and definition for an occurrence.                    | Manual edit, reload page, and confirm persisted values. |
| V5-08 | done   | Add delete actions.              | V5-02, V5-03 | User can delete a word or individual occurrence with confirmation.      | Manual delete check confirms database and UI update.    |
| V5-09 | done   | Add JSON export.                 | V5-01, D2-07 | User can download all local data as JSON.                               | Manual export and validate downloaded JSON shape.       |
| V5-10 | done   | Add Markdown export.             | V5-01, D2-07 | User can download saved vocabulary as readable Markdown.                | Manual export and inspect Markdown content.             |

## Phase 6: Return to Source and Highlight

| ID    | Status | Task                                      | Depends On   | Acceptance Criteria                                                                    | Verification                                                         |
| ----- | ------ | ----------------------------------------- | ------------ | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| R6-01 | done   | Add open source action from occurrence.   | V5-03, F1-06 | Clicking source opens the original URL.                                                | Manual check opens source URL from occurrence detail.                |
| R6-02 | done   | Pass locator data to destination tab.     | R6-01        | Background service worker can send the occurrence locator to the loaded tab.           | Manual check logs or debug UI confirm locator receipt.               |
| R6-03 | done   | Implement selector-based matching.        | R6-02, C3-05 | Content script can find candidate node by saved selector.                              | Unit test with DOM fixture and manual source reopen check.           |
| R6-04 | done   | Implement text quote matching.            | R6-02, C3-04 | Content script can match exact text with prefix and suffix.                            | Unit tests cover exact quote, prefix, and suffix matching.           |
| R6-05 | done   | Implement fallback fuzzy matching.        | R6-04        | Content script can find likely match by sentence or paragraph when exact quote fails.  | Unit tests cover changed whitespace and mildly changed text.         |
| R6-06 | done   | Implement scroll and temporary highlight. | R6-03, R6-04 | Matched text scrolls into view and receives temporary highlight styling.               | Manual Chrome check on a long page verifies scroll and highlight.    |
| R6-07 | done   | Add failure fallback UI.                  | R6-05        | If matching fails, vocabulary page still shows saved sentence and source link clearly. | Manual check with intentionally changed or unavailable page content. |
| R6-08 | done   | Add tests for locator matching utilities. | R6-04, R6-05 | Tests cover exact, changed whitespace, and missing selector scenarios.                 | Run locator matching unit tests.                                     |

## Phase 7: Review Flow

| ID    | Status | Task                                 | Depends On   | Acceptance Criteria                                                             | Verification                                                  |
| ----- | ------ | ------------------------------------ | ------------ | ------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| W7-01 | done   | Build review page layout.            | F1-05        | Review page has card area, reveal action, and outcome actions.                  | Manual UI check at desktop and narrow viewport widths.        |
| W7-02 | done   | Implement review queue query.        | D2-06        | Page can load due or unreviewed words.                                          | Unit test seeds review data and verifies queue ordering.      |
| W7-03 | done   | Render flashcard front.              | W7-01, W7-02 | User sees word, source title, and optional domain before reveal.                | Manual review page check with seeded data.                    |
| W7-04 | done   | Render flashcard back.               | W7-03        | User sees sentence, definition, note, and source link after reveal.             | Manual reveal check with seeded occurrence data.              |
| W7-05 | done   | Implement review outcomes.           | W7-04        | Remembered, uncertain, and forgotten update review metadata.                    | Unit test state transitions and manual outcome click check.   |
| W7-06 | done   | Update mastery from review outcomes. | W7-05        | Repeated remembered answers can mark known; forgotten answers move to learning. | Unit tests cover mastery transitions after repeated outcomes. |
| W7-07 | done   | Add empty states.                    | W7-02        | Page handles no saved words and no due reviews cleanly.                         | Manual check with empty database and completed review queue.  |

## Phase 8: Definitions and Technical Explanations

| ID    | Status | Task                                                       | Depends On   | Acceptance Criteria                                                     | Verification                                                  |
| ----- | ------ | ---------------------------------------------------------- | ------------ | ----------------------------------------------------------------------- | ------------------------------------------------------------- |
| E8-01 | done   | Add definition provider interface.                         | D2-01        | App has a provider abstraction that can be mocked in tests.             | Unit test uses a mock provider through the interface.         |
| E8-02 | done   | Add manual definition flow.                                | V5-07        | User can use the product without external dictionary or AI services.    | Manual edit and reload check with network disabled.           |
| E8-03 | done   | Integrate selected free dictionary provider if chosen.     | P0-03, E8-01 | Lookup can fetch a basic definition for English words.                  | Unit test provider parsing and manual lookup check.           |
| E8-04 | done   | Add optional AI settings page if chosen.                   | E8-01        | User can provide an API key locally; no key is required for core usage. | Manual settings check with and without an API key.            |
| E8-05 | done   | Add developer-context explanation prompt if AI is enabled. | E8-04        | AI explanation uses selected text, sentence, page title, and domain.    | Unit test prompt construction and manual explanation request. |

## Phase 9: Verification and Release Prep

| ID    | Status | Task                                        | Depends On          | Acceptance Criteria                                                              | Verification                                                           |
| ----- | ------ | ------------------------------------------- | ------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Q9-01 | done   | Manual test on common technical sites.      | S4-02, V5-03, R6-06 | Capture and reopen work on MDN, React docs, GitHub README, and blog-style pages. | Record pass/fail notes for each site in release notes or QA checklist. |
| Q9-02 | done   | Check content script isolation.             | S4-01, R6-06        | Popover and highlight styles do not visibly break host pages.                    | Manual visual check on at least four representative sites.             |
| Q9-03 | done   | Check local data resilience.                | D2-04, V5-09        | Data remains available after extension reload and browser restart.               | Manual reload and browser restart check with saved records.            |
| Q9-04 | done   | Add screenshots or demo notes.              | V5-01, W7-01        | README has enough visuals or notes to explain the MVP.                           | Review README in GitHub preview.                                       |
| Q9-05 | done   | Prepare Chrome Web Store package checklist. | F1-02               | Release notes, permissions, privacy notes, and build artifact checklist exist.   | Review checklist before packaging release build.                       |

## Recommended Build Order

1. Complete Phase 1 foundation.
2. Complete Phase 2 data layer.
3. Complete Phase 3 capture utilities.
4. Complete Phase 4 save interaction.
5. Build the vocabulary page from Phase 5.
6. Add return-to-source highlighting from Phase 6.
7. Add review flow from Phase 7.
8. Add definitions only after capture, storage, and review feel solid.
9. Do verification and release prep.

## Current Next Task

All planned MVP tasks are implemented. Keep this file current when new scope is added.
