import React, { useEffect, useRef, useState } from 'react'
import { graphql } from '../utils/api'
import CreateSentenceForm from './CreateSentenceForm'

type Sentence = { id: string; english: string; vietnamese: string; audioUrl?: string; studyCount: number }

export default function SentenceList({ token, onEdit }: { token?: string, onEdit?: (s: Sentence) => void }) {
  const [items, setItems] = useState<Sentence[]>([])
  const [page, setPage] = useState(1)
  const [pageSize] = useState(12)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<Sentence | null>(null)
  const [playingId, setPlayingId] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [generating, setGenerating] = useState(false)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')

  useEffect(() => {
    fetchPage(page)
  }, [page, search])

  async function fetchPage(p: number) {
    setLoading(true)
    setError(null)
    try {
      const query = `query($search:String,$limit:Int,$offset:Int){ sentences(search:$search,limit:$limit,offset:$offset){ items{ id english vietnamese audioUrl studyCount } total } }`
      const variables = { search: search || undefined, limit: pageSize, offset: (p - 1) * pageSize }
      const data = await graphql(query, variables, token)
      setItems(data.sentences.items)
      setTotal(data.sentences.total)
    } catch (err: any) {
      setError(err.message || String(err))
    } finally {
      setLoading(false)
    }
  }

  async function remove(id: string) {
    if (!confirm('Delete this sentence?')) return
    try {
      // server declares deleteSentence(id: Int!): Boolean!
      await graphql(`mutation($id:Int!){ deleteSentence(id:$id) }`, { id: Number(id) }, token)
      // refresh
      fetchPage(page)
    } catch (err: any) {
      alert(err.message || String(err))
    }
  }

  async function generateMissingFields() {
    if (!token) {
      alert('Authentication required')
      return
    }

    const dryRun = confirm('Do you want to preview changes first? (Click OK for preview, Cancel to apply immediately)')
    const limit = prompt('How many sentences to process?', '10')
    if (!limit) return

    setGenerating(true)
    setError(null)

    try {
      const query = `mutation($input:BatchGenerateInput!){
        batchGenerateMissingFields(input:$input){
          processed
          updated
          errors
          details{ id english fields action }
        }
      }`
      const variables = {
        input: {
          dryRun,
          limit: parseInt(limit, 10)
        }
      }

      const result = await graphql(query, variables, token)
      const data = result.batchGenerateMissingFields

      // Show results
      let message = `Processed: ${data.processed}\nUpdated: ${data.updated}\n`
      if (data.errors && data.errors.length > 0) {
        message += `\nErrors:\n${data.errors.join('\n')}`
      }
      if (data.details && data.details.length > 0) {
        message += `\n\nDetails:\n${data.details.map((d: any) => 
          `- ID ${d.id}: ${d.english.substring(0, 40)}... | Fields: ${d.fields?.join(', ') || 'none'} | Action: ${d.action}`
        ).join('\n')}`
      }

      alert(message)

      // If it was not a dry run, refresh the list
      if (!dryRun) {
        fetchPage(page)
      }
    } catch (err: any) {
      setError(err.message || String(err))
      alert('Error: ' + (err.message || String(err)))
    } finally {
      setGenerating(false)
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
    return url.startsWith('http') ? url : 'https://apis.aznetviet.xyz' + url
  }

  function togglePlay(it: Sentence) {
    const src = getAudioSrc(it.audioUrl)
    if (!src) return

    // if currently playing this item -> stop
    if (playingId === it.id && audioRef.current) {
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
      setPlayingId(it.id)
    }).catch(err => {
      console.error('audio play failed', err)
      setPlayingId(null)
    })
    a.onended = () => {
      setPlayingId(null)
      audioRef.current = null
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1) // Reset to first page when searching
  }

  function handleClearSearch() {
    setSearchInput('')
    setSearch('')
    setPage(1)
  }

  const pages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="m-0">Sentences</h3>
        <button 
          className="btn btn-primary" 
          onClick={() => generateMissingFields()}
          disabled={generating}
        >
          {generating ? 'Generating...' : 'Generate Missing Fields'}
        </button>
        <div className="text-muted">Total: {total}</div>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="mb-3">
        <div className="input-group">
          <input
            type="text"
            className="form-control"
            placeholder="Search sentences..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <button type="submit" className="btn btn-outline-primary">
            Search
          </button>
          {search && (
            <button type="button" className="btn btn-outline-secondary" onClick={handleClearSearch}>
              Clear
            </button>
          )}
        </div>
      </form>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div className="text-center py-4">Loading...</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead>
              <tr>
                <th style={{ width: '65%' }}>Text</th>
                <th style={{ width: '15%' }}>Audio</th>
                <th style={{ width: '10%' }}>C</th>
                <th style={{ width: '10%' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map(it => (
                <tr key={it.id} className='row-sentence'>
                  <td>
                    <div className="fw-bold">{it.english}</div>
                    <div className="text-muted small">{it.vietnamese}</div>
                  </td>
                  <td>
                    {it.audioUrl ? (
                      <div>
                        <button aria-label={playingId === it.id ? 'Pause' : 'Play'} className="btn btn-sm btn-outline-secondary" onClick={() => togglePlay(it)}>
                          {playingId === it.id ? '⏸' : '▶'}
                        </button>
                      </div>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td>{it.studyCount ?? 0}</td>
                  <td>
                    <div className="d-flex gap-2">
                      <button className="btn btn-sm btn-outline-primary" onClick={() => onEdit ? onEdit(it) : setEditing(it)}>Edit</button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => remove(it.id)}>Delete</button>
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
          <li className={`page-item ${page === 1 ? 'disabled' : ''}`}><button className="page-link" onClick={() => setPage(p => Math.max(1, p - 1))}>Previous</button></li>
          <li className="page-item disabled"><span className="page-link">{page} / {pages}</span></li>
          <li className={`page-item ${page === pages ? 'disabled' : ''}`}><button className="page-link" onClick={() => setPage(p => Math.min(pages, p + 1))}>Next</button></li>
        </ul>
      </nav>

      {editing && (
        <div className="mt-4">
          <CreateSentenceForm token={token ?? ''} initial={editing} onSuccess={() => { setEditing(null); fetchPage(page) }} />
        </div>
      )}
    </div>
  )
}
