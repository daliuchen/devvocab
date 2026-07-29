import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { chromium } from 'playwright-core'

const extensionPath = resolve('dist')
const outputPath = resolve('plans/QA_SMOKE_RESULTS.json')

const sites = [
  {
    name: 'MDN',
    url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
  },
  {
    name: 'React Docs',
    url: 'https://react.dev/learn',
  },
  {
    name: 'GitHub README',
    url: 'https://github.com/facebook/react',
  },
  {
    name: 'Engineering Blog',
    url: 'https://web.dev/articles',
  },
]

const profileDir = await mkdtemp(join(tmpdir(), 'readtrace-qa-profile-'))
await mkdir(profileDir, { recursive: true })

const results = {
  generatedAt: new Date().toISOString(),
  profileDir,
  extensionId: '',
  sites: [],
  resilience: {
    beforeRestartCount: 0,
    afterRestartCount: 0,
    passed: false,
  },
  management: {
    sourceRows: 0,
    markRows: 0,
    detailVisible: false,
    searchReturnedMarks: false,
    reopenHighlighted: false,
    reopenHighlightRestored: false,
    reopenHighlightPersisted: false,
  },
  review: {
    loaded: false,
    revealed: false,
    outcomeRecorded: false,
  },
}

let context = await launchContext(profileDir)
let extensionId = await resolveExtensionId(context)
results.extensionId = extensionId

for (const site of sites) {
  const page = await context.newPage()
  const siteResult = {
    name: site.name,
    url: site.url,
    capture: false,
    popover: false,
    save: false,
    isolation: false,
    selectedText: '',
    error: '',
  }

  try {
    await page.goto(site.url, { waitUntil: 'domcontentloaded', timeout: 45000 })
    await page
      .waitForLoadState('networkidle', { timeout: 10000 })
      .catch(() => {})

    const selection = await selectReadableWord(page)
    siteResult.capture = Boolean(selection?.selectedText)
    siteResult.selectedText = selection?.selectedText ?? ''

    const beforeMetrics = await getLayoutMetrics(page)
    const popover = page.locator('.devvocab-popover')
    await popover.waitFor({ state: 'visible', timeout: 5000 })
    siteResult.popover = true
    const popoverBox = await popover.boundingBox()

    await popover.locator('button').click()
    await page.waitForSelector('.devvocab-popover[data-state="success"]', {
      timeout: 5000,
    })
    siteResult.save = true

    const afterMetrics = await getLayoutMetrics(page)
    siteResult.isolation =
      popoverInViewport(popoverBox, page.viewportSize()) &&
      metricsClose(beforeMetrics, afterMetrics)
  } catch (error) {
    siteResult.error = error instanceof Error ? error.message : String(error)
  } finally {
    results.sites.push(siteResult)
    await page.close().catch(() => {})
  }
}

const libraryPage = await context.newPage()
await libraryPage.goto(`chrome-extension://${extensionId}/library.html`)
await libraryPage.waitForLoadState('domcontentloaded')
await libraryPage.waitForTimeout(1000)
results.management.sourceRows = await libraryPage.locator('.source-row').count()
results.management.markRows = await libraryPage.locator('.mark-row').count()
results.management.detailVisible = await libraryPage
  .locator('.word-detail blockquote')
  .isVisible()
results.resilience.beforeRestartCount = results.management.sourceRows
const firstMarkText = await libraryPage
  .locator('.mark-row strong')
  .first()
  .textContent()

if (firstMarkText) {
  await libraryPage.locator('.search-input').fill(firstMarkText)
  await libraryPage.waitForTimeout(300)
  results.management.searchReturnedMarks =
    (await libraryPage.locator('.mark-row').count()) > 0
  await libraryPage.locator('.search-input').fill('')
  await libraryPage.waitForTimeout(300)
}

const sourcePagePromise = context.waitForEvent('page')
await libraryPage.locator('.source-link').click()
const sourcePage = await sourcePagePromise
await sourcePage.waitForLoadState('domcontentloaded')
await sourcePage.locator('.devvocab-highlight-token').first().waitFor({
  state: 'visible',
  timeout: 10000,
})
await sourcePage.evaluate(() => {
  const token = document.querySelector('.devvocab-highlight-token')
  const parent = token?.parentNode

  if (!token || !parent) {
    return
  }

  while (token.firstChild) {
    parent.insertBefore(token.firstChild, token)
  }

  token.remove()
  parent.normalize()
})
await sourcePage.locator('.devvocab-highlight-token').first().waitFor({
  state: 'visible',
  timeout: 5000,
})
results.management.reopenHighlightRestored = true
await sourcePage.waitForTimeout(13000)
results.management.reopenHighlightPersisted = await sourcePage
  .locator('.devvocab-highlight-token')
  .first()
  .isVisible()
results.management.reopenHighlighted = true
await sourcePage.close().catch(() => {})

const reviewPage = await context.newPage()
await reviewPage.goto(`chrome-extension://${extensionId}/review.html`)
await reviewPage.waitForLoadState('domcontentloaded')
results.review.loaded = await reviewPage.locator('.review-card h2').isVisible()
await reviewPage.locator('.reveal-button').click()
results.review.revealed = await reviewPage.locator('.review-back').isVisible()
await reviewPage.getByRole('button', { name: 'Remembered' }).click()
await reviewPage.waitForTimeout(300)
results.review.outcomeRecorded = true
await reviewPage.close()

