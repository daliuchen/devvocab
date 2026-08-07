import { afterEach, describe, expect, it } from 'vitest'
import { ReadTraceDatabase } from './database'
import {
  exportAsJson,
  exportAsMarkdown,
  exportAsObsidianMarkdown,
} from './export'
import {
  getAllWords,
  getDueReviews,
  getOccurrencesByWord,
  getReviewCards,
  getRecentWords,
  recordReviewOutcome,
  saveOccurrence,
} from './repository'
import type {
  NewOccurrenceInput,
  Occurrence,
  Review,
  Word,
} from '../shared/models'
import { normalizeWord } from '../shared/normalize'

const databases: ReadTraceDatabase[] = []

function createDatabase() {
  const db = new ReadTraceDatabase(`devvocab-test-${databases.length}`)
  databases.push(db)
  return db
}

function createOccurrenceInput(
  overrides: Partial<NewOccurrenceInput> = {},
): NewOccurrenceInput {
  return {
    selectedText: 'Concurrency',
    sentence: 'Rust makes fearless concurrency practical.',
    paragraphText:
      'Rust makes fearless concurrency practical for systems programming.',
    pageUrl: 'https://doc.rust-lang.org/book/ch16-00-concurrency.html',
    pageTitle: 'Fearless Concurrency',
    domain: 'doc.rust-lang.org',
    locator: {
      textQuote: {
        exact: 'concurrency',
        prefix: 'Rust makes fearless ',
        suffix: ' practical.',
      },
      cssSelector: 'main p:nth-of-type(1)',
      paragraphHash: 'hash-1',
    },
    ...overrides,
  }
}

afterEach(async () => {
  await Promise.all(databases.splice(0).map((db) => db.delete()))
})

describe('normalizeWord', () => {
  it('normalizes casing, whitespace, punctuation, and phrases', () => {
    expect(normalizeWord('  "Concurrency,"  ')).toBe('concurrency')
    expect(normalizeWord('Race   Condition')).toBe('race condition')
    expect(normalizeWord('`trait`')).toBe('trait')
  })
})

describe('ReadTraceDatabase', () => {
  it('opens the IndexedDB schema with core tables', async () => {
    const db = createDatabase()
    await db.open()

    expect(db.words.name).toBe('words')
    expect(db.occurrences.name).toBe('occurrences')
    expect(db.locators.name).toBe('locators')
    expect(db.reviews.name).toBe('reviews')
  })

  it('imports and stores shared domain models', async () => {
    const db = createDatabase()
    const now = 1000
    const word: Word = {
      id: 'word-1',
      text: 'trait',
      normalizedText: 'trait',
      language: 'en',
      mastery: 'new',
      createdAt: now,
      updatedAt: now,
    }

    await db.words.add(word)

    expect(await db.words.get('word-1')).toEqual(word)
  })
})

describe('saveOccurrence', () => {
  it('creates a word, occurrence, locator, and review atomically', async () => {
    const db = createDatabase()
    const result = await saveOccurrence(db, createOccurrenceInput(), 1000)

    expect(result.created).toBe(true)
    expect(result.word.normalizedText).toBe('concurrency')
    expect(result.occurrence.wordId).toBe(result.word.id)
    expect(result.locator.occurrenceId).toBe(result.occurrence.id)

    expect(await db.words.count()).toBe(1)
    expect(await db.occurrences.count()).toBe(1)
    expect(await db.locators.count()).toBe(1)
    expect(await db.reviews.count()).toBe(1)
  })

  it('reuses an existing word for the same normalized text', async () => {
    const db = createDatabase()
    const first = await saveOccurrence(db, createOccurrenceInput(), 1000)
    const second = await saveOccurrence(
      db,
      createOccurrenceInput({
        selectedText: 'concurrency',
        sentence: 'Go also has concurrency primitives.',
        pageUrl: 'https://go.dev/doc/effective_go',
        pageTitle: 'Effective Go',
        domain: 'go.dev',
      }),
      2000,
    )

    expect(second.created).toBe(true)
    expect(second.word.id).toBe(first.word.id)
    expect(await db.words.count()).toBe(1)
    expect(await db.occurrences.count()).toBe(2)
  })

  it('prevents duplicate occurrences on the same URL, sentence, and selected text', async () => {
    const db = createDatabase()
    const first = await saveOccurrence(db, createOccurrenceInput(), 1000)
    const duplicate = await saveOccurrence(db, createOccurrenceInput(), 2000)

    expect(duplicate.created).toBe(false)
    expect(duplicate.occurrence.id).toBe(first.occurrence.id)
    expect(await db.words.count()).toBe(1)
    expect(await db.occurrences.count()).toBe(1)
  })
})

