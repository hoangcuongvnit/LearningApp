import React, { useState } from 'react'
import { post } from '../utils/api'
import { setTokens } from '../utils/auth'

interface RegisterDto {
  email: string
  password: string
  phoneNumber?: string
}

interface AuthResponseDto {
  email: string
  token: string
  refreshToken: string
  role: string
}

export default function RegisterForm({ 
  onRegister, 
  onSwitchToLogin 
}: { 
  onRegister: (token: string) => void
  onSwitchToLogin: () => void
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validate password match
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    // Validate password strength
    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      setLoading(false)
      return
    }

    try {
      const body: RegisterDto = { 
        email, 
        password,
        phoneNumber: phoneNumber || undefined
      }
      
      const data = await post<AuthResponseDto>('/api/Account/register', body)
      setTokens(data.token, data.refreshToken)
      onRegister(data.token)
    } catch (err: any) {
      setError(err.message || String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card mx-auto" style={{ maxWidth: 480 }}>
      <div className="card-body">
        <h5 className="card-title">Create Account</h5>
        {error && <div className="alert alert-danger">{error}</div>}
        <form onSubmit={submit}>
          <div className="mb-3">
            <label className="form-label">Email *</label>
            <input 
              type="email" 
              className="form-control" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
              placeholder="your@email.com"
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Password *</label>
            <input 
              type="password" 
              className="form-control" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
              minLength={6}
              placeholder="Minimum 6 characters"
            />
            <small className="form-text text-muted">
              Must include uppercase, lowercase, digit, and special character
            </small>
          </div>
          <div className="mb-3">
            <label className="form-label">Confirm Password *</label>
            <input 
              type="password" 
              className="form-control" 
              value={confirmPassword} 
              onChange={e => setConfirmPassword(e.target.value)} 
              required 
              placeholder="Re-enter your password"
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Phone Number (optional)</label>
            <input 
              type="tel" 
              className="form-control" 
              value={phoneNumber} 
              onChange={e => setPhoneNumber(e.target.value)} 
              placeholder="+1234567890"
            />
          </div>
          <div className="d-grid gap-2">
            <button className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
            <button 
              type="button" 
              className="btn btn-link" 
              onClick={onSwitchToLogin}
              disabled={loading}
            >
              Already have an account? Login
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
