import type { Locator, NewOccurrenceInput } from './models'

export type DevVocabPingMessage = {
  type: 'DEVVOCAB_PING'
}

export type DevVocabPongResponse = {
  type: 'DEVVOCAB_PONG'
  href: string
}

export type DevVocabGetSelectionMessage = {
  type: 'DEVVOCAB_GET_SELECTION'
}

export type DevVocabSaveSelectionMessage = {
  type: 'DEVVOCAB_SAVE_CURRENT_SELECTION'
}

export type DevVocabSelectionPayload = NewOccurrenceInput

export type DevVocabSelectionResponse = {
  type: 'DEVVOCAB_SELECTION'
  payload: DevVocabSelectionPayload | null
}

export type DevVocabSaveOccurrenceMessage = {
  type: 'DEVVOCAB_SAVE_OCCURRENCE'
  payload: DevVocabSelectionPayload
}

export type DevVocabSaveOccurrenceResponse = {
  type: 'DEVVOCAB_SAVE_RESULT'
  ok: boolean
  created?: boolean
  error?: string
}

export type DevVocabGetStatsMessage = {
  type: 'DEVVOCAB_GET_STATS'
}

export type DevVocabStatsResponse = {
  type: 'DEVVOCAB_STATS'
  totalWords: number
  dueReviews: number
  recentWords: Array<{
    id: string
    text: string
    mastery: string
  }>
}

export type DevVocabOpenPageMessage = {
  type: 'DEVVOCAB_OPEN_PAGE'
  page: 'vocabulary' | 'review'
}

export type DevVocabOpenSourceMessage = {
  type: 'DEVVOCAB_OPEN_SOURCE'
  occurrenceId: string
}

export type DevVocabHighlightOccurrenceMessage = {
  type: 'DEVVOCAB_HIGHLIGHT_OCCURRENCE'
  locator: Locator
}

export type DevVocabContentMessage =
  | DevVocabPingMessage
  | DevVocabGetSelectionMessage
  | DevVocabSaveSelectionMessage
  | DevVocabHighlightOccurrenceMessage

export type DevVocabBackgroundMessage =
  | DevVocabSaveOccurrenceMessage
  | DevVocabGetStatsMessage
  | DevVocabOpenPageMessage
  | DevVocabOpenSourceMessage