describe('query helpers', () => {
  it('queries recent words, all words, occurrences by word, and due reviews', async () => {
    const db = createDatabase()
    const first = await saveOccurrence(
      db,
      createOccurrenceInput({ selectedText: 'trait' }),
      1000,
    )
    const second = await saveOccurrence(
      db,
      createOccurrenceInput({
        selectedText: 'closure',
        sentence: 'A closure can capture values from the surrounding scope.',
        pageUrl: 'https://doc.rust-lang.org/book/ch13-01-closures.html',
      }),
      2000,
    )

    const recentWords = await getRecentWords(db)
    const allWords = await getAllWords(db)
    const firstOccurrences = await getOccurrencesByWord(db, first.word.id)
    const dueReviews = await getDueReviews(db, 1500)

    expect(recentWords.map((word) => word.id)).toEqual([
      second.word.id,
      first.word.id,
    ])
    expect(allWords.map((word) => word.normalizedText)).toEqual([
      'closure',
      'trait',
    ])
    expect(firstOccurrences.map((occurrence) => occurrence.wordId)).toEqual([
      first.word.id,
    ])
    expect(dueReviews).toHaveLength(1)
    expect(dueReviews[0]?.wordId).toBe(first.word.id)
  })
})

describe('review helpers', () => {
  it('loads due review cards with word and occurrence context', async () => {
    const db = createDatabase()
    const saved = await saveOccurrence(db, createOccurrenceInput(), 1000)

    const cards = await getReviewCards(db, 1000)

    expect(cards).toHaveLength(1)
    expect(cards[0]?.word.id).toBe(saved.word.id)
    expect(cards[0]?.occurrence?.id).toBe(saved.occurrence.id)
  })

  it('updates review metadata and mastery from outcomes', async () => {
    const db = createDatabase()
    await saveOccurrence(db, createOccurrenceInput(), 1000)
    const [card] = await getReviewCards(db, 1000)

    await recordReviewOutcome(db, card!.review.id, 'remembered', 2000)

    const updatedReview = await db.reviews.get(card!.review.id)
    const updatedWord = await db.words.get(card!.word.id)

    expect(updatedReview?.lastReviewedAt).toBe(2000)
    expect(updatedReview?.intervalDays).toBe(1)
    expect(updatedReview?.dueAt).toBe(2000 + 24 * 60 * 60 * 1000)
    expect(updatedWord?.mastery).toBe('learning')
  })
})

describe('export helpers', () => {
  it('exports all local data as JSON', async () => {
    const db = createDatabase()
    await saveOccurrence(
      db,
      createOccurrenceInput({ definition: 'Doing work at overlapping times.' }),
      1000,
    )

    const exported = JSON.parse(
      await exportAsJson(db, new Date('2026-07-28T00:00:00.000Z')),
    ) as {
      exportedAt: string
      words: Word[]
      occurrences: Occurrence[]
      reviews: Review[]
    }

    expect(exported.exportedAt).toBe('2026-07-28T00:00:00.000Z')
    expect(exported.words).toHaveLength(1)
    expect(exported.occurrences[0]?.definition).toBe(
      'Doing work at overlapping times.',
    )
    expect(exported.reviews).toHaveLength(1)
  })

  it('exports saved marks as readable Markdown', async () => {
    const db = createDatabase()
    await saveOccurrence(
      db,
      createOccurrenceInput({
        selectedText: 'trait',
        sentence: 'A trait defines shared behavior in Rust.',
        definition: 'A Rust abstraction for shared behavior.',
        note: 'Similar to an interface in some contexts.',
      }),
      1000,
    )

    const markdown = await exportAsMarkdown(db)

    expect(markdown).toContain('# ReadTrace Export')
    expect(markdown).toContain('## trait')
    expect(markdown).toContain(
      'Sentence: A trait defines shared behavior in Rust.',
    )
    expect(markdown).toContain(
      'Definition: A Rust abstraction for shared behavior.',
    )
    expect(markdown).toContain(
      'Note: Similar to an interface in some contexts.',
    )
  })

  it('exports saved marks as Obsidian-friendly Markdown', async () => {
    const db = createDatabase()
    await saveOccurrence(
      db,
      createOccurrenceInput({
        selectedText: 'trait',
        sentence: 'A trait defines shared behavior in Rust.',
        definition: 'A Rust abstraction for shared behavior.',
      }),
      1000,
    )

    const markdown = await exportAsObsidianMarkdown(
      db,
      new Date('2026-07-28T00:00:00.000Z'),
    )

    expect(markdown).toContain('source: ReadTrace')
    expect(markdown).toContain('exported: 2026-07-28T00:00:00.000Z')
    expect(markdown).toContain('## [[trait]]')
    expect(markdown).toContain('- mastery:: new')
    expect(markdown).toContain(
      '#### [Fearless Concurrency](https://doc.rust-lang.org/book/ch16-00-concurrency.html)',
    )
    expect(markdown).toContain('  > A trait defines shared behavior in Rust.')
  })
})
