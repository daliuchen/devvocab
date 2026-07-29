import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../index.css'
import LibraryPage from './LibraryPage.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LibraryPage />
  </StrictMode>,
)
