import React, { useState } from 'react'
import api from '../lib/apiClient'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
  const res = await api.post('/auth/login', { email, password })
  const { user, token } = res.data
  if (token) localStorage.setItem('token', token)
  if (user) localStorage.setItem('sessionUser', JSON.stringify(user))
      navigate('/')
      window.location.reload()
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string; response?: { data?: { error?: string; message?: string } } }
      const msg = e?.code === 'ECONNABORTED' || (e?.message && e.message.includes('timeout')) ? 'Request timed out. Please check your network or that the backend is running.' : (e?.response?.data?.error || e?.response?.data?.message || String(e))
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="d-flex justify-content-center mt-5 fade-in">
      <div className="card" style={{ width: 360 }}>
        <div className="card-body">
          <h3 className="card-title">Login</h3>
          <form onSubmit={submit}>
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="mb-3">
              <label className="form-label">Password</label>
              <input className="form-control" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div>
              <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? '...' : 'Login'}</button>
            </div>
            {error && <div className="mt-3 alert alert-danger">{error}</div>}
          </form>
        </div>
      </div>
    </div>
  )
}
