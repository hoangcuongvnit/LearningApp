import React, { useEffect, useState } from 'react'
import LoginForm from './components/LoginForm'
import CreateSentenceForm from './components/CreateSentenceForm'
import SentenceList from './components/SentenceList'
import { getToken, setToken, clearToken, isAuthenticated } from './utils/auth'

type View = 'list' | 'create' | 'login'

export default function App() {
  const [view, setView] = useState<View>('list')
  const [token, setTokenState] = useState<string | null>(getToken())
  const [editingSentence, setEditingSentence] = useState<{ id?: string; english?: string; vietnamese?: string } | null>(null)

  useEffect(() => {
    setTokenState(getToken())
  }, [])

  function onLogin(newToken: string) {
    setToken(newToken)
    setTokenState(newToken)
    setView('list')
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
          <a className="navbar-brand" href="#">LearningApp</a>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#nav" aria-controls="nav" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="nav">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <button className={`nav-link btn btn-link ${view === 'list' ? 'active' : ''}`} onClick={() => setView('list')}>Sentences</button>
              </li>
              <li className="nav-item">
                <button className={`nav-link btn btn-link ${view === 'create' ? 'active' : ''}`} onClick={() => setView('create')}>Create</button>
              </li>
            </ul>

            <div className="d-flex">
              {isAuthenticated() ? (
                <>
                  <span className="navbar-text me-2">Logged in</span>
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
          <CreateSentenceForm token={token ?? ''} initial={editingSentence ?? undefined} onSuccess={() => { setEditingSentence(null); setView('list') }} />
        )}

        {view === 'list' && (
          <SentenceList token={token ?? ''} onEdit={handleEditSentence} />
        )}
      </main>
    </div>
  )
}
