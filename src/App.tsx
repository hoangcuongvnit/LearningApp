import React, { useEffect, useState } from 'react'
import LoginForm from './components/LoginForm'
import RegisterForm from './components/RegisterForm'
import CreateSentenceForm from './components/CreateSentenceForm'
import LearnView from './components/LearnView'
import ReviewView from './components/ReviewView'
import QuicklyLearningView from './components/QuicklyLearningView'
import SentenceList from './components/SentenceList'
import { getToken, setToken, clearToken, isAuthenticated } from './utils/auth'

type View = 'learn' | 'review' | 'advanced' | 'quickly' | 'list' | 'create' | 'login' | 'register'

export default function App() {
  const [view, setView] = useState<View>('learn')
  const [token, setTokenState] = useState<string | null>(getToken())
  const [editingSentence, setEditingSentence] = useState<{ 
    id?: string
    original?: string
    language?: string
    vietnamese?: string 
  } | null>(null)
  const [navbarCollapsed, setNavbarCollapsed] = useState(true)

  useEffect(() => {
    setTokenState(getToken())
  }, [])

  function onLogin(newToken: string) {
    setToken(newToken)
    setTokenState(newToken)
    setView('learn')
  }

  function onRegister(newToken: string) {
    setToken(newToken)
    setTokenState(newToken)
    setView('learn')
  }

  function onLogout() {
    clearToken()
    setTokenState(null)
    setView('login')
  }

  function handleEditSentence(s: { 
    id?: string
    original?: string
    language?: string
    vietnamese?: string 
  }) {
    setEditingSentence(s)
    setView('create')
  }

  function handleNavClick(newView: View) {
    setView(newView)
    setNavbarCollapsed(true)
  }

  if (!isAuthenticated()) {
    return (
      <div className="container py-5">
        {view === 'register' ? (
          <RegisterForm 
            onRegister={onRegister} 
            onSwitchToLogin={() => setView('login')} 
          />
        ) : (
          <LoginForm 
            onLogin={onLogin} 
            onSwitchToRegister={() => setView('register')} 
          />
        )}
      </div>
    )
  }

  return (
    <div>
      <nav className="navbar navbar-expand-lg navbar-light bg-light">
        <div className="container">
          <a className="navbar-brand" href="#" onClick={() => handleNavClick('learn')}>
            <img src="/logo.png" alt="Learning App" style={{ height: '40px' }} />
          </a>
          <button 
            className="navbar-toggler" 
            type="button" 
            onClick={() => setNavbarCollapsed(!navbarCollapsed)}
            aria-controls="nav" 
            aria-expanded={!navbarCollapsed} 
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className={`collapse navbar-collapse ${!navbarCollapsed ? 'show' : ''}`} id="nav">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <button className={`nav-link btn btn-link ${view === 'quickly' ? 'active' : ''}`} onClick={() => handleNavClick('quickly')}>Quickly</button>
              </li>
              <li className="nav-item">
                <button className={`nav-link btn btn-link ${view === 'review' ? 'active' : ''}`} onClick={() => handleNavClick('review')}>Review</button>
              </li>
              <li className="nav-item">
                <button className={`nav-link btn btn-link ${view === 'advanced' ? 'active' : ''}`} onClick={() => handleNavClick('advanced')}>Advanced</button>
              </li>
              <li className="nav-item">
                <button className={`nav-link btn btn-link ${view === 'list' ? 'active' : ''}`} onClick={() => handleNavClick('list')}>Sentences</button>
              </li>
              <li className="nav-item">
                <button className={`nav-link btn btn-link ${view === 'create' ? 'active' : ''}`} onClick={() => handleNavClick('create')}>Create</button>
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
        {view === 'login' && (
          <LoginForm 
            onLogin={onLogin} 
            onSwitchToRegister={() => setView('register')} 
          />
        )}

        {view === 'register' && (
          <RegisterForm 
            onRegister={onRegister} 
            onSwitchToLogin={() => setView('login')} 
          />
        )}

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
          <LearnView token={token ?? ''} minStudyCount={0} maxStudyCount={5} />
        )}

        {view === 'quickly' && (
          <QuicklyLearningView token={token ?? ''} />
        )}

        {view === 'list' && (
          <SentenceList token={token ?? ''} onEdit={handleEditSentence} />
        )}

        {view === 'review' && (
          <ReviewView token={token ?? ''} />
        )}

        {view === 'advanced' && (
          <LearnView token={token ?? ''} minStudyCount={11} maxStudyCount={25} />
        )}
      </main>
    </div>
  )
}
