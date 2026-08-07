import {
  createCssSelector,
  createParagraphHash,
  createTextQuote,
  extractParagraphText,
  extractSelectedText,
  extractSentence,
  type SelectionCapture,
} from '../capture/text'
import { findLocatorMatch } from '../capture/locator'
import type {
  ReadTraceContentMessage,
  ReadTracePongResponse,
  ReadTraceSaveOccurrenceResponse,
  ReadTraceSelectionPayload,
  ReadTraceSelectionResponse,
} from '../shared/messages'

type HighlightLocator =
  Parameters<typeof findLocatorMatch>[0] | ReadTraceSelectionPayload['locator']

let popover: HTMLDivElement | null = null
let statusTimer: number | null = null
const SOURCE_HIGHLIGHT_DURATION_MS = 60_000
const SOURCE_HIGHLIGHT_RESTORE_INTERVAL_MS = 1_000

chrome.runtime.onMessage.addListener(
  (
    message: ReadTraceContentMessage,
    _sender,
    sendResponse: (
      response: ReadTracePongResponse | ReadTraceSelectionResponse,
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
        payload: getSelectionPayload(),
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
  popover.append(createSaveButton(saveCurrentSelection))
  popover.hidden = false

  const popoverRect = popover.getBoundingClientRect()
  const left = clamp(
    rect.right - popoverRect.width,
    8,
    window.innerWidth - popoverRect.width - 8,
  )
  const rawTop =
    rect.top - popoverRect.height - 8 < 8
      ? rect.bottom + 8
      : rect.top - popoverRect.height - 8
  const top = clamp(rawTop, 8, window.innerHeight - popoverRect.height - 8)

  popover.style.left = `${Math.round(left)}px`
  popover.style.top = `${Math.round(top)}px`
}

async function saveCurrentSelection() {
  const capture = extractSelectedText()
  const payload = capture ? buildSelectionPayload(capture) : null

  if (!payload) {
    showStatus('No text selected', 'error')
    return
  }

  showStatus('Saving...', 'pending')

  const response = await chrome.runtime.sendMessage({
    type: 'DEVVOCAB_SAVE_OCCURRENCE',
    payload,
  })

  const result = response as ReadTraceSaveOccurrenceResponse

  if (result.ok) {
    if (!capture || !highlightSelectionCapture(capture)) {
      highlightLocatorMatch(payload.locator, {
        shouldScroll: false,
        durationMs: null,
      })
    }
    window.getSelection()?.removeAllRanges()
    showStatus(result.created ? 'Saved' : 'Already saved', 'success')
    return
  }

  showStatus(result.error ?? 'Save failed', 'error')
}

function getSelectionPayload(): ReadTraceSelectionPayload | null {
  const capture = extractSelectedText()

  return capture ? buildSelectionPayload(capture) : null
}

function buildSelectionPayload(
  capture: SelectionCapture,
): ReadTraceSelectionPayload {
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

function highlightSelectionCapture(capture: SelectionCapture) {
  try {
    const token = document.createElement('mark')
    token.className = 'devvocab-highlight-token devvocab-highlight-saved'
    capture.range.surroundContents(token)
    return true
  } catch {
    return false
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

function createSaveButton(onClick: () => void) {
  const button = document.createElement('button')
  button.type = 'button'
  button.textContent = '+'
  button.title = 'Save to ReadTrace'
  button.ariaLabel = 'Save selected word to ReadTrace'
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
  locator: HighlightLocator,
  options: {
    shouldScroll?: boolean
    durationMs?: number | null
  } = {},
) {
  const shouldScroll = options.shouldScroll ?? true
  const durationMs = options.durationMs ?? SOURCE_HIGHLIGHT_DURATION_MS
  const expiresAt = durationMs === null ? null : Date.now() + durationMs
  const state = {
    cleanup: () => {},
    target: null as Element | null,
    token: null as HTMLElement | null,
  }

  const applyHighlight = (shouldScroll: boolean) => {
    const match = findLocatorMatch(
      locator as Parameters<typeof findLocatorMatch>[0],
    )

    if (!match) {
      return false
    }

    state.cleanup()
    const token = highlightExactText(match, locator.textQuote.exact)
    const highlightTarget = token ?? match

    highlightTarget.classList.add('devvocab-highlight')

    state.target = highlightTarget
    state.token = token
    state.cleanup = () => {
      if (token?.isConnected) {
        unwrapHighlightToken(token)
        return
      }

      match.classList.remove('devvocab-highlight')
    }

    if (shouldScroll) {
      highlightTarget.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest',
      })
    }

    return true
  }

  if (!applyHighlight(shouldScroll)) {
    return
  }

  const restoreHighlight = () => {
    if (expiresAt !== null && Date.now() >= expiresAt) {
      return
    }

    if (!state.target?.isConnected) {
      applyHighlight(false)
    }
  }

  const observer = new MutationObserver(restoreHighlight)
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  })

  const intervalId = window.setInterval(
    restoreHighlight,
    SOURCE_HIGHLIGHT_RESTORE_INTERVAL_MS,
  )

  if (durationMs !== null) {
    window.setTimeout(() => {
      observer.disconnect()
      window.clearInterval(intervalId)
      state.cleanup()
    }, durationMs)
  }
}

function highlightExactText(root: Element, exactText: string) {
  const exact = exactText.trim().toLowerCase()

  if (!exact) {
    return null
  }

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)

  while (walker.nextNode()) {
    const textNode = walker.currentNode as Text
    const parentElement = textNode.parentElement

    if (!parentElement || !isVisibleNode(parentElement)) {
      continue
    }

    const text = textNode.textContent ?? ''
    const index = text.toLowerCase().indexOf(exact)

    if (index < 0) {
      continue
    }

    const range = document.createRange()
    range.setStart(textNode, index)
    range.setEnd(textNode, index + exactText.trim().length)

    const token = document.createElement('mark')
    token.className = 'devvocab-highlight-token'
    range.surroundContents(token)
    return token
  }

  return null
}

