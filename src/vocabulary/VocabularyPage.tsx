import { useEffect, useMemo, useState } from 'react'
import { db } from '../data/database'
import { exportAsJson, exportAsMarkdown } from '../data/export'
import {
  deleteOccurrence,
  deleteWord,
  getWordsWithOccurrences,
  updateOccurrenceDetails,
  updateWordMastery,
} from '../data/repository'
import type {
  MasteryState,
  Occurrence,
  WordWithOccurrences,
} from '../shared/models'
import './VocabularyPage.css'

function VocabularyPage() {
  const [items, setItems] = useState<WordWithOccurrences[]>([])
  const [query, setQuery] = useState('')
  const [masteryFilter, setMasteryFilter] = useState<'all' | MasteryState>(
    'all',
  )
  const [selectedWordId, setSelectedWordId] = useState<string | null>(null)
  const [selectedOccurrenceId, setSelectedOccurrenceId] = useState<
    string | null
  >(null)
  const [definition, setDefinition] = useState('')
  const [note, setNote] = useState('')
  const [status, setStatus] = useState('')

  useEffect(() => {
    void reloadItems()
  }, [])

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return items.filter(({ word, occurrences }) => {
      if (masteryFilter !== 'all' && word.mastery !== masteryFilter) {
        return false
      }

      if (!normalizedQuery) {
        return true
      }

      return [
        word.text,
        word.normalizedText,
        ...occurrences.flatMap((occurrence) => [
          occurrence.sentence,
          occurrence.pageTitle,
          occurrence.domain,
        ]),
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery)
    })
  }, [items, masteryFilter, query])

  const selectedItem =
    filteredItems.find((item) => item.word.id === selectedWordId) ??
    filteredItems[0]
  const selectedOccurrence =
    selectedItem?.occurrences.find(
      (occurrence) => occurrence.id === selectedOccurrenceId,
    ) ?? selectedItem?.occurrences[0]

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

  async function handleMasteryChange(wordId: string, mastery: MasteryState) {
    await updateWordMastery(db, wordId, mastery)
    setStatus('Mastery updated')
    await reloadItems()
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
    setSelectedWordId(null)
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
          <p className="page-kicker">Vocabulary</p>
          <h1 className="page-title">Saved technical words</h1>
          <p className="page-description">
            Search, filter, and revisit the words captured from technical
            articles.
          </p>
        </div>

        <div className="toolbar" aria-label="Vocabulary controls">
          <input
            className="search-input"
            type="search"
            placeholder="Search words or context"
            aria-label="Search words or context"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <select
            className="filter-select"
            aria-label="Filter by mastery"
            value={masteryFilter}
            onChange={(event) =>
              setMasteryFilter(event.target.value as 'all' | MasteryState)
            }
          >
            <option value="all">All states</option>
            <option value="new">New</option>
            <option value="learning">Learning</option>
            <option value="known">Known</option>
          </select>
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

      {filteredItems.length === 0 ? (
        <section className="empty-state">
          <h2>No saved words yet</h2>
          <p>
            Once capture is implemented, selected words and their original
            sentences will appear here.
          </p>
        </section>
      ) : (
        <section className="vocabulary-layout">
          <div className="word-list" aria-label="Saved words">
            {filteredItems.map(({ word, occurrences }) => (
              <button
                className="word-row"
                data-selected={word.id === selectedItem?.word.id}
                key={word.id}
                type="button"
                onClick={() => {
                  setSelectedWordId(word.id)
                  setSelectedOccurrenceId(null)
                }}
              >
                <span>
                  <strong>{word.text}</strong>
                  <small>{occurrences.length} occurrences</small>
                </span>
                <em>{word.mastery}</em>
              </button>
            ))}
          </div>

          {selectedItem && selectedOccurrence && (
            <article className="word-detail">
              <div className="detail-header">
                <div>
                  <p className="page-kicker">Selected word</p>
                  <button
                    className="word-title-button"
                    type="button"
                    title="Open the original page and highlight this occurrence"
                    onClick={() => handleOpenSource(selectedOccurrence.id)}
                  >
                    {selectedItem.word.text}
                  </button>
                </div>
                <select
                  className="filter-select"
                  aria-label="Update mastery"
                  value={selectedItem.word.mastery}
                  onChange={(event) =>
                    void handleMasteryChange(
                      selectedItem.word.id,
                      event.target.value as MasteryState,
                    )
                  }
                >
                  <option value="new">New</option>
                  <option value="learning">Learning</option>
                  <option value="known">Known</option>
                </select>
              </div>

              <div className="occurrence-tabs" aria-label="Occurrences">
                {selectedItem.occurrences.map((occurrence) => (
                  <button
                    key={occurrence.id}
                    type="button"
                    data-selected={occurrence.id === selectedOccurrence.id}
                    title={`Select occurrence from ${occurrence.domain}`}
                    onClick={() => setSelectedOccurrenceId(occurrence.id)}
                  >
                    {occurrence.domain}
                  </button>
                ))}
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
                  onClick={() => void handleDeleteWord(selectedItem.word.id)}
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

export default VocabularyPage
