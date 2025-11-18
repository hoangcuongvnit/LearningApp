import React, { useEffect, useRef, useState } from 'react'
import { post } from '../utils/api'

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

interface GetSentenceByLearningCountDto {
  minCount: number
  maxCount: number
  language?: string
}

type LearnViewProps = {
  token?: string
  minStudyCount?: number
  maxStudyCount?: number
}

export default function LearnView({ token, minStudyCount = 0, maxStudyCount = 5 }: LearnViewProps) {
  const [sentence, setSentence] = useState<UserLearningSentenceDto | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showVN, setShowVN] = useState(false)
  const [playing, setPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isAutoSet, setIsAutoSet] = useState(true)

  useEffect(() => {
    fetchSentence()
    // cleanup audio when unmount
    return () => {
      if (audioRef.current) {
        try { audioRef.current.pause() } catch { }
        audioRef.current = null
      }
    }
  }, [token, minStudyCount, maxStudyCount])

  useEffect(() => {
    if (isAutoSet && sentence) {
      const timeout = setTimeout(() => {
        if (showVN) setIsAutoSet(false)
        setShowVN(!showVN)
      }, 4000)
      return () => clearTimeout(timeout)
    }
  }, [sentence, showVN, isAutoSet])

  async function fetchSentence() {
    setLoading(true)
    setError(null)
    setShowVN(false)
    setPlaying(false)
    if (audioRef.current) { 
      try { audioRef.current.pause() } catch { } 
      audioRef.current = null 
    }
    
    try {
      if (!token) {
        setError('Authentication required')
        setSentence(null)
        return
      }

      const body: GetSentenceByLearningCountDto = {
        minCount: minStudyCount,
        maxCount: maxStudyCount
      }

      const result = await post<UserLearningSentenceDto>(
        '/api/UserLearning/get-by-count',
        body,
        token
      )

      setSentence(result)
      setShowVN(false)
      setIsAutoSet(true)
    } catch (err: any) {
      setError(err.message || String(err))
      setSentence(null)
    } finally {
      setLoading(false)
    }
  }

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

  function togglePlay() {
    if (!sentence) return
    const src = getAudioSrc(sentence.audioUrl)
    if (!src) return
    
    if (playing && audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
      setPlaying(false)
      return
    }
    
    if (audioRef.current) {
      try { audioRef.current.pause() } catch { }
      audioRef.current = null
      setPlaying(false)
    }
    
    const a = new Audio(src)
    audioRef.current = a
    a.play().then(() => setPlaying(true)).catch(err => { 
      console.error(err)
      setPlaying(false) 
    })
    a.onended = () => { 
      setPlaying(false)
      audioRef.current = null 
    }
  }

  async function finish() {
    if (!sentence) return
    setError(null)
    
    if (!token) {
      setError('Not authenticated')
      return
    }
    
    // Stop any playing audio
    if (audioRef.current) {
      try { audioRef.current.pause() } catch { }
      audioRef.current = null
    }
    setPlaying(false)

    try {
      // Mark sentence as finished
      await post(`/api/UserLearning/finish/${sentence.sentenceId}`, undefined, token)
      
      // Fetch next sentence
      await fetchSentence()
    } catch (err: any) {
      setError(err.message || String(err))
    }
  }

  return (
    <div className="d-flex flex-column justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
      {loading && <div className="text-muted">Loading...</div>}
      {error && <div className="alert alert-danger">{error}</div>}
      {!loading && !sentence && <div className="text-muted">No sentence available</div>}

      {sentence && (
        <div className="w-100" style={{ maxWidth: 720 }}>
          <div className="card text-center">
            <div 
              className="card-body" 
              style={{
                backgroundImage: sentence.imageUrl ? `url(${sentence.imageUrl.startsWith('http') ? sentence.imageUrl : 'https://aznet.io.vn' + sentence.imageUrl})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundColor: sentence.imageUrl ? 'rgba(255, 255, 255, 0.9)' : 'transparent',
                backgroundBlendMode: sentence.imageUrl ? 'lighten' : 'normal'
              }}
            >
              <h2 className="card-title mb-3">{sentence.original}</h2>
              <p className='mb-3'>{sentence.transcription}</p>
              <div className="mb-3 main-btn-group">
                <button className="btn btn-outline-primary me-2" onClick={togglePlay}>
                  {playing ? '⏸ Pause' : '▶ Play'}
                </button>
                <button className="btn btn-success me-2" onClick={finish}>
                  Finish
                </button>
                <button className="btn btn-outline-secondary" onClick={() => setShowVN(s => !s)}>
                  {showVN ? 'Hide Vietnamese' : 'Show Vietnamese'}
                </button>
              </div>

              <div className="show-text-feature">{showVN && sentence.vietnamese}</div>
              <div className='show-study-count'>{sentence.learningCount ?? 0}</div>
            </div>

            {sentence.description && (
              <div 
                className='card-footer description-data' 
                style={{ textAlign: 'left', whiteSpace: 'pre-wrap', marginTop: '1rem' }}
                dangerouslySetInnerHTML={{ __html: formatDescription(sentence.description) }}
              ></div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
