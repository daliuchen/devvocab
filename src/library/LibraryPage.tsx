import { useEffect, useMemo, useState } from 'react'
import { db } from '../data/database'
import { exportAsJson, exportAsMarkdown } from '../data/export'
import {
  deleteOccurrence,
  deleteWord,
  getWordsWithOccurrences,
  updateOccurrenceDetails,
} from '../data/repository'
import type { Occurrence, Word, WordWithOccurrences } from '../shared/models'
import './LibraryPage.css'

type SourceMark = {
  word: Word
  occurrence: Occurrence
}

type SourceGroup = {
  sourceKey: string
  pageTitle: string
  domain: string
  latestAt: number
  marks: SourceMark[]
}

function LibraryPage() {
  const [items, setItems] = useState<WordWithOccurrences[]>([])
  const [query, setQuery] = useState('')
  const [selectedSourceUrl, setSelectedSourceUrl] = useState<string | null>(
    null,
  )
  const [selectedOccurrenceId, setSelectedOccurrenceId] = useState<
    string | null
  >(null)
  const [definition, setDefinition] = useState('')
  const [note, setNote] = useState('')
  const [status, setStatus] = useState('')

  useEffect(() => {
    void reloadItems()
  }, [])

  const sourceGroups = useMemo(() => {
    const groups = new Map<string, SourceGroup>()

    for (const { word, occurrences } of items) {
      for (const occurrence of occurrences) {
        const sourceKey = getSourceKey(occurrence)
        const existing = groups.get(sourceKey)
        const mark = { word, occurrence }

        if (!existing) {
          groups.set(sourceKey, {
            sourceKey,
            pageTitle: occurrence.pageTitle,
            domain: occurrence.domain,
            latestAt: occurrence.createdAt,
            marks: [mark],
          })
          continue
        }

        existing.marks.push(mark)
        existing.latestAt = Math.max(existing.latestAt, occurrence.createdAt)
      }
    }

    return Array.from(groups.values()).sort((a, b) => b.latestAt - a.latestAt)
  }, [items])

  const filteredSources = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return sourceGroups.flatMap((source) => {
      if (!normalizedQuery) {
        return [source]
      }

      const matchingMarks = source.marks.filter((mark) =>
        markMatchesQuery(mark, normalizedQuery),
      )

      if (matchingMarks.length > 0) {
        return [
          {
            ...source,
            marks: matchingMarks,
          },
        ]
      }

      return sourceMatchesQuery(source, normalizedQuery) ? [source] : []
    })
  }, [sourceGroups, query])

  const selectedSource =
    filteredSources.find((source) => source.sourceKey === selectedSourceUrl) ??
    filteredSources[0]
  const selectedMark =
    selectedSource?.marks.find(
      ({ occurrence }) => occurrence.id === selectedOccurrenceId,
    ) ?? selectedSource?.marks[0]
  const selectedWord = selectedMark?.word
  const selectedOccurrence = selectedMark?.occurrence

  useEffect(() => {
    setDefinition(selectedOccurrence?.definition ?? '')
    setNote(selectedOccurrence?.note ?? '')
  }, [
    selectedOccurrence?.id,
    selectedOccurrence?.definition,
    selectedOccurrence?.note,
  ])

  async function reloadItems() {
    const nextItems = await getWordsWithOccurrences(db)
    setItems(nextItems)
  }

  async function handleSaveDetails(occurrence: Occurrence) {
    await updateOccurrenceDetails(db, occurrence.id, {
      definition,
      note,
    })
    setStatus('Details saved')
    await reloadItems()
  }

  async function handleDeleteOccurrence(occurrence: Occurrence) {
    if (!window.confirm('Delete this occurrence?')) {
      return
    }

    await deleteOccurrence(db, occurrence.id)
    setSelectedOccurrenceId(null)
    setStatus('Occurrence deleted')
    await reloadItems()
  }

  async function handleDeleteWord(wordId: string) {
    if (!window.confirm('Delete this word and all occurrences?')) {
      return
    }

    await deleteWord(db, wordId)
    setSelectedSourceUrl(null)
    setSelectedOccurrenceId(null)
    setStatus('Word deleted')
    await reloadItems()
  }

  async function handleExport(format: 'json' | 'markdown') {
    const content =
      format === 'json' ? await exportAsJson(db) : await exportAsMarkdown(db)
    const mime = format === 'json' ? 'application/json' : 'text/markdown'
    const extension = format === 'json' ? 'json' : 'md'
    const url = URL.createObjectURL(new Blob([content], { type: mime }))
    const link = document.createElement('a')
    link.href = url
    link.download = `readtrace-export.${extension}`
    link.click()
    URL.revokeObjectURL(url)
  }

  function handleOpenSource(occurrenceId: string) {
    void chrome.runtime.sendMessage({
      type: 'DEVVOCAB_OPEN_SOURCE',
      occurrenceId,
    })
  }

  return (
    <main className="page-shell">
      <header className="page-header">
        <div>
          <p className="page-kicker">ReadTrace Library</p>
          <h1 className="page-title">Reading sources and saved marks</h1>
          <p className="page-description">
            Browse the pages you read, inspect saved words in context, and jump
            back to the original sentence.
          </p>
        </div>

        <div className="toolbar" aria-label="Library controls">
          <input
            className="search-input"
            type="search"
            placeholder="Search words or context"
            aria-label="Search words or context"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
      </header>

      <section className="export-actions" aria-label="Export actions">
        <button type="button" onClick={() => void handleExport('json')}>
          Export JSON
        </button>
        <button type="button" onClick={() => void handleExport('markdown')}>
          Export Markdown
        </button>
        {status && <span>{status}</span>}
      </section>

      {filteredSources.length === 0 ? (
        <section className="empty-state">
          <h2>No saved marks yet</h2>
          <p>
            Select words while reading technical pages and ReadTrace will group
            them by source here.
          </p>
        </section>
      ) : (
        <section className="library-layout">
          <div className="source-list" aria-label="Reading sources">
            <div className="panel-heading">
              <span>Sources</span>
              <small>{filteredSources.length}</small>
            </div>
            {filteredSources.map((source) => (
              <button
                className="source-row"
                data-selected={source.sourceKey === selectedSource?.sourceKey}
                key={source.sourceKey}
                type="button"
                onClick={() => {
                  setSelectedSourceUrl(source.sourceKey)
                  setSelectedOccurrenceId(null)
                }}
              >
                <span>
                  <strong>{source.pageTitle}</strong>
                  <small>{source.domain}</small>
                </span>
                <em>{source.marks.length} marks</em>
              </button>
            ))}
          </div>

          {selectedSource && selectedWord && selectedOccurrence && (
            <div className="mark-list" aria-label="Source marks">
              <div className="panel-heading">
                <span>Marks</span>
                <small>{selectedSource.marks.length}</small>
              </div>
              {selectedSource.marks.map(({ word, occurrence }) => (
                <button
                  className="mark-row"
                  data-selected={occurrence.id === selectedOccurrence.id}
                  key={occurrence.id}
                  type="button"
                  onClick={() => setSelectedOccurrenceId(occurrence.id)}
                >
                  <strong>{word.text}</strong>
                  <span>{occurrence.sentence}</span>
                </button>
              ))}
            </div>
          )}

          {selectedSource && selectedWord && selectedOccurrence && (
            <article className="word-detail">
              <div className="detail-header">
                <div>
                  <p className="page-kicker">Selected mark</p>
                  <button
                    className="word-title-button"
                    type="button"
                    title="Open the original page and highlight this occurrence"
                    onClick={() => handleOpenSource(selectedOccurrence.id)}
                  >
                    {selectedWord.text}
                  </button>
                </div>
              </div>

              <div className="source-summary">
                <span>{selectedSource.domain}</span>
                <strong>{selectedSource.pageTitle}</strong>
              </div>

              <blockquote>{selectedOccurrence.sentence}</blockquote>
              <div className="source-actions">
                <button
                  className="source-open-button"
                  type="button"
                  onClick={() => handleOpenSource(selectedOccurrence.id)}
                >
                  Open source
                </button>
                <button
                  className="source-link"
                  type="button"
                  onClick={() => handleOpenSource(selectedOccurrence.id)}
                >
                  {selectedOccurrence.pageTitle}
                </button>
              </div>
              <p className="meta-line">
                {selectedOccurrence.domain} ·{' '}
                {new Date(selectedOccurrence.createdAt).toLocaleString()}
              </p>

              <label className="field">
                Definition
                <textarea
                  value={definition}
                  onChange={(event) => setDefinition(event.target.value)}
                />
              </label>

              <label className="field">
                Note
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                />
              </label>

              <div className="detail-actions">
                <button
                  type="button"
                  onClick={() => void handleSaveDetails(selectedOccurrence)}
                >
                  Save details
                </button>
                <button
                  type="button"
                  onClick={() =>
                    void handleDeleteOccurrence(selectedOccurrence)
                  }
                >
                  Delete occurrence
                </button>
                <button
                  type="button"
                  onClick={() => void handleDeleteWord(selectedWord.id)}
                >
                  Delete word
                </button>
              </div>
            </article>
          )}
        </section>
      )}
    </main>
  )
}

function markMatchesQuery(mark: SourceMark, normalizedQuery: string) {
  return [
    mark.word.text,
    mark.word.normalizedText,
    mark.occurrence.sentence,
    mark.occurrence.pageTitle,
    mark.occurrence.domain,
    mark.occurrence.pageUrl,
    mark.occurrence.definition,
    mark.occurrence.note,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .includes(normalizedQuery)
}

function sourceMatchesQuery(source: SourceGroup, normalizedQuery: string) {
  return [source.pageTitle, source.domain, source.sourceKey]
    .join(' ')
    .toLowerCase()
    .includes(normalizedQuery)
}

function getSourceKey(occurrence: Occurrence) {
  return occurrence.canonicalUrl ?? stripUrlHash(occurrence.pageUrl)
}

function stripUrlHash(url: string) {
  try {
    const parsed = new URL(url)
    parsed.hash = ''
    return parsed.toString()
  } catch {
    return url
  }
}

export default LibraryPage