await libraryPage.close()
await context.close()

context = await launchContext(profileDir)
extensionId = await resolveExtensionId(context)
const afterRestartLibraryPage = await context.newPage()
await afterRestartLibraryPage.goto(
  `chrome-extension://${extensionId}/library.html`,
)
await afterRestartLibraryPage.waitForLoadState('domcontentloaded')
await afterRestartLibraryPage.waitForTimeout(1000)
results.resilience.afterRestartCount = await afterRestartLibraryPage
  .locator('.source-row')
  .count()
results.resilience.passed =
  results.resilience.beforeRestartCount > 0 &&
  results.resilience.afterRestartCount === results.resilience.beforeRestartCount
await afterRestartLibraryPage.close()

await writeFile(outputPath, `${JSON.stringify(results, null, 2)}\n`)
await context.close()

const failedSites = results.sites.filter(
  (site) => !site.capture || !site.popover || !site.save || !site.isolation,
)

if (
  failedSites.length > 0 ||
  !results.resilience.passed ||
  results.management.markRows === 0 ||
  !results.management.detailVisible ||
  !results.management.searchReturnedMarks ||
  !results.management.reopenHighlighted ||
  !results.management.reopenHighlightRestored ||
  !results.management.reopenHighlightPersisted ||
  !results.review.loaded ||
  !results.review.revealed ||
  !results.review.outcomeRecorded
) {
  console.error(await readFile(outputPath, 'utf8'))
  process.exit(1)
}

console.log(await readFile(outputPath, 'utf8'))

async function launchContext(userDataDir) {
  return chromium.launchPersistentContext(userDataDir, {
    headless: false,
    ignoreDefaultArgs: ['--disable-extensions'],
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      '--no-first-run',
      '--disable-default-apps',
    ],
    viewport: {
      width: 1360,
      height: 900,
    },
  })
}

async function resolveExtensionId(browserContext) {
  let [serviceWorker] = browserContext.serviceWorkers()

  if (!serviceWorker) {
    serviceWorker = await browserContext.waitForEvent('serviceworker', {
      timeout: 10000,
    })
  }

  return new URL(serviceWorker.url()).host
}

async function selectReadableWord(page) {
  return page.evaluate(() => {
    const ignoredTags = new Set([
      'SCRIPT',
      'STYLE',
      'NOSCRIPT',
      'TEXTAREA',
      'INPUT',
    ])
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          const parent = node.parentElement

          if (!parent || ignoredTags.has(parent.tagName)) {
            return NodeFilter.FILTER_REJECT
          }

          const text = node.textContent ?? ''

          if (!/[A-Za-z]{5,}/.test(text)) {
            return NodeFilter.FILTER_REJECT
          }

          const rect = parent.getBoundingClientRect()

          if (rect.width < 60 || rect.height < 12) {
            return NodeFilter.FILTER_REJECT
          }

          return NodeFilter.FILTER_ACCEPT
        },
      },
    )

    while (walker.nextNode()) {
      const node = walker.currentNode
      const text = node.textContent ?? ''
      const match = /\b[A-Za-z]{6,}\b/.exec(text)

      if (!match) {
        continue
      }

      const range = document.createRange()
      range.setStart(node, match.index)
      range.setEnd(node, match.index + match[0].length)

      const selection = window.getSelection()
      selection?.removeAllRanges()
      selection?.addRange(range)

      node.parentElement?.scrollIntoView({ block: 'center' })
      node.parentElement?.dispatchEvent(
        new MouseEvent('mouseup', { bubbles: true }),
      )
      document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))

      const element = node.parentElement
      const selector = element ? buildSelector(element) : 'body'
      const box = element?.getBoundingClientRect()

      return {
        selectedText: match[0],
        targetSelector: selector,
        targetBox: box
          ? {
              x: box.x,
              y: box.y,
              width: box.width,
              height: box.height,
            }
          : null,
      }
    }

    return null

    function buildSelector(element) {
      if (element.id) {
        return `${element.tagName.toLowerCase()}#${CSS.escape(element.id)}`
      }

      const path = []
      let current = element

      while (current && current !== document.body && path.length < 4) {
        const tag = current.tagName.toLowerCase()
        const siblings = [...current.parentElement.children].filter(
          (sibling) => sibling.tagName === current.tagName,
        )
        const index = siblings.indexOf(current) + 1
        path.unshift(siblings.length > 1 ? `${tag}:nth-of-type(${index})` : tag)
        current = current.parentElement
      }

      return path.join(' > ') || 'body'
    }
  })
}

async function getLayoutMetrics(page) {
  return page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    scrollHeight: document.documentElement.scrollHeight,
    clientWidth: document.documentElement.clientWidth,
    clientHeight: document.documentElement.clientHeight,
  }))
}

function popoverInViewport(box, viewport) {
  if (!box || !viewport) {
    return false
  }

  return (
    box.x >= 0 &&
    box.y >= 0 &&
    box.x + box.width <= viewport.width &&
    box.y + box.height <= viewport.height
  )
}

function metricsClose(before, after) {
  return (
    Math.abs(before.scrollWidth - after.scrollWidth) < 2 &&
    Math.abs(before.scrollHeight - after.scrollHeight) < 2 &&
    before.clientWidth === after.clientWidth &&
    before.clientHeight === after.clientHeight
  )
}
