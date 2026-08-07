import { useEffect, useState } from 'react'
import './Popup.css'
import type { ReadTraceStatsResponse } from '../shared/messages'

type PopupStats = Pick<ReadTraceStatsResponse, 'totalMarks'>

function Popup() {
  const [stats, setStats] = useState<PopupStats>({
    totalMarks: 0,
  })

  useEffect(() => {
    chrome.runtime
      .sendMessage({ type: 'DEVVOCAB_GET_STATS' })
      .then((response: ReadTraceStatsResponse) => {
        setStats({
          totalMarks: response.totalMarks,
        })
      })
      .catch(() => {
        setStats({
          totalMarks: 0,
        })
      })
  }, [])

  function openPage(page: 'library') {
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
      </header>

      <section className="stat-grid" aria-label="Library stats">
        <div className="stat-card">
          <span className="stat-value">{stats.totalMarks}</span>
          <span className="stat-label">saved marks</span>
        </div>
      </section>

      <nav className="popup-actions" aria-label="ReadTrace actions">
        <button
          className="popup-button"
          type="button"
          onClick={() => openPage('library')}
        >
          Open library
        </button>
      </nav>
    </main>
  )
}

export default Popup
