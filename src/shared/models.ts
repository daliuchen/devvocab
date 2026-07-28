export type MasteryState = 'new' | 'learning' | 'known'

export type Word = {
  id: string
  text: string
  normalizedText: string
  language: 'en'
  mastery: MasteryState
  createdAt: number
  updatedAt: number
}

export type Occurrence = {
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

export type Locator = {
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

export type Review = {
  id: string
  wordId: string
  occurrenceId?: string
  dueAt: number
  lastReviewedAt?: number
  intervalDays: number
  ease: number
  lapses: number
}

export type NewOccurrenceInput = {
  selectedText: string
  sentence: string
  paragraphText?: string
  pageUrl: string
  canonicalUrl?: string
  pageTitle: string
  domain: string
  definition?: string
  note?: string
  locator: Omit<Locator, 'occurrenceId'>
}

export type WordWithOccurrences = {
  word: Word
  occurrences: Occurrence[]
}

export type ReviewCard = {
  review: Review
  word: Word
  occurrence?: Occurrence
}

export type ReviewOutcome = 'remembered' | 'uncertain' | 'forgotten'
