import React, { useState } from 'react'
import { graphql } from '../utils/api'
import { setToken } from '../utils/auth'

export default function LoginForm({ onLogin }: { onLogin: (token: string) => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const query = `mutation($u:String!,$p:String!){ login(username:$u,password:$p){ token user{ id username } } }`
      const data = await graphql(query, { u: username, p: password })
  const token = data.login.token
  setToken(token)
  onLogin(token)
    } catch (err: any) {
      setError(err.message || String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card mx-auto" style={{ maxWidth: 480 }}>
      <div className="card-body">
        <h5 className="card-title">Login</h5>
        {error && <div className="alert alert-danger">{error}</div>}
        <form onSubmit={submit}>
          <div className="mb-3">
            <label className="form-label">Username</label>
            <input className="form-control" value={username} onChange={e => setUsername(e.target.value)} />
          </div>
          <div className="mb-3">
            <label className="form-label">Password</label>
            <input type="password" className="form-control" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <button className="btn btn-primary" disabled={loading}>{loading ? 'Logging...' : 'Login'}</button>
        </form>
      </div>
    </div>
  )
}
