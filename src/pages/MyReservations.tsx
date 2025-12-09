import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/apiClient'
import { Booking } from '../types'

function fmt(dt?: string) {
  if (!dt) return ''
  try { return new Date(dt).toLocaleString(undefined, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) } catch { return dt }
}

export default function MyReservations() {
  const qc = useQueryClient()
  const [message, setMessage] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  // Disable retries to avoid long waits on network errors and return data quickly
  // If dev shim session exists, include user_id query param to help server identify the user
  function getSessionUser() {
    try { const s = localStorage.getItem('sessionUser'); return s ? JSON.parse(s) : null } catch { return null }
  }
  const session = getSessionUser()
  const queryKey = session ? ['myBookings', { user_id: session.id }] : ['myBookings']
  const { data, isLoading, isError, error } = useQuery<Booking[]>(queryKey, () => {
    const url = session ? `/book/my?user_id=${encodeURIComponent(session.id)}` : '/book/my'
    return api.get(url).then(r => r.data as Booking[])
  }, { retry: 0 })
  const del = useMutation((id: number) => api.delete(`/book/${id}`), {
    onSuccess: () => {
      qc.invalidateQueries(['myBookings'])
      setMessage('Reservation cancelled')
      setErrorMsg(null)
      setTimeout(() => setMessage(null), 3000)
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { error?: string } }; message?: string }
      const msg = e?.response?.data?.error || e?.message || 'Failed to cancel reservation'
      setErrorMsg(String(msg))
      setMessage(null)
      setTimeout(() => setErrorMsg(null), 4000)
    }
  })

  if (isLoading) return <div className="container mt-3">Loading...</div>
  if (isError) {
    const e = error as { message?: string }
    return <div className="container mt-3 text-danger">Failed to load reservations: {e?.message || 'Server error'}</div>
  }

  return (
    <div className="container mt-3">
      <h2>My Reservations</h2>
      {message && <div className="alert alert-success">{message}</div>}
      {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}
      <div className="list-group">
        {data && data.length ? data.map((b: Booking) => (
          <div key={b.id} className="list-group-item d-flex justify-content-between align-items-start">
            <div>
              <div><strong>Room:</strong> {b.room_name || b.room_id}</div>
              <div><strong>Start:</strong> {fmt(b.start_time)}</div>
              <div><strong>End:</strong> {fmt(b.end_time)}</div>
              <div><strong>Status:</strong> <span className={`badge ${b.status === 'confirmed' ? 'bg-success' : b.status === 'rejected' ? 'bg-danger' : 'bg-warning text-dark'}`}>{b.status || 'pending'}</span></div>
              <div><strong>Notes:</strong> {b.notes}</div>
            </div>
            <div>
              <button className="btn btn-sm btn-danger" onClick={() => { if (confirm('Cancel reservation?')) del.mutate(b.id) }} disabled={del.isLoading}>Cancel</button>
            </div>
          </div>
        )) : <div className="p-3">No reservations found.</div>}
      </div>
    </div>
  )
}
