// @vitest-environment jsdom

import { describe, expect, it } from 'vitest'
import {
  createCssSelector,
  createParagraphHash,
  createTextQuote,
  extractParagraphText,
  extractSelectedText,
  extractSentence,
  normalizeReadableText,
} from './text'

function selectTextByNodeText(text: string) {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)

  while (walker.nextNode()) {
    const node = walker.currentNode
    const index = node.textContent?.indexOf(text) ?? -1

    if (index >= 0) {
      const range = document.createRange()
      range.setStart(node, index)
      range.setEnd(node, index + text.length)

      const selection = window.getSelection()
      selection?.removeAllRanges()
      selection?.addRange(range)
      return
    }
  }

  throw new Error(`Unable to find text: ${text}`)
}

describe('extractSelectedText', () => {
  it('reads active selection and rejects empty selections', () => {
    document.body.innerHTML =
      '<main><p>Rust makes fearless concurrency practical.</p></main>'

    expect(extractSelectedText()).toBeNull()

    selectTextByNodeText('concurrency')
    const capture = extractSelectedText()

    expect(capture?.selectedText).toBe('concurrency')
    expect(capture?.container.tagName).toBe('P')
  })

  it('works when selected text is inside nested inline elements', () => {
    document.body.innerHTML =
      '<article><p>A <strong>closure</strong> can capture values from scope.</p></article>'

    selectTextByNodeText('closure')
    const capture = extractSelectedText()

    expect(capture?.selectedText).toBe('closure')
    expect(capture?.container.tagName).toBe('P')
  })
})

describe('extractSentence', () => {
  it('returns the sentence containing selected text', () => {
    const paragraph =
      'Read the docs first. Rust makes fearless concurrency practical. Ship it.'

    expect(extractSentence(paragraph, 'concurrency')).toBe(
      'Rust makes fearless concurrency practical.',
    )
  })

  it('handles common abbreviation punctuation', () => {
    const paragraph =
      'Some primitives, e.g. mutexes and channels, coordinate shared state. Threads still need care.'

    expect(extractSentence(paragraph, 'channels')).toBe(
      'Some primitives, e.g. mutexes and channels, coordinate shared state.',
    )
  })
})

describe('extractParagraphText', () => {
  it('normalizes nested inline text and limits long paragraphs', () => {
    document.body.innerHTML =
      '<p>TypeScript <code>type guards</code> narrow values safely. ' +
      'x'.repeat(1600) +
      '</p>'

    const paragraph = extractParagraphText(document.querySelector('p')!)

    expect(
      paragraph.startsWith('TypeScript type guards narrow values safely.'),
    ).toBe(true)
    expect(paragraph.length).toBeLessThanOrEqual(1503)
    expect(paragraph.endsWith('...')).toBe(true)
  })
})

describe('createTextQuote', () => {
  it('creates exact text with prefix and suffix', () => {
    const quote = createTextQuote(
      'Rust makes fearless concurrency practical.',
      'concurrency',
      15,
    )

    expect(quote).toEqual({
      exact: 'concurrency',
      prefix: 'makes fearless ',
      suffix: ' practical.',
    })
  })
})

describe('createCssSelector', () => {
  it('creates a selector that resolves back to the source element', () => {
    document.body.innerHTML =
      '<main><section><p>First paragraph.</p><p>Second paragraph.</p></section></main>'
    const paragraph = document.querySelectorAll('p')[1]!
    const selector = createCssSelector(paragraph)

    expect(document.querySelector(selector)).toBe(paragraph)
    expect(selector).toBe('main > section > p:nth-of-type(2)')
  })
})

describe('createParagraphHash', () => {
  it('is stable across whitespace-only changes', () => {
    expect(
      createParagraphHash('Rust makes fearless concurrency practical.'),
    ).toBe(
      createParagraphHash(' Rust   makes fearless\nconcurrency practical. '),
    )
  })
})

describe('normalizeReadableText', () => {
  it('collapses whitespace and trims text', () => {
    expect(normalizeReadableText('  A  trait\n defines behavior.  ')).toBe(
      'A trait defines behavior.',
    )
  })
})
