import type { DevVocabDatabase } from './database'
import type {
  Locator,
  MasteryState,
  NewOccurrenceInput,
  Occurrence,
  Review,
  ReviewCard,
  ReviewOutcome,
  Word,
  WordWithOccurrences,
} from '../shared/models'
import { normalizeWord } from '../shared/normalize'

export type SaveOccurrenceResult = {
  word: Word
  occurrence: Occurrence
  locator: Locator
  created: boolean
}

export async function saveOccurrence(
  db: DevVocabDatabase,
  input: NewOccurrenceInput,
  now = Date.now(),
): Promise<SaveOccurrenceResult> {
  const normalizedText = normalizeWord(input.selectedText)

  if (!normalizedText) {
    throw new Error('Cannot save an empty word')
  }

  return db.transaction(
    'rw',
    db.words,
    db.occurrences,
    db.locators,
    db.reviews,
    async () => {
      const existingDuplicate = await db.occurrences
        .where('[pageUrl+sentence+selectedText]')
        .equals([input.pageUrl, input.sentence, input.selectedText])
        .first()

      if (existingDuplicate) {
        const [word, locator] = await Promise.all([
          db.words.get(existingDuplicate.wordId),
          db.locators.get(existingDuplicate.id),
        ])

        if (!word || !locator) {
          throw new Error('Duplicate occurrence is missing related records')
        }

        return {
          word,
          occurrence: existingDuplicate,
          locator,
          created: false,
        }
      }

      let word = await db.words
        .where('normalizedText')
        .equals(normalizedText)
        .first()

      if (!word) {
        word = {
          id: crypto.randomUUID(),
          text: input.selectedText.trim(),
          normalizedText,
          language: 'en',
          mastery: 'new',
          createdAt: now,
          updatedAt: now,
        }

        await db.words.add(word)
      }

      const occurrence: Occurrence = {
        id: crypto.randomUUID(),
        wordId: word.id,
        selectedText: input.selectedText,
        sentence: input.sentence,
        paragraphText: input.paragraphText,
        pageUrl: input.pageUrl,
        canonicalUrl: input.canonicalUrl,
        pageTitle: input.pageTitle,
        domain: input.domain,
        definition: input.definition,
        note: input.note,
        createdAt: now,
        updatedAt: now,
      }

      const locator: Locator = {
        occurrenceId: occurrence.id,
        ...input.locator,
      }

      const review: Review = {
        id: crypto.randomUUID(),
        wordId: word.id,
        occurrenceId: occurrence.id,
        dueAt: now,
        intervalDays: 0,
        ease: 2.5,
        lapses: 0,
      }

      await db.occurrences.add(occurrence)
      await db.locators.add(locator)
      await db.reviews.add(review)

      return {
        word,
        occurrence,
        locator,
        created: true,
      }
    },
  )
}

export async function getRecentWords(
  db: DevVocabDatabase,
  limit = 10,
): Promise<Word[]> {
  return db.words.orderBy('updatedAt').reverse().limit(limit).toArray()
}

export async function getAllWords(db: DevVocabDatabase): Promise<Word[]> {
  return db.words.orderBy('normalizedText').toArray()
}

export async function getOccurrencesByWord(
  db: DevVocabDatabase,
  wordId: string,
): Promise<Occurrence[]> {
  return db.occurrences
    .where('wordId')
    .equals(wordId)
    .reverse()
    .sortBy('createdAt')
}

export async function getDueReviews(
  db: DevVocabDatabase,
  now = Date.now(),
): Promise<Review[]> {
  return db.reviews.where('dueAt').belowOrEqual(now).sortBy('dueAt')
}

export async function getReviewCards(
  db: DevVocabDatabase,
  now = Date.now(),
): Promise<ReviewCard[]> {
  const reviews = await getDueReviews(db, now)

  return (
    await Promise.all(
      reviews.map(async (review) => {
        const word = await db.words.get(review.wordId)
        const occurrence = review.occurrenceId
          ? await db.occurrences.get(review.occurrenceId)
          : undefined

        if (!word) {
          return null
        }

        const card: ReviewCard = {
          review,
          word,
        }

        if (occurrence) {
          card.occurrence = occurrence
        }

        return card
      }),
    )
  ).filter((card): card is ReviewCard => Boolean(card))
}

