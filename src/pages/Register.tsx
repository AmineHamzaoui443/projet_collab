import React, { useState } from 'react'
import api from '../lib/apiClient'
import { useNavigate } from 'react-router-dom'

export default function Register() {
  const [name, setName] = useState('')
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
  const res = await api.post('/auth/register', { email, name, password })
  const { user, token } = res.data
  if (token) localStorage.setItem('token', token)
  if (user) localStorage.setItem('sessionUser', JSON.stringify(user))
      navigate('/')
      window.location.reload()
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.response?.data?.message || String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="d-flex justify-content-center mt-5 fade-in">
      <div className="card" style={{ width: 400 }}>
        <div className="card-body">
          <h3 className="card-title">Register</h3>
          <form onSubmit={submit}>
            <div className="mb-3">
              <label className="form-label">Name</label>
              <input className="form-control" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="mb-3">
              <label className="form-label">Password</label>
              <input className="form-control" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div>
              <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? '...' : 'Register'}</button>
            </div>
            {error && <div className="mt-3 alert alert-danger">{error}</div>}
          </form>
        </div>
      </div>
    </div>
  )
}
