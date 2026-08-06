import './App.css'

function App() {
  return (
    <main className="app-shell">
      <section className="intro-panel">
        <p className="eyebrow">ReadTrace</p>
        <h1>Trace technical reading back to its source.</h1>
        <p className="intro-copy">
          Save unfamiliar words from engineering articles with their source
          sentence, page URL, and source locator.
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
          <h2>Reopen</h2>
          <p>Jump back to the original page and highlight the saved mark.</p>
        </article>
      </section>
    </main>
  )
}

export default App
