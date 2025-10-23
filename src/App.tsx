import React, { useEffect, useState } from 'react'
import LoginForm from './components/LoginForm'
import CreateSentenceForm from './components/CreateSentenceForm'
import LearnView from './components/LearnView'
import ReviewView from './components/ReviewView'
import SentenceList from './components/SentenceList'
import { getToken, setToken, clearToken, isAuthenticated } from './utils/auth'

type View = 'learn' | 'review' | 'list' | 'create' | 'login'

export default function App() {
  const [view, setView] = useState<View>('learn')
  const [token, setTokenState] = useState<string | null>(getToken())
  const [editingSentence, setEditingSentence] = useState<{ id?: string; english?: string; vietnamese?: string } | null>(null)

  useEffect(() => {
    setTokenState(getToken())
  }, [])

  function onLogin(newToken: string) {
    setToken(newToken)
    setTokenState(newToken)
    setView('learn')
  }

  function onLogout() {
    clearToken()
    setTokenState(null)
    setView('login')
  }

  function handleEditSentence(s: { id?: string; english?: string; vietnamese?: string }) {
    setEditingSentence(s)
    setView('create')
  }

  if (!isAuthenticated()) {
    return (
      <div className="container py-5">
        <LoginForm onLogin={onLogin} />
      </div>
    )
  }

  return (
    <div>
      <nav className="navbar navbar-expand-lg navbar-light bg-light">
        <div className="container">
          <a className="navbar-brand" href="#">Learning</a>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#nav" aria-controls="nav" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="nav">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <button className={`nav-link btn btn-link ${view === 'learn' ? 'active' : ''}`} onClick={() => setView('learn')}>Learn</button>
              </li>
              <li className="nav-item">
                <button className={`nav-link btn btn-link ${view === 'list' ? 'active' : ''}`} onClick={() => setView('list')}>Sentences</button>
              </li>
              <li className="nav-item">
                <button className={`nav-link btn btn-link ${view === 'create' ? 'active' : ''}`} onClick={() => setView('create')}>Create</button>
              </li>
              <li className="nav-item">
                <button className={`nav-link btn btn-link ${view === 'review' ? 'active' : ''}`} onClick={() => setView('review')}>Review</button>
              </li>
            </ul>

            <div className="d-flex">
              {isAuthenticated() ? (
                <>
                  <button className="btn btn-outline-secondary" onClick={onLogout}>Logout</button>
                </>
              ) : (
                <button className="btn btn-primary" onClick={() => setView('login')}>Login</button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="container py-4">
        {view === 'login' && <LoginForm onLogin={onLogin} />}

        {view === 'create' && (
          <CreateSentenceForm
            token={token ?? ''}
            initial={editingSentence ?? undefined}
            onSuccess={() => {
              // If we were editing an existing sentence, return to the list after saving.
              // If we were creating a new sentence, stay on the create form so the user can add another.
              if (editingSentence) {
                setEditingSentence(null)
                setView('list')
              } else {
                // clear edit state and remain on create for continuous adds
                setEditingSentence(null)
              }
            }}
          />
        )}

        {view === 'learn' && (
          <LearnView token={token ?? ''} />
        )}

        {view === 'list' && (
          <SentenceList token={token ?? ''} onEdit={handleEditSentence} />
        )}

        {view === 'review' && (
          <ReviewView token={token ?? ''} />
        )}
      </main>
    </div>
  )
}
