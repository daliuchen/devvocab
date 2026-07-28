// @vitest-environment jsdom

import { describe, expect, it } from 'vitest'
import type { Locator } from '../shared/models'
import {
  findFuzzyTextMatch,
  findLocatorMatch,
  findTextQuoteMatch,
} from './locator'

function createLocator(overrides: Partial<Locator> = {}): Locator {
  return {
    occurrenceId: 'occurrence-1',
    textQuote: {
      exact: 'concurrency',
      prefix: 'Rust makes fearless ',
      suffix: ' practical.',
    },
    cssSelector: 'main > p:nth-of-type(2)',
    ...overrides,
  }
}

describe('locator matching', () => {
  it('matches by selector and exact quote', () => {
    document.body.innerHTML =
      '<main><p>Intro.</p><p>Rust makes fearless concurrency practical.</p></main>'

    const match = findLocatorMatch(createLocator())

    expect(match).toBe(document.querySelectorAll('p')[1])
  })

  it('falls back to text quote when selector is missing', () => {
    document.body.innerHTML =
      '<article><p>Rust makes fearless concurrency practical.</p></article>'

    const match = findTextQuoteMatch(createLocator({ cssSelector: undefined }))

    expect(match).toBe(document.querySelector('p'))
  })

  it('falls back to fuzzy matching when surrounding quote changed', () => {
    document.body.innerHTML =
      '<main><p>Rust makes async concurrency approachable.</p></main>'

    const match = findFuzzyTextMatch(createLocator({ cssSelector: '#missing' }))

    expect(match).toBe(document.querySelector('p'))
  })

  it('skips hidden elements when matching source text', () => {
    document.body.innerHTML = `
      <main>
        <p style="display: none">Rust makes fearless concurrency practical.</p>
        <p>Rust makes fearless concurrency practical.</p>
      </main>
    `

    const match = findLocatorMatch(createLocator({ cssSelector: undefined }))

    expect(match).toBe(document.querySelectorAll('p')[1])
  })
})
