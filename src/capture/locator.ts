import type { Locator } from '../shared/models'
import { normalizeReadableText } from './text'

export function findLocatorMatch(
  locator: Locator,
  root: ParentNode = document,
): Element | null {
  const selectorMatch = findSelectorMatch(locator, root)

  if (selectorMatch) {
    return selectorMatch
  }

  return findTextQuoteMatch(locator, root) ?? findFuzzyTextMatch(locator, root)
}

export function findSelectorMatch(
  locator: Locator,
  root: ParentNode = document,
): Element | null {
  if (!locator.cssSelector) {
    return null
  }

  const candidate = root.querySelector(locator.cssSelector)

  if (!candidate) {
    return null
  }

  return isVisibleElement(candidate) && elementContainsQuote(candidate, locator)
    ? candidate
    : null
}

export function findTextQuoteMatch(
  locator: Locator,
  root: ParentNode = document,
): Element | null {
  const walker = document.createTreeWalker(
    getWalkerRoot(root),
    NodeFilter.SHOW_ELEMENT,
  )
  let match: Element | null = null

  while (walker.nextNode()) {
    const element = walker.currentNode as Element

    if (isVisibleElement(element) && elementContainsQuote(element, locator)) {
      match = element
    }
  }

  return match
}

export function findFuzzyTextMatch(
  locator: Locator,
  root: ParentNode = document,
): Element | null {
  const exact = normalizeReadableText(locator.textQuote.exact).toLowerCase()

  if (!exact) {
    return null
  }

  const walker = document.createTreeWalker(
    getWalkerRoot(root),
    NodeFilter.SHOW_ELEMENT,
  )
  let match: Element | null = null

  while (walker.nextNode()) {
    const element = walker.currentNode as Element
    const text = normalizeReadableText(element.textContent ?? '').toLowerCase()

    if (isVisibleElement(element) && text.includes(exact)) {
      match = element
    }
  }

  return match
}

function elementContainsQuote(element: Element, locator: Locator): boolean {
  const text = normalizeReadableText(element.textContent ?? '')
  const exact = normalizeReadableText(locator.textQuote.exact)
  const prefix = normalizeReadableText(locator.textQuote.prefix)
  const suffix = normalizeReadableText(locator.textQuote.suffix)
  const exactIndex = text.toLowerCase().indexOf(exact.toLowerCase())

  if (exactIndex < 0) {
    return false
  }

  const before = normalizeReadableText(text.slice(0, exactIndex))
  const after = normalizeReadableText(text.slice(exactIndex + exact.length))

  return (
    (!prefix || before.endsWith(prefix)) &&
    (!suffix || after.toLowerCase().startsWith(suffix.toLowerCase()))
  )
}

function getWalkerRoot(root: ParentNode): Node {
  return root.nodeType === Node.DOCUMENT_NODE ? document.body : (root as Node)
}

function isVisibleElement(element: Element): boolean {
  const checkVisibility = (
    element as Element & {
      checkVisibility?: (options?: {
        checkOpacity?: boolean
        checkVisibilityCSS?: boolean
      }) => boolean
    }
  ).checkVisibility

  const isJsdom = window.navigator.userAgent.toLowerCase().includes('jsdom')
  const rect = element.getBoundingClientRect()

  if (checkVisibility) {
    return (
      checkVisibility.call(element, {
        checkOpacity: true,
        checkVisibilityCSS: true,
      }) &&
      (isJsdom ||
        (element.getClientRects().length > 0 &&
          rect.width > 0 &&
          rect.height > 0))
    )
  }

  const style = window.getComputedStyle(element)

  return (
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    style.opacity !== '0' &&
    (isJsdom ||
      (element.getClientRects().length > 0 &&
        rect.width > 0 &&
        rect.height > 0))
  )
}
