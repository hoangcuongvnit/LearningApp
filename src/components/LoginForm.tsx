import React, { useState } from 'react'
import { post } from '../utils/api'
import { setTokens } from '../utils/auth'

interface LoginDto {
  email: string
  password: string
}

interface AuthResponseDto {
  email: string
  token: string
  refreshToken: string
  role: string
}

export default function LoginForm({ 
  onLogin,
  onSwitchToRegister
}: { 
  onLogin: (token: string) => void
  onSwitchToRegister?: () => void
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const body: LoginDto = { email, password }
      const data = await post<AuthResponseDto>('/api/Account/login', body)
      setTokens(data.token, data.refreshToken)
      onLogin(data.token)
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
            <label className="form-label">Email</label>
            <input 
              type="email" 
              className="form-control" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Password</label>
            <input 
              type="password" 
              className="form-control" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
            />
          </div>
          <div className="d-grid gap-2">
            <button className="btn btn-primary" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
            {onSwitchToRegister && (
              <button 
                type="button" 
                className="btn btn-link" 
                onClick={onSwitchToRegister}
                disabled={loading}
              >
                Don't have an account? Sign Up
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
