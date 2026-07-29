import type { Locator, NewOccurrenceInput } from './models'

export type ReadTracePingMessage = {
  type: 'DEVVOCAB_PING'
}

export type ReadTracePongResponse = {
  type: 'DEVVOCAB_PONG'
  href: string
}

export type ReadTraceGetSelectionMessage = {
  type: 'DEVVOCAB_GET_SELECTION'
}

export type ReadTraceSaveSelectionMessage = {
  type: 'DEVVOCAB_SAVE_CURRENT_SELECTION'
}

export type ReadTraceSelectionPayload = NewOccurrenceInput

export type ReadTraceSelectionResponse = {
  type: 'DEVVOCAB_SELECTION'
  payload: ReadTraceSelectionPayload | null
}

export type ReadTraceSaveOccurrenceMessage = {
  type: 'DEVVOCAB_SAVE_OCCURRENCE'
  payload: ReadTraceSelectionPayload
}

export type ReadTraceSaveOccurrenceResponse = {
  type: 'DEVVOCAB_SAVE_RESULT'
  ok: boolean
  created?: boolean
  error?: string
}

export type ReadTraceGetStatsMessage = {
  type: 'DEVVOCAB_GET_STATS'
}

export type ReadTraceStatsResponse = {
  type: 'DEVVOCAB_STATS'
  totalWords: number
  dueReviews: number
  recentWords: Array<{
    id: string
    text: string
    mastery: string
  }>
}

export type ReadTraceOpenPageMessage = {
  type: 'DEVVOCAB_OPEN_PAGE'
  page: 'library' | 'review' | 'library'
}

export type ReadTraceOpenSourceMessage = {
  type: 'DEVVOCAB_OPEN_SOURCE'
  occurrenceId: string
}

export type ReadTraceHighlightOccurrenceMessage = {
  type: 'DEVVOCAB_HIGHLIGHT_OCCURRENCE'
  locator: Locator
}

export type ReadTraceContentMessage =
  | ReadTracePingMessage
  | ReadTraceGetSelectionMessage
  | ReadTraceSaveSelectionMessage
  | ReadTraceHighlightOccurrenceMessage

export type ReadTraceBackgroundMessage =
  | ReadTraceSaveOccurrenceMessage
  | ReadTraceGetStatsMessage
  | ReadTraceOpenPageMessage
  | ReadTraceOpenSourceMessage