export async function recordReviewOutcome(
  db: DevVocabDatabase,
  reviewId: string,
  outcome: ReviewOutcome,
  now = Date.now(),
): Promise<void> {
  await db.transaction('rw', db.words, db.reviews, async () => {
    const review = await db.reviews.get(reviewId)

    if (!review) {
      return
    }

    const nextInterval =
      outcome === 'remembered' ? Math.max(1, review.intervalDays * 2 || 1) : 0
    const nextDueAt =
      outcome === 'remembered'
        ? now + nextInterval * 24 * 60 * 60 * 1000
        : outcome === 'uncertain'
          ? now + 24 * 60 * 60 * 1000
          : now

    await db.reviews.update(review.id, {
      dueAt: nextDueAt,
      lastReviewedAt: now,
      intervalDays: nextInterval,
      ease:
        outcome === 'remembered'
          ? Math.min(review.ease + 0.1, 3)
          : Math.max(review.ease - 0.2, 1.3),
      lapses: outcome === 'forgotten' ? review.lapses + 1 : review.lapses,
    })

    await db.words.update(review.wordId, {
      mastery:
        outcome === 'remembered' && nextInterval >= 3
          ? 'known'
          : outcome === 'remembered'
            ? 'learning'
            : 'learning',
      updatedAt: now,
    })
  })
}

export async function getOccurrenceWithLocator(
  db: DevVocabDatabase,
  occurrenceId: string,
): Promise<{ occurrence: Occurrence; locator: Locator } | null> {
  const [occurrence, locator] = await Promise.all([
    db.occurrences.get(occurrenceId),
    db.locators.get(occurrenceId),
  ])

  if (!occurrence || !locator) {
    return null
  }

  return {
    occurrence,
    locator,
  }
}

export async function getWordsWithOccurrences(
  db: DevVocabDatabase,
): Promise<WordWithOccurrences[]> {
  const words = await getAllWords(db)

  return Promise.all(
    words.map(async (word) => ({
      word,
      occurrences: await getOccurrencesByWord(db, word.id),
    })),
  )
}

export async function updateWordMastery(
  db: DevVocabDatabase,
  wordId: string,
  mastery: MasteryState,
  now = Date.now(),
): Promise<void> {
  await db.words.update(wordId, {
    mastery,
    updatedAt: now,
  })
}

export async function updateOccurrenceDetails(
  db: DevVocabDatabase,
  occurrenceId: string,
  details: Pick<Occurrence, 'definition' | 'note'>,
  now = Date.now(),
): Promise<void> {
  await db.occurrences.update(occurrenceId, {
    definition: details.definition,
    note: details.note,
    updatedAt: now,
  })
}

export async function deleteOccurrence(
  db: DevVocabDatabase,
  occurrenceId: string,
): Promise<void> {
  await db.transaction(
    'rw',
    db.words,
    db.occurrences,
    db.locators,
    db.reviews,
    async () => {
      const occurrence = await db.occurrences.get(occurrenceId)

      if (!occurrence) {
        return
      }

      await db.occurrences.delete(occurrenceId)
      await db.locators.delete(occurrenceId)
      await db.reviews.where('occurrenceId').equals(occurrenceId).delete()

      const remainingOccurrences = await db.occurrences
        .where('wordId')
        .equals(occurrence.wordId)
        .count()

      if (remainingOccurrences === 0) {
        await db.words.delete(occurrence.wordId)
        await db.reviews.where('wordId').equals(occurrence.wordId).delete()
      }
    },
  )
}

export async function deleteWord(
  db: DevVocabDatabase,
  wordId: string,
): Promise<void> {
  await db.transaction(
    'rw',
    db.words,
    db.occurrences,
    db.locators,
    db.reviews,
    async () => {
      const occurrences = await db.occurrences
        .where('wordId')
        .equals(wordId)
        .toArray()

      await db.occurrences.where('wordId').equals(wordId).delete()
      await db.reviews.where('wordId').equals(wordId).delete()
      await Promise.all(
        occurrences.map((occurrence) => db.locators.delete(occurrence.id)),
      )
      await db.words.delete(wordId)
    },
  )
}
