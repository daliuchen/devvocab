import { db } from '../data/database'
import {
  getDueReviews,
  getOccurrenceWithLocator,
  getRecentWords,
  saveOccurrence,
} from '../data/repository'
import type {
  DevVocabBackgroundMessage,
  DevVocabSaveOccurrenceResponse,
  DevVocabStatsResponse,
} from '../shared/messages'

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'devvocab-save-selection',
    title: 'Save to DevVocab',
    contexts: ['selection'],
  })
})

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== 'devvocab-save-selection' || !tab?.id) {
    return
  }

  chrome.tabs.sendMessage(tab.id, { type: 'DEVVOCAB_SAVE_CURRENT_SELECTION' })
})

chrome.runtime.onMessage.addListener(
  (
    message: DevVocabBackgroundMessage,
    _sender,
    sendResponse: (
      response: DevVocabSaveOccurrenceResponse | DevVocabStatsResponse,
    ) => void,
  ) => {
    if (message.type === 'DEVVOCAB_SAVE_OCCURRENCE') {
      saveOccurrence(db, message.payload)
        .then((result) => {
          sendResponse({
            type: 'DEVVOCAB_SAVE_RESULT',
            ok: true,
            created: result.created,
          })
        })
        .catch((error: unknown) => {
          sendResponse({
            type: 'DEVVOCAB_SAVE_RESULT',
            ok: false,
            error:
              error instanceof Error ? error.message : 'Unknown save error',
          })
        })

      return true
    }

    if (message.type === 'DEVVOCAB_GET_STATS') {
      Promise.all([db.words.count(), getDueReviews(db), getRecentWords(db, 3)])
        .then(([totalWords, dueReviews, recentWords]) => {
          sendResponse({
            type: 'DEVVOCAB_STATS',
            totalWords,
            dueReviews: dueReviews.length,
            recentWords: recentWords.map((word) => ({
              id: word.id,
              text: word.text,
              mastery: word.mastery,
            })),
          })
        })
        .catch(() => {
          sendResponse({
            type: 'DEVVOCAB_STATS',
            totalWords: 0,
            dueReviews: 0,
            recentWords: [],
          })
        })

      return true
    }

    if (message.type === 'DEVVOCAB_OPEN_PAGE') {
      const pageUrl = chrome.runtime.getURL(
        message.page === 'vocabulary' ? 'vocabulary.html' : 'review.html',
      )

      chrome.tabs.create({ url: pageUrl })
    }

    if (message.type === 'DEVVOCAB_OPEN_SOURCE') {
      void openSourceOccurrence(message.occurrenceId)
    }

    return false
  },
)

async function openSourceOccurrence(occurrenceId: string) {
  const result = await getOccurrenceWithLocator(db, occurrenceId)

  if (!result) {
    return
  }

  chrome.tabs.create({ url: result.occurrence.pageUrl }, (tab) => {
    if (!tab.id) {
      return
    }

    const tabId = tab.id
    const listener = (
      updatedTabId: number,
      changeInfo: { status?: string },
    ) => {
      if (updatedTabId !== tabId || changeInfo.status !== 'complete') {
        return
      }

      chrome.tabs.onUpdated.removeListener(listener)
      chrome.tabs.sendMessage(tabId, {
        type: 'DEVVOCAB_HIGHLIGHT_OCCURRENCE',
        locator: result.locator,
      })
    }

    chrome.tabs.onUpdated.addListener(listener)
  })
}

console.info('[DevVocab] background service worker ready')

export {}
