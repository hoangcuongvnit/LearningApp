import React, { useEffect, useState } from 'react'
import { post, put } from '../utils/api'

interface CreateSentenceDto {
  original: string
  language: string
  vietnamese?: string
  description?: string
  imageUrl?: string
  audioUrl?: string
  transcription?: string
  tagIds?: number[]
}

interface SentenceResponseDto {
  id: string
  original: string
  language: string
  vietnamese?: string
  description?: string
  imageUrl?: string
  audioUrl?: string
  transcription?: string
  tags?: string[]
  createdAt: string
}

type Initial = { 
  id?: string
  original?: string
  language?: string
  vietnamese?: string
  description?: string
  transcription?: string
}

export default function CreateSentenceForm({ 
  token, 
  onSuccess, 
  initial 
}: { 
  token: string
  onSuccess?: () => void
  initial?: Initial 
}) {
  const [original, setOriginal] = useState(initial?.original ?? '')
  const [language, setLanguage] = useState(initial?.language ?? 'English')
  const [vietnamese, setVietnamese] = useState(initial?.vietnamese ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [transcription, setTranscription] = useState(initial?.transcription ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setOriginal(initial?.original ?? '')
    setLanguage(initial?.language ?? 'English')
    setVietnamese(initial?.vietnamese ?? '')
    setDescription(initial?.description ?? '')
    setTranscription(initial?.transcription ?? '')
  }, [initial])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const body: CreateSentenceDto = {
        original,
        language,
        vietnamese: vietnamese || undefined,
        description: description || undefined,
        transcription: transcription || undefined
      }

      if (initial && initial.id) {
        // Update existing sentence
        await put<SentenceResponseDto>(`/api/Sentences/${initial.id}`, body, token)
      } else {
        // Create new sentence
        await post<SentenceResponseDto>('/api/Sentences', body, token)
        // Clear form for new sentence
        setOriginal('')
        setLanguage('English')
        setVietnamese('')
        setDescription('')
        setTranscription('')
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
    <>
      {loading && (
        <div className="loading-overlay">
          <div className="spinner-border text-light" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}
      <div className="card mx-auto" style={{ maxWidth: 720 }}>
        <div className="card-body">
          <h5 className="card-title">{title}</h5>
          {error && <div className="alert alert-danger">{error}</div>}
          <form onSubmit={submit}>
            <div className="mb-3">
              <label className="form-label">Language</label>
              <select 
                className="form-select" 
                value={language} 
                onChange={e => setLanguage(e.target.value)}
                required
              >
                <option value="English">English</option>
                <option value="Korean">Korean</option>
              </select>
            </div>
            <div className="mb-3">
              <label className="form-label">Original Text</label>
              <input 
                className="form-control" 
                value={original} 
                onChange={e => setOriginal(e.target.value)} 
                required 
                placeholder="Enter the sentence in the selected language"
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Vietnamese Translation (optional)</label>
              <input 
                className="form-control" 
                value={vietnamese} 
                onChange={e => setVietnamese(e.target.value)} 
                placeholder="Auto-generated if not provided"
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Description (optional)</label>
              <textarea 
                className="form-control" 
                value={description} 
                onChange={e => setDescription(e.target.value)} 
                rows={3}
                placeholder="Auto-generated if not provided"
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Transcription (optional)</label>
              <input 
                className="form-control" 
                value={transcription} 
                onChange={e => setTranscription(e.target.value)} 
                placeholder="Auto-generated if not provided"
              />
            </div>
            <div className="d-flex gap-2">
              <button className="btn btn-success" disabled={loading}>
                {loading ? 'Saving...' : (initial && initial.id ? 'Update' : 'Create')}
              </button>
              {initial && initial.id && (
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => { if (onSuccess) onSuccess() }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
