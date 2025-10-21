import React, { useState } from 'react'
import { graphql } from '../utils/api'

export default function CreateSentenceForm({ token, onSuccess }: { token: string, onSuccess?: () => void }) {
  const [english, setEnglish] = useState('')
  const [vietnamese, setVietnamese] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const query = `mutation($i:CreateSentenceInput!){ createSentence(input:$i){ id english vietnamese audioUrl } }`
      const variables = { i: { english, vietnamese } }
      await graphql(query, variables, token)
      setEnglish('')
      setVietnamese('')
      if (onSuccess) onSuccess()
    } catch (err: any) {
      setError(err.message || String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card mx-auto" style={{ maxWidth: 720 }}>
      <div className="card-body">
        <h5 className="card-title">Create Sentence</h5>
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
          <button className="btn btn-success" disabled={loading}>{loading ? 'Saving...' : 'Create'}</button>
        </form>
      </div>
    </div>
  )
}