function isVisibleNode(element: HTMLElement) {
  const rect = element.getBoundingClientRect()
  const style = window.getComputedStyle(element)

  return (
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    style.opacity !== '0' &&
    element.getClientRects().length > 0 &&
    rect.width > 0 &&
    rect.height > 0
  )
}

function unwrapHighlightToken(token: HTMLElement) {
  const parent = token.parentNode

  if (!parent) {
    return
  }

  while (token.firstChild) {
    parent.insertBefore(token.firstChild, token)
  }

  token.remove()
  parent.normalize()
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
      border: 1px solid rgba(17, 106, 92, 0.24);
      border-radius: 999px;
      padding: 2px;
      color: #101828;
      background: #ffffff;
      box-shadow: 0 6px 16px rgba(16, 24, 40, 0.14);
      font: 12px/1 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    .devvocab-popover[hidden] {
      display: none;
    }

    .devvocab-popover button {
      display: grid;
      place-items: center;
      width: 30px;
      height: 30px;
      border: 0;
      border-radius: 999px;
      padding: 0;
      color: #ffffff;
      background: #116a5c;
      font: 700 20px/1 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      cursor: pointer;
    }

    .devvocab-popover button:hover {
      background: #0d574d;
    }

    .devvocab-popover[data-state] {
      border-radius: 8px;
      padding: 7px 9px;
      background: #ffffff;
      font: 12px/1.2 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    .devvocab-popover[data-state="success"] {
      border-color: #12b76a;
      color: #027a48;
    }

    .devvocab-popover[data-state="error"] {
      border-color: #f04438;
      color: #b42318;
    }

    .devvocab-highlight,
    .devvocab-highlight-token {
      background: #fff3a3 !important;
      color: inherit !important;
      border-radius: 4px !important;
      box-shadow: 0 0 0 3px rgba(255, 211, 77, 0.7) !important;
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

console.info('[ReadTrace] content script ready')
