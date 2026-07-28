import Dexie, { type EntityTable } from 'dexie'
import type { Locator, Occurrence, Review, Word } from '../shared/models'

export class ReadTraceDatabase extends Dexie {
  words!: EntityTable<Word, 'id'>
  occurrences!: EntityTable<Occurrence, 'id'>
  locators!: EntityTable<Locator, 'occurrenceId'>
  reviews!: EntityTable<Review, 'id'>

  constructor(name = 'devvocab') {
    super(name)

    this.version(1).stores({
      words: 'id, normalizedText, mastery, createdAt, updatedAt',
      occurrences:
        'id, wordId, pageUrl, domain, createdAt, updatedAt, [pageUrl+sentence+selectedText]',
      locators: 'occurrenceId',
      reviews: 'id, wordId, dueAt, lastReviewedAt',
    })
  }
}

export const db = new ReadTraceDatabase()
