import React, { useEffect, useState } from 'react'
import { graphql } from '../utils/api'

type Sentence = { id: string; english: string; vietnamese: string; audioUrl?: string }

export default function SentenceList({ token }: { token?: string }) {
  const [items, setItems] = useState<Sentence[]>([])
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPage(page)
  }, [page])

  async function fetchPage(p: number) {
    setLoading(true)
    setError(null)
    try {
      const query = `query($limit:Int,$offset:Int){ sentences(limit:$limit,offset:$offset){ items{ id english vietnamese audioUrl } total } }`
      const variables = { limit: pageSize, offset: (p - 1) * pageSize }
      const data = await graphql(query, variables, token)
      setItems(data.sentences.items)
      setTotal(data.sentences.total)
    } catch (err: any) {
      setError(err.message || String(err))
    } finally {
      setLoading(false)
    }
  }

  const pages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3>Sentences</h3>
        <div className="text-muted">Total: {total}</div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="list-group">
        {loading ? (
          <div className="text-center py-4">Loading...</div>
        ) : (
          items.map(it => (
            <div key={it.id} className="list-group-item">
              <div className="d-flex justify-content-between">
                <div>
                  <div className="fw-bold">{it.english}</div>
                  <div className="text-muted">{it.vietnamese}</div>
                </div>
                {it.audioUrl && <audio controls src={it.audioUrl}></audio>}
              </div>
            </div>
          ))
        )}
      </div>

      <nav className="mt-3" aria-label="Pagination">
        <ul className="pagination">
          <li className={`page-item ${page === 1 ? 'disabled' : ''}`}><button className="page-link" onClick={() => setPage(p => Math.max(1, p - 1))}>Previous</button></li>
          <li className="page-item disabled"><span className="page-link">{page} / {pages}</span></li>
          <li className={`page-item ${page === pages ? 'disabled' : ''}`}><button className="page-link" onClick={() => setPage(p => Math.min(pages, p + 1))}>Next</button></li>
        </ul>
      </nav>
    </div>
  )
}
