import {
  createCssSelector,
  createParagraphHash,
  createTextQuote,
  extractParagraphText,
  extractSelectedText,
  extractSentence,
} from '../capture/text'
import { findLocatorMatch } from '../capture/locator'
import type {
  DevVocabContentMessage,
  DevVocabPongResponse,
  DevVocabSaveOccurrenceResponse,
  DevVocabSelectionPayload,
  DevVocabSelectionResponse,
} from '../shared/messages'

let popover: HTMLDivElement | null = null
let statusTimer: number | null = null

chrome.runtime.onMessage.addListener(
  (
    message: DevVocabContentMessage,
    _sender,
    sendResponse: (
      response: DevVocabPongResponse | DevVocabSelectionResponse,
    ) => void,
  ) => {
    if (message.type === 'DEVVOCAB_PING') {
      sendResponse({
        type: 'DEVVOCAB_PONG',
        href: window.location.href,
      })

      return false
    }

    if (message.type === 'DEVVOCAB_GET_SELECTION') {
      sendResponse({
        type: 'DEVVOCAB_SELECTION',
        payload: buildSelectionPayload(),
      })

      return false
    }

    if (message.type === 'DEVVOCAB_SAVE_CURRENT_SELECTION') {
      void saveCurrentSelection()
    }

    if (message.type === 'DEVVOCAB_HIGHLIGHT_OCCURRENCE') {
      highlightLocatorMatch(message.locator)
    }

    return false
  },
)

document.addEventListener('mouseup', () => {
  window.setTimeout(showPopoverForSelection, 0)
})

document.addEventListener('selectionchange', () => {
  if (!window.getSelection()?.toString().trim()) {
    hidePopover()
  }
})

function showPopoverForSelection() {
  const capture = extractSelectedText()

  if (!capture) {
    hidePopover()
    return
  }

  const rect = capture.range.getBoundingClientRect()

  if (rect.width === 0 && rect.height === 0) {
    hidePopover()
    return
  }

  ensurePopover()

  if (!popover) {
    return
  }

  popover.textContent = ''
  popover.append(createSaveButton('Save word', saveCurrentSelection))
  popover.hidden = false

  const popoverRect = popover.getBoundingClientRect()
  const left = clamp(rect.left, 8, window.innerWidth - popoverRect.width - 8)
  const rawTop =
    rect.bottom + popoverRect.height + 8 > window.innerHeight
      ? Math.max(8, rect.top - popoverRect.height - 8)
      : rect.bottom + 8
  const top = clamp(rawTop, 8, window.innerHeight - popoverRect.height - 8)

  popover.style.left = `${Math.round(left)}px`
  popover.style.top = `${Math.round(top)}px`
}

async function saveCurrentSelection() {
  const payload = buildSelectionPayload()

  if (!payload) {
    showStatus('No text selected', 'error')
    return
  }

  showStatus('Saving...', 'pending')

  const response = await chrome.runtime.sendMessage({
    type: 'DEVVOCAB_SAVE_OCCURRENCE',
    payload,
  })

  const result = response as DevVocabSaveOccurrenceResponse

  if (result.ok) {
    showStatus(result.created ? 'Saved' : 'Already saved', 'success')
    return
  }

  showStatus(result.error ?? 'Save failed', 'error')
}

function buildSelectionPayload(): DevVocabSelectionPayload | null {
  const capture = extractSelectedText()

  if (!capture) {
    return null
  }

  const paragraphText = extractParagraphText(capture.container)
  const sentence = extractSentence(paragraphText, capture.selectedText)
  const canonicalUrl =
    document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href ||
    undefined

  return {
    selectedText: capture.selectedText,
    sentence,
    paragraphText,
    pageUrl: window.location.href,
    canonicalUrl,
    pageTitle: document.title || window.location.hostname,
    domain: window.location.hostname,
    locator: {
      textQuote: createTextQuote(paragraphText, capture.selectedText),
      cssSelector: createCssSelector(capture.container),
      paragraphHash: createParagraphHash(paragraphText),
    },
  }
}

function ensurePopover() {
  if (popover) {
    return
  }

  injectStyles()
  popover = document.createElement('div')
  popover.className = 'devvocab-popover'
  popover.hidden = true
  document.documentElement.append(popover)
}

function createSaveButton(label: string, onClick: () => void) {
  const button = document.createElement('button')
  button.type = 'button'
  button.textContent = label
  button.addEventListener('mousedown', (event) => {
    event.preventDefault()
  })
  button.addEventListener('click', () => {
    onClick()
  })
  return button
}

function showStatus(message: string, state: 'pending' | 'success' | 'error') {
  ensurePopover()

  if (!popover) {
    return
  }

  popover.textContent = message
  popover.dataset.state = state
  popover.hidden = false

  if (statusTimer) {
    window.clearTimeout(statusTimer)
  }

  statusTimer = window.setTimeout(
    () => {
      hidePopover()
    },
    state === 'pending' ? 1200 : 1800,
  )
}

function hidePopover() {
  if (popover) {
    popover.hidden = true
    popover.removeAttribute('data-state')
  }
}

function highlightLocatorMatch(
  locator: Parameters<typeof findLocatorMatch>[0],
) {
  const match = findLocatorMatch(locator)

  if (!match) {
    return
  }

  match.classList.add('devvocab-highlight')
  match.scrollIntoView({
    behavior: 'smooth',
    block: 'center',
  })

  window.setTimeout(() => {
    match.classList.remove('devvocab-highlight')
  }, 3200)
}

function injectStyles() {
  if (document.getElementById('devvocab-content-styles')) {
    return
  }

  const style = document.createElement('style')
  style.id = 'devvocab-content-styles'
  style.textContent = `
    .devvocab-popover {
      position: fixed;
      z-index: 2147483647;
      border: 1px solid #d0d5dd;
      border-radius: 8px;
      padding: 6px;
      color: #101828;
      background: #ffffff;
      box-shadow: 0 8px 24px rgba(16, 24, 40, 0.18);
      font: 13px/1.3 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    .devvocab-popover[hidden] {
      display: none;
    }

    .devvocab-popover button {
      border: 0;
      border-radius: 6px;
      padding: 7px 10px;
      color: #ffffff;
      background: #116a5c;
      font: inherit;
      cursor: pointer;
    }

    .devvocab-popover[data-state="success"] {
      border-color: #12b76a;
      color: #027a48;
    }

    .devvocab-popover[data-state="error"] {
      border-color: #f04438;
      color: #b42318;
    }

    .devvocab-highlight {
      outline: 3px solid #51c7a8 !important;
      outline-offset: 4px !important;
      transition: outline-color 180ms ease;
    }
  `
  document.documentElement.append(style)
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

console.info('[DevVocab] content script ready')
