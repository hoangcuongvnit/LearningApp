import React, { useEffect, useState } from 'react'
import { graphql } from '../utils/api'

type Initial = { id?: string; english?: string; vietnamese?: string }

export default function CreateSentenceForm({ token, onSuccess, initial }: { token: string, onSuccess?: () => void, initial?: Initial }) {
  const [english, setEnglish] = useState(initial?.english ?? '')
  const [vietnamese, setVietnamese] = useState(initial?.vietnamese ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setEnglish(initial?.english ?? '')
    setVietnamese(initial?.vietnamese ?? '')
  }, [initial])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      if (initial && initial.id) {
  // server expects Int for id and UpdateSentenceInput for update
  const query = `mutation($id:Int!,$i:UpdateSentenceInput!){ updateSentence(id:$id,input:$i){ id english vietnamese audioUrl } }`
  const variables = { id: Number(initial.id), i: { english, vietnamese } }
        await graphql(query, variables, token)
      } else {
        const query = `mutation($i:CreateSentenceInput!){ createSentence(input:$i){ id english vietnamese audioUrl } }`
        const variables = { i: { english, vietnamese } }
        await graphql(query, variables, token)
        setEnglish('')
        setVietnamese('')
      }

      if (onSuccess) onSuccess()
    } catch (err: any) {
      setError(err.message || String(err))
    } finally {
      setLoading(false)
    }
  }

  const title = initial && initial.id ? 'Edit Sentence' : 'Create Sentence'

  return (
    <div className="card mx-auto" style={{ maxWidth: 720 }}>
      <div className="card-body">
        <h5 className="card-title">{title}</h5>
        {error && <div className="alert alert-danger">{error}</div>}
        <form onSubmit={submit}>
          <div className="mb-3">
            <label className="form-label">English</label>
            <input className="form-control" value={english} onChange={e => setEnglish(e.target.value)} required />
          </div>
          <div className="mb-3">
            <label className="form-label">Vietnamese</label>
            <input className="form-control" value={vietnamese} onChange={e => setVietnamese(e.target.value)} required />
          </div>
          <div className="d-flex gap-2">
            <button className="btn btn-success" disabled={loading}>{loading ? 'Saving...' : (initial && initial.id ? 'Update' : 'Create')}</button>
            {initial && initial.id && <button type="button" className="btn btn-secondary" onClick={() => { if (onSuccess) onSuccess() }}>Cancel</button>}
          </div>
        </form>
      </div>
    </div>
  )
}
