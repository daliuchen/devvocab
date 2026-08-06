import type { ReadTraceDatabase } from './database'
import type { Locator, Occurrence, Review, Word } from '../shared/models'

export type ReadTraceExport = {
  exportedAt: string
  words: Word[]
  occurrences: Occurrence[]
  locators: Locator[]
  reviews: Review[]
}

export async function exportAsJson(
  db: ReadTraceDatabase,
  now = new Date(),
): Promise<string> {
  const payload: ReadTraceExport = {
    exportedAt: now.toISOString(),
    words: await db.words.toArray(),
    occurrences: await db.occurrences.toArray(),
    locators: await db.locators.toArray(),
    reviews: await db.reviews.toArray(),
  }

  return `${JSON.stringify(payload, null, 2)}\n`
}

export async function exportAsMarkdown(db: ReadTraceDatabase): Promise<string> {
  const words = await db.words.orderBy('normalizedText').toArray()
  const sections = await Promise.all(
    words.map(async (word) => {
      const occurrences = await db.occurrences
        .where('wordId')
        .equals(word.id)
        .toArray()
      const lines = [`## ${word.text}`, '']

      for (const occurrence of occurrences) {
        lines.push(`- Source: [${occurrence.pageTitle}](${occurrence.pageUrl})`)
        lines.push(`  Sentence: ${occurrence.sentence}`)

        if (occurrence.definition) {
          lines.push(`  Definition: ${occurrence.definition}`)
        }

        if (occurrence.note) {
          lines.push(`  Note: ${occurrence.note}`)
        }
      }

      return lines.join('\n')
    }),
  )

  return ['# ReadTrace Export', '', ...sections].join('\n\n').trimEnd() + '\n'
}
