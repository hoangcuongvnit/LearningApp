import React, { useEffect, useRef, useState } from 'react'
import { graphql } from '../utils/api'

type Sentence = { id: string; english: string; vietnamese: string; audioUrl?: string }

export default function ReviewView({ token }: { token?: string }) {
  const [sentence, setSentence] = useState<Sentence | null>(null)
  const [index, setIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showEN, setshowEN] = useState(false)
  const [playing, setPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [userId, setUserId] = useState<number | null>(null)
  const [emptyMessage, setEmptyMessage] = useState<string | null>(null)
  const [isAutoSet, setIsAutoSet] = useState(true)

  useEffect(() => {
    if (index === 0) {
      // try to fetch server-side reviewStudySentence for this user on first load
      fetchInitial()
    } else {
      fetchOne(index)
    }
    // cleanup audio when unmount
    return () => {
      if (audioRef.current) {
        try { audioRef.current.pause() } catch { }
        audioRef.current = null
      }
    }
  }, [index, token])

  useEffect(() => {
    if (isAutoSet && sentence) {
      const timeout = setTimeout(() => {
        if (showEN) setIsAutoSet(false)
        setshowEN(!showEN)
      }, 4000)
      return () => clearTimeout(timeout)
    }
  }, [sentence, showEN, isAutoSet])

  async function fetchInitial() {
    setLoading(true)
    setError(null)
    setEmptyMessage(null)
    setshowEN(false)
    setPlaying(false)
    if (audioRef.current) { try { audioRef.current.pause() } catch { } audioRef.current = null }
    try {
      if (!token) {
        // not authenticated: fall back to regular fetch
        await fetchOne(0)
        return
      }

      // get user id
      const meQ = `query{ me { id } }`
      const meData = await graphql(meQ, {}, token)
      const uid = meData?.me?.id
      if (!uid) {
        await fetchOne(0)
        return
      }
      setUserId(uid)

      // request reviewStudySentence (Query)
      const q2 = `query($userId:Int!){ reviewStudySentence(userId:$userId){ id english vietnamese audioUrl } }`
      const next = await graphql(q2, { userId: uid }, token)
      const ns = next?.reviewStudySentence
      if (!ns) {
        // explicit empty state for review queue
        setSentence(null)
        setEmptyMessage('No review sentence available')
      } else {
        setSentence(ns)
        setEmptyMessage(null)
        setshowEN(false)
      }
    } catch (err: any) {
      setError(err.message || String(err))
      // on error, try the fallback
      try { await fetchOne(0) } catch { }
    } finally {
      setLoading(false)
    }
  }

  function getAudioSrc(url?: string) {
    if (!url) return null
    return url.startsWith('http') ? url : 'https://apis.aznetviet.xyz' + url
  }

  async function fetchOne(i: number) {
    setLoading(true)
    setError(null)
    setEmptyMessage(null)
    setshowEN(false)
    setPlaying(false)
    if (audioRef.current) { try { audioRef.current.pause() } catch { } audioRef.current = null }
    try {
      const query = `query($limit:Int,$offset:Int){ sentences(limit:$limit,offset:$offset){ items{ id english vietnamese audioUrl } total } }`
      const variables = { limit: 1, offset: i }
      const data = await graphql(query, variables, token)
      const items = data?.sentences?.items || []
      if (items.length === 0) {
        setSentence(null)
      } else {
        setSentence(items[0])
      }
    } catch (err: any) {
      setError(err.message || String(err))
    } finally {
      setLoading(false)
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
    a.play().then(() => setPlaying(true)).catch(err => { console.error(err); setPlaying(false) })
    a.onended = () => { setPlaying(false); audioRef.current = null }
  }

  function finish() {
    // mark studied and ask server for the next sentence
    ; (async () => {
      if (!sentence) return
      setError(null)
      if (!token) {
        setError('Not authenticated')
        return
      }
      // stop any playing audio
      if (audioRef.current) {
        try { audioRef.current.pause() } catch { }
        audioRef.current = null
      }
      setPlaying(false)

      try {
        // ensure we have userId
        if (!userId) {
          const meQ = `query{ me { id } }`
          const meData = await graphql(meQ, {}, token)
          const id = meData?.me?.id
          if (!id) throw new Error('Unable to determine current user id')
          setUserId(id)
        }

        const uid = userId ?? (await (async () => {
          const meQ = `query{ me { id } }`
          const meData = await graphql(meQ, {}, token)
          return meData?.me?.id
        })())

        if (!uid) throw new Error('Missing user id')

        const sid = parseInt(String(sentence.id), 10)

        // 1) mark as studied
        const m1 = `mutation($userId:Int!,$sentenceId:Int!){ markSentenceStudied(userId:$userId,sentenceId:$sentenceId){ id } }`
        await graphql(m1, { userId: uid, sentenceId: sid }, token)

        // 2) request next sentence (this is a Query, not a Mutation)
        const q2 = `query($userId:Int!){ reviewStudySentence(userId:$userId){ id english vietnamese audioUrl } }`
        const next = await graphql(q2, { userId: uid }, token)
        const ns = next?.reviewStudySentence
        if (!ns) {
          // fallback: advance by index if server returned nothing
          setIndex(i => i + 1)
        } else {
          setSentence(ns)
          setshowEN(false)
        }
      } catch (err: any) {
        setError(err.message || String(err))
      }
    })()
  }

  return (
    <div className="d-flex flex-column justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
      {loading && <div className="text-muted">Loading...</div>}
      {error && <div className="alert alert-danger">{error}</div>}
      {!loading && !sentence && <div className="text-muted">{emptyMessage ?? 'No sentence available'}</div>}

      {sentence && (
        <div className="w-100" style={{ maxWidth: 720 }}>
          <div className="card text-center">
            <div className="card-body">
              <h2 className="card-title mb-3">{sentence.vietnamese}</h2>
              <div className="mb-3 main-btn-group">
                <button className="btn btn-outline-primary me-2" onClick={togglePlay}>{playing ? '⏸ Pause' : '▶ Play'}</button>
                <button className="btn btn-success me-2" onClick={finish}>Finish</button>
                <button className="btn btn-outline-secondary" onClick={() => setshowEN(s => !s)}>{showEN ? 'Hide English' : 'Show English'}</button>
              </div>

              {showEN && <div className="mt-3 text-muted fs-5 show-text-feature">{sentence.english}</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
