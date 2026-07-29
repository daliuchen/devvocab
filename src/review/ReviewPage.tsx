import { useEffect, useState } from 'react'
import { db } from '../data/database'
import { getReviewCards, recordReviewOutcome } from '../data/repository'
import type { ReviewCard, ReviewOutcome } from '../shared/models'
import './ReviewPage.css'

function ReviewPage() {
  const [cards, setCards] = useState<ReviewCard[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const currentCard = cards[currentIndex]

  useEffect(() => {
    void reloadCards()
  }, [])

  async function reloadCards() {
    const nextCards = await getReviewCards(db)
    setCards(nextCards)
    setCurrentIndex(0)
    setRevealed(false)
  }

  async function handleOutcome(outcome: ReviewOutcome) {
    if (!currentCard) {
      return
    }

    await recordReviewOutcome(db, currentCard.review.id, outcome)

    if (currentIndex + 1 < cards.length) {
      setCurrentIndex(currentIndex + 1)
      setRevealed(false)
      return
    }

    await reloadCards()
  }

  return (
    <main className="review-shell">
      <header className="review-header">
        <p className="review-kicker">Review</p>
        <h1 className="review-title">Practice in context</h1>
      </header>

      {!currentCard ? (
        <section className="review-card">
          <h2>No reviews due</h2>
          <p>Saved words will appear here when they are ready to review.</p>
        </section>
      ) : (
        <section className="review-card">
          <p className="review-progress">
            {currentIndex + 1} / {cards.length}
          </p>
          <h2>{currentCard.word.text}</h2>
          <p className="review-source">
            {currentCard.occurrence?.pageTitle ?? 'Saved mark'}
            {currentCard.occurrence?.domain
              ? ` · ${currentCard.occurrence.domain}`
              : ''}
          </p>

          {revealed ? (
            <div className="review-back">
              {currentCard.occurrence?.sentence && (
                <blockquote>{currentCard.occurrence.sentence}</blockquote>
              )}
              {currentCard.occurrence?.definition && (
                <p>{currentCard.occurrence.definition}</p>
              )}
              {currentCard.occurrence?.note && (
                <p>{currentCard.occurrence.note}</p>
              )}
              {currentCard.occurrence?.pageUrl && (
                <a
                  href={currentCard.occurrence.pageUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open source
                </a>
              )}
            </div>
          ) : (
            <button
              className="reveal-button"
              type="button"
              onClick={() => setRevealed(true)}
            >
              Reveal context
            </button>
          )}

          <div className="review-actions" aria-label="Review outcomes">
            <button
              className="review-action"
              type="button"
              disabled={!revealed}
              onClick={() => void handleOutcome('forgotten')}
            >
              Forgotten
            </button>
            <button
              className="review-action"
              type="button"
              disabled={!revealed}
              onClick={() => void handleOutcome('uncertain')}
            >
              Uncertain
            </button>
            <button
              className="review-action"
              type="button"
              disabled={!revealed}
              onClick={() => void handleOutcome('remembered')}
            >
              Remembered
            </button>
          </div>
        </section>
      )}
    </main>
  )
}

export default ReviewPage
