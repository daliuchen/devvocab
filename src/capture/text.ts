const TEXT_CONTAINER_SELECTOR = [
  'article',
  'main',
  'section',
  'p',
  'li',
  'blockquote',
  'td',
  'th',
  'dd',
  'dt',
  'figcaption',
  'pre',
  'code',
  'div',
].join(',')

const ABBREVIATIONS = new Set([
  'e.g.',
  'i.e.',
  'etc.',
  'vs.',
  'mr.',
  'mrs.',
  'dr.',
  'prof.',
])

export type TextQuote = {
  exact: string
  prefix: string
  suffix: string
}

export type SelectionCapture = {
  selectedText: string
  range: Range
  container: Element
}

export function extractSelectedText(
  selection = window.getSelection(),
): SelectionCapture | null {
  if (!selection || selection.rangeCount === 0) {
    return null
  }

  const range = selection.getRangeAt(0)
  const selectedText = normalizeReadableText(selection.toString())

  if (!selectedText) {
    return null
  }

  const container = getNearestTextContainer(range)

  if (!container) {
    return null
  }

  return {
    selectedText,
    range,
    container,
  }
}

export function extractSentence(
  fullText: string,
  selectedText: string,
): string {
  const text = normalizeReadableText(fullText)
  const selected = normalizeReadableText(selectedText)
  const index = findTextIndex(text, selected)

  if (index < 0) {
    return selected
  }

  const start = findSentenceStart(text, index)
  const end = findSentenceEnd(text, index + selected.length)

  return text.slice(start, end).trim()
}

export function extractParagraphText(
  container: Element,
  maxLength = 1500,
): string {
  const text = normalizeReadableText(container.textContent ?? '')

  if (text.length <= maxLength) {
    return text
  }

  return `${text.slice(0, maxLength).trimEnd()}...`
}

export function createTextQuote(
  fullText: string,
  selectedText: string,
  contextLength = 80,
): TextQuote {
  const text = normalizeReadableText(fullText)
  const selected = normalizeReadableText(selectedText)
  const index = findTextIndex(text, selected)

  if (index < 0) {
    return {
      exact: selected,
      prefix: '',
      suffix: '',
    }
  }

  return {
    exact: text.slice(index, index + selected.length),
    prefix: text.slice(Math.max(0, index - contextLength), index),
    suffix: text.slice(
      index + selected.length,
      index + selected.length + contextLength,
    ),
  }
}

export function createParagraphHash(paragraphText: string): string {
  const normalized = normalizeReadableText(paragraphText)
  let hash = 0x811c9dc5

  for (const char of normalized) {
    hash ^= char.charCodeAt(0)
    hash = Math.imul(hash, 0x01000193)
  }

  return (hash >>> 0).toString(16).padStart(8, '0')
}

export function createCssSelector(element: Element): string {
  const parts: string[] = []
  let current: Element | null = element

  while (
    current &&
    current.nodeType === Node.ELEMENT_NODE &&
    current !== document.body
  ) {
    const tagName = current.tagName.toLowerCase()

    if (current.id) {
      parts.unshift(`${tagName}#${cssEscape(current.id)}`)
      break
    }

    const parent: Element | null = current.parentElement

    if (!parent) {
      parts.unshift(tagName)
      break
    }

    const sameTagSiblings = Array.from(
      parent.children as HTMLCollectionOf<Element>,
    ).filter((child) => child.tagName.toLowerCase() === tagName)
    const index = sameTagSiblings.indexOf(current) + 1

    parts.unshift(
      sameTagSiblings.length > 1 ? `${tagName}:nth-of-type(${index})` : tagName,
    )
    current = parent
  }

  return parts.join(' > ')
}

export function getNearestTextContainer(range: Range): Element | null {
  const node = range.commonAncestorContainer
  const element =
    node.nodeType === Node.TEXT_NODE ? node.parentElement : (node as Element)

  if (!element) {
    return null
  }

  return element.closest(TEXT_CONTAINER_SELECTOR) ?? element
}

export function normalizeReadableText(input: string): string {
  return input.replace(/\s+/g, ' ').trim()
}

function findTextIndex(fullText: string, selectedText: string): number {
  const exactIndex = fullText.indexOf(selectedText)

  if (exactIndex >= 0) {
    return exactIndex
  }

  return fullText.toLowerCase().indexOf(selectedText.toLowerCase())
}

function findSentenceStart(text: string, selectedIndex: number): number {
  for (let index = selectedIndex - 1; index >= 0; index -= 1) {
    const char = text[index]

    if (char === '\n') {
      return index + 1
    }

    if (char && '.!?'.includes(char) && !isAbbreviationAt(text, index)) {
      return index + 1
    }
  }

  return 0
}

function findSentenceEnd(text: string, selectedEnd: number): number {
  for (let index = selectedEnd; index < text.length; index += 1) {
    const char = text[index]

    if (char && '.!?'.includes(char) && !isAbbreviationAt(text, index)) {
      return index + 1
    }
  }

  return text.length
}

function isAbbreviationAt(text: string, dotIndex: number): boolean {
  const tokenStart =
    Math.max(
      text.lastIndexOf(' ', dotIndex),
      text.lastIndexOf('\n', dotIndex),
    ) + 1
  const nextSpace = text.indexOf(' ', dotIndex)
  const tokenEnd = nextSpace >= 0 ? nextSpace : text.length
  const token = text
    .slice(tokenStart, tokenEnd)
    .toLowerCase()
    .replace(/[,;:!?]+$/g, '')

  return ABBREVIATIONS.has(token)
}

function cssEscape(value: string): string {
  if (typeof CSS !== 'undefined' && CSS.escape) {
    return CSS.escape(value)
  }

  return value.replace(/[^a-zA-Z0-9_-]/g, '\\$&')
}
