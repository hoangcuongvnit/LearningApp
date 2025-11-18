import React, { useEffect, useRef, useState } from 'react'
import { get, del } from '../utils/api'
import CreateSentenceForm from './CreateSentenceForm'

interface UserLearningSentenceDto {
  sentenceId: string
  original: string
  language: string
  vietnamese?: string
  description?: string
  imageUrl?: string
  audioUrl?: string
  transcription?: string
  learningCount: number
  lastReviewed: string
  tags?: string[]
}

interface PagedResult<T> {
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
  items: T[]
  hasPrevious: boolean
  hasNext: boolean
}

type Sentence = { 
  id: string
  original: string
  language: string
  vietnamese?: string
  learningCount: number
  audioUrl?: string
}

export default function SentenceList({ token, onEdit }: { token?: string, onEdit?: (s: Sentence) => void }) {
  const [items, setItems] = useState<UserLearningSentenceDto[]>([])
  const [page, setPage] = useState(1)
  const [pageSize] = useState(12)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<Sentence | null>(null)
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [language, setLanguage] = useState<string>('')
  const [viewingSentence, setViewingSentence] = useState<UserLearningSentenceDto | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    fetchPage(page)
  }, [page, language])

  async function fetchPage(p: number) {
    setLoading(true)
    setError(null)
    try {
      if (!token) {
        setError('Authentication required')
        return
      }

      let url = `/api/Sentences/my-sentences?page=${p}&pageSize=${pageSize}`
      if (language) {
        url += `&language=${encodeURIComponent(language)}`
      }

      const result = await get<PagedResult<UserLearningSentenceDto>>(
        url,
        token
      )

      setItems(result.items)
      setTotal(result.totalCount)
      setTotalPages(result.totalPages)
    } catch (err: any) {
      setError(err.message || String(err))
    } finally {
      setLoading(false)
    }
  }

  async function remove(id: string) {
    if (!confirm('Delete this sentence?')) return
    try {
      await del(`/api/Sentences/${id}`, token)
      // refresh
      fetchPage(page)
    } catch (err: any) {
      alert(err.message || String(err))
    }
  }

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        try { audioRef.current.pause() } catch {}
        audioRef.current = null
      }
    }
  }, [])

  function getAudioSrc(url?: string) {
    if (!url) return null
    return url.startsWith('http') ? url : 'https://aznet.io.vn' + url
  }

  function formatDescription(text: string) {
    return text
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/### (.*?)(<br>|$)/g, '<h5>$1</h5>')
      .replace(/- (.*?)(<br>|$)/g, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/g, '<ul style="list-style-position: inside; text-align: left;">$1</ul>')
  }

  function togglePlay(it: UserLearningSentenceDto) {
    const src = getAudioSrc(it.audioUrl)
    if (!src) return

    // if currently playing this item -> stop
    if (playingId === it.sentenceId && audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      audioRef.current = null
      setPlayingId(null)
      return
    }

    // stop existing audio
    if (audioRef.current) {
      try { audioRef.current.pause() } catch {}
      audioRef.current = null
      setPlayingId(null)
    }

    const a = new Audio(src)
    audioRef.current = a
    a.play().then(() => {
      setPlayingId(it.sentenceId)
    }).catch(err => {
      console.error('audio play failed', err)
      setPlayingId(null)
    })
    a.onended = () => {
      setPlayingId(null)
      audioRef.current = null
    }
  }

  function handleEdit(it: UserLearningSentenceDto) {
    const sentence: Sentence = {
      id: it.sentenceId,
      original: it.original,
      language: it.language,
      vietnamese: it.vietnamese,
      learningCount: it.learningCount,
      audioUrl: it.audioUrl
    }
    
    if (onEdit) {
      onEdit(sentence)
    } else {
      setEditing(sentence)
    }
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="m-0">My Sentences</h3>
        <div className="d-flex gap-2 align-items-center">
          <select 
            className="form-select form-select-sm" 
            style={{ width: 'auto' }}
            value={language} 
            onChange={(e) => {
              setLanguage(e.target.value)
              setPage(1)
            }}
          >
            <option value="">All Languages</option>
            <option value="English">English</option>
            <option value="Korean">Korean</option>
          </select>
          <div className="text-muted">Total: {total}</div>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div className="text-center py-4">Loading...</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead>
              <tr>
                <th style={{ width: '60%' }}>Text</th>
                <th style={{ width: '15%' }}>Audio</th>
                <th style={{ width: '10%' }}>Count</th>
                <th style={{ width: '15%' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map(it => (
                <tr key={it.sentenceId} className='row-sentence'>
                  <td>
                    <div 
                      className="fw-bold" 
                      style={{ cursor: 'pointer', color: '#0d6efd' }}
                      onClick={() => setViewingSentence(it)}
                    >
                      {it.original}
                    </div>
                    <div className="text-muted small">{it.vietnamese}</div>
                  </td>
                  <td>
                    {it.audioUrl ? (
                      <div>
                        <button 
                          aria-label={playingId === it.sentenceId ? 'Pause' : 'Play'} 
                          className="btn btn-sm btn-outline-secondary" 
                          onClick={() => togglePlay(it)}
                        >
                          {playingId === it.sentenceId ? '⏸' : '▶'}
                        </button>
                      </div>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td>{it.learningCount ?? 0}</td>
                  <td>
                    <div className="d-flex gap-2">
                      <button 
                        className="btn btn-sm btn-outline-primary" 
                        onClick={() => handleEdit(it)}
                      >
                        Edit
                      </button>
                      <button 
                        className="btn btn-sm btn-outline-danger" 
                        onClick={() => remove(it.sentenceId)}
                      >
                        Del
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <nav className="mt-3" aria-label="Pagination">
        <ul className="pagination">
          <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
            <button className="page-link" onClick={() => setPage(p => Math.max(1, p - 1))}>
              Previous
            </button>
          </li>
          <li className="page-item disabled">
            <span className="page-link">{page} / {totalPages}</span>
          </li>
          <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
            <button className="page-link" onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
              Next
            </button>
          </li>
        </ul>
      </nav>

      {editing && (
        <div className="mt-4">
          <CreateSentenceForm 
            token={token ?? ''} 
            initial={editing} 
            onSuccess={() => { 
              setEditing(null)
              fetchPage(page) 
            }} 
          />
        </div>
      )}

      {/* Viewing Modal */}
      {viewingSentence && (
        <div 
          className="modal fade show" 
          style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => setViewingSentence(null)}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Sentence Details</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setViewingSentence(null)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="card text-center border-0">
                  <div className="card-body">
                    <div className="mb-2">
                      <span className="badge bg-secondary">{viewingSentence.language}</span>
                    </div>
                    <h2 className="card-title mb-3">{viewingSentence.original}</h2>
                    <div className="mb-3">
                      {viewingSentence.audioUrl && (
                        <button 
                          className="btn btn-outline-primary me-2" 
                          onClick={() => togglePlay(viewingSentence)}
                        >
                          {playingId === viewingSentence.sentenceId ? '⏸ Pause' : '▶ Play'}
                        </button>
                      )}
                    </div>
                    
                    <div className="text-start mt-4">
                      <div className="mb-3">
                        <strong>Vietnamese:</strong>
                        <p className="ms-3">{viewingSentence.vietnamese || 'N/A'}</p>
                      </div>
                      
                      {viewingSentence.transcription && (
                        <div className="mb-3">
                          <strong>Transcription:</strong>
                          <p className="ms-3">{viewingSentence.transcription}</p>
                        </div>
                      )}
                      
                      {viewingSentence.description && (
                        <div className="mb-3">
                          <strong>Description:</strong>
                          <div 
                            className="ms-3" 
                            dangerouslySetInnerHTML={{ __html: formatDescription(viewingSentence.description) }}
                          ></div>
                        </div>
                      )}
                      
                      <div className="mb-3">
                        <strong>Learning Count:</strong>
                        <p className="ms-3">{viewingSentence.learningCount ?? 0}</p>
                      </div>
                      
                      {viewingSentence.tags && viewingSentence.tags.length > 0 && (
                        <div className="mb-3">
                          <strong>Tags:</strong>
                          <div className="ms-3">
                            {viewingSentence.tags.map((tag, idx) => (
                              <span key={idx} className="badge bg-info me-1">{tag}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setViewingSentence(null)}
                >
                  Close
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={() => {
                    handleEdit(viewingSentence)
                    setViewingSentence(null)
                  }}
                >
                  Edit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
