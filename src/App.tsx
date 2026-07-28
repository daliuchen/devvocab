import './App.css'

function App() {
  return (
    <main className="app-shell">
      <section className="intro-panel">
        <p className="eyebrow">DevVocab</p>
        <h1>Context-first vocabulary for technical reading.</h1>
        <p className="intro-copy">
          Save unfamiliar words from engineering articles with their source
          sentence, page URL, and review state.
        </p>
      </section>

      <section className="workflow-grid" aria-label="MVP workflow">
        <article>
          <span className="step">01</span>
          <h2>Capture</h2>
          <p>
            Select a word or phrase on a technical page and save it locally.
          </p>
        </article>
        <article>
          <span className="step">02</span>
          <h2>Preserve</h2>
          <p>Keep the sentence, source URL, title, and locator metadata.</p>
        </article>
        <article>
          <span className="step">03</span>
          <h2>Review</h2>
          <p>Practice with flashcards that restore the original context.</p>
        </article>
      </section>
    </main>
  )
}

export default App
