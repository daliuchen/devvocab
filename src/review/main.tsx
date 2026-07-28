import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../index.css'
import ReviewPage from './ReviewPage.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ReviewPage />
  </StrictMode>,
)
