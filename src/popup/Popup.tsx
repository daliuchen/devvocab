import { useEffect, useState } from 'react'
import './Popup.css'
import type { ReadTraceStatsResponse } from '../shared/messages'

type PopupStats = Pick<
  ReadTraceStatsResponse,
  'totalWords' | 'dueReviews' | 'recentWords'
>

function Popup() {
  const [stats, setStats] = useState<PopupStats>({
    totalWords: 0,
    dueReviews: 0,
    recentWords: [],
  })

  useEffect(() => {
    chrome.runtime
      .sendMessage({ type: 'DEVVOCAB_GET_STATS' })
      .then((response: ReadTraceStatsResponse) => {
        setStats({
          totalWords: response.totalWords,
          dueReviews: response.dueReviews,
          recentWords: response.recentWords,
        })
      })
      .catch(() => {
        setStats({
          totalWords: 0,
          dueReviews: 0,
          recentWords: [],
        })
      })
  }, [])

  function openPage(page: 'library' | 'review') {
    void chrome.runtime.sendMessage({
      type: 'DEVVOCAB_OPEN_PAGE',
      page,
    })
  }

  return (
    <main className="popup-shell">
      <header className="popup-header">
        <div>
          <h1 className="popup-title">ReadTrace</h1>
          <p className="popup-subtitle">Technical reading memory</p>
        </div>
        <span className="status-pill">MVP</span>
      </header>

      <section className="stat-grid" aria-label="Library stats">
        <div className="stat-card">
          <span className="stat-value">{stats.totalWords}</span>
          <span className="stat-label">saved words</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.dueReviews}</span>
          <span className="stat-label">due reviews</span>
        </div>
      </section>

      {stats.recentWords.length > 0 && (
        <section className="recent-list" aria-label="Recent words">
          <h2>Recent</h2>
          <ul>
            {stats.recentWords.map((word) => (
              <li key={word.id}>
                <span>{word.text}</span>
                <small>{word.mastery}</small>
              </li>
            ))}
          </ul>
        </section>
      )}

      <nav className="popup-actions" aria-label="ReadTrace actions">
        <button
          className="popup-button"
          type="button"
          onClick={() => openPage('library')}
        >
          Open library
        </button>
        <button
          className="popup-button"
          type="button"
          onClick={() => openPage('review')}
        >
          Start review
        </button>
      </nav>
    </main>
  )
}

export default Popup
