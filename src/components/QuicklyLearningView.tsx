import React, { useEffect, useRef, useState } from 'react'
import { get } from '../utils/api'

interface UserLearningSentenceDto {
  sentenceId: string
  original: string
  audioUrl?: string
  transcription?: string
  vietnamese?: string
  lastReviewed: string
}

export default function QuicklyLearningView({ token }: { token?: string }) {
  const [sentence, setSentence] = useState<UserLearningSentenceDto | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [playing, setPlaying] = useState(false)
  const [playCount, setPlayCount] = useState(0)
  const playCountRef = useRef(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const nextSentenceTimerRef = useRef<number | null>(null)
  const isMountedRef = useRef(true)
  const allTimersRef = useRef<Set<number>>(new Set())

  useEffect(() => {
    isMountedRef.current = true
    fetchSentence()
    
    // Cleanup on unmount
    return () => {
      isMountedRef.current = false
      
      // Clear all tracked timers
      allTimersRef.current.forEach(timer => clearTimeout(timer))
      allTimersRef.current.clear()
      
      if (audioRef.current) {
        try { 
          audioRef.current.pause()
          audioRef.current.onended = null
        } catch { }
        audioRef.current = null
      }
      if (nextSentenceTimerRef.current) {
        clearTimeout(nextSentenceTimerRef.current)
        nextSentenceTimerRef.current = null
      }
    }
  }, [token])

  async function fetchSentence() {
    if (!isMountedRef.current) return
    
    setLoading(true)
    setError(null)
    setPlaying(false)
    setPlayCount(0)
    playCountRef.current = 0
    
    // Clear any existing timer
    if (nextSentenceTimerRef.current) {
      clearTimeout(nextSentenceTimerRef.current)
      allTimersRef.current.delete(nextSentenceTimerRef.current)
      nextSentenceTimerRef.current = null
    }
    
    if (audioRef.current) { 
      try { 
        audioRef.current.pause()
        audioRef.current.onended = null
      } catch { } 
      audioRef.current = null 
    }
    
    try {
      if (!token) {
        setError('Authentication required')
        setSentence(null)
        return
      }

      const url = `/api/UserLearning/next`

      const result = await get<UserLearningSentenceDto>(url, token)

      if (!isMountedRef.current) return
      
      setSentence(result)
      
      // Start automatic audio playback
      const timerId = setTimeout(() => {
        allTimersRef.current.delete(timerId)
        if (isMountedRef.current) {
          playAudioAutomatically(result)
        }
      }, 1000) as unknown as number
      allTimersRef.current.add(timerId)
      
    } catch (err: any) {
      if (!isMountedRef.current) return
      setError(err.message || String(err))
      setSentence(null)
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }

  function getAudioSrc(url?: string) {
    if (!url) return null
    return url.startsWith('http') ? url : 'https://aznet.io.vn' + url
  }

  function playAudioAutomatically(sent: UserLearningSentenceDto) {
    if (!isMountedRef.current) return
    
    const src = getAudioSrc(sent.audioUrl)
    if (!src) {
      // If no audio, move to next sentence after 5 seconds
      const timerId = setTimeout(() => {
        allTimersRef.current.delete(timerId)
        if (isMountedRef.current) {
          fetchSentence()
        }
      }, 5000) as unknown as number
      nextSentenceTimerRef.current = timerId
      allTimersRef.current.add(timerId)
      return
    }

    // Stop any existing audio
    if (audioRef.current) {
      try { 
        audioRef.current.pause()
        audioRef.current.onended = null
      } catch { }
      audioRef.current = null
    }

    const a = new Audio(src)
    audioRef.current = a
    setPlaying(true)
    
    a.play().catch(err => { 
      console.error('Audio play failed:', err)
      if (!isMountedRef.current) return
      setPlaying(false)
      // Move to next sentence if audio fails
      const timerId = setTimeout(() => {
        allTimersRef.current.delete(timerId)
        if (isMountedRef.current) {
          fetchSentence()
        }
      }, 5000) as unknown as number
      nextSentenceTimerRef.current = timerId
      allTimersRef.current.add(timerId)
    })
    
    a.onended = () => {
      if (!isMountedRef.current) return
      
      setPlaying(false)
      audioRef.current = null
      
      playCountRef.current = playCountRef.current + 1
      setPlayCount(playCountRef.current)
      
      if (playCountRef.current < 2) {
        // Play again for the second time
        const timerId = setTimeout(() => {
          allTimersRef.current.delete(timerId)
          if (isMountedRef.current) {
            playAudioAutomatically(sent)
          }
        }, 500) as unknown as number
        allTimersRef.current.add(timerId)
      } else {
        // Played twice, wait 5 seconds then fetch next sentence
        const timerId = setTimeout(() => {
          allTimersRef.current.delete(timerId)
          if (isMountedRef.current) {
            fetchSentence()
          }
        }, 5000) as unknown as number
        nextSentenceTimerRef.current = timerId
        allTimersRef.current.add(timerId)
      }
    }
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

  function goToNext() {
    // Clear timer if manually navigating
    if (nextSentenceTimerRef.current) {
      clearTimeout(nextSentenceTimerRef.current)
      allTimersRef.current.delete(nextSentenceTimerRef.current)
      nextSentenceTimerRef.current = null
    }
    fetchSentence()
  }

  return (
    <div className="d-flex flex-column justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
      <div className="w-100 mb-3" style={{ maxWidth: 720 }}>
        <h4>Quickly Learning</h4>
      </div>

      {loading && <div className="text-muted">Loading...</div>}
      {error && <div className="alert alert-danger">{error}</div>}
      {!loading && !sentence && <div className="text-muted">No sentence available</div>}

      {sentence && (
        <div className="w-100" style={{ maxWidth: 720 }}>
          <div className="card text-center">
            <div className="card-body">
              <div className="mb-2">
                <span className="badge bg-warning">Plays: {playCount}/2</span>
              </div>
              
              <h2 className="card-title mb-3">{sentence.original}</h2>
              <p className='mb-3'>{sentence.transcription}</p>
              <p className='mb-3 '>{sentence.vietnamese}</p>
              
              <div className="mb-3 main-btn-group">
                <button className="btn btn-outline-primary me-2" onClick={togglePlay}>
                  {playing ? '⏸ Pause' : '▶ Play'}
                </button>
                <button className="btn btn-outline-success" onClick={goToNext}>
                  Next →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
