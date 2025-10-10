import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/apiClient'

export default function BookRoom() {
  const [date, setDate] = useState('')
  const [roomId, setRoomId] = useState<string>('')
  const [rooms, setRooms] = useState<Array<any>>([])
  const [notes, setNotes] = useState('')
  const [available, setAvailable] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => { // load rooms
    api.get('/rooms').then(r => setRooms(r.data)).catch(() => setRooms([]))
  }, [])

  useEffect(() => {
    if (!date || !roomId) return setAvailable(null)
    // Ensure numeric room_id is sent to backend
    const rid = Number(roomId)
    api.get('/book/availability', { params: { room_id: rid, date } })
      .then(r => setAvailable(Boolean(r.data.available)))
      .catch(() => setAvailable(null))
  }, [date, roomId])

  const navigate = useNavigate()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (available !== true) return
    setLoading(true)
    try {
      const session = localStorage.getItem('sessionUser') ? JSON.parse(localStorage.getItem('sessionUser')!) : null
      const payload: any = { room_id: Number(roomId), notes }
      if (session) payload.user_id = session.id
      payload.date = date
      await api.post('/book', payload)
      // navigate to my reservations (client-side)
      navigate('/my-reservations')
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error('Booking error', err)
      alert(err?.response?.data?.error || 'Booking failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="container mt-3">
      <h2>Book a Room</h2>
      <form onSubmit={submit} className="card p-3" style={{ maxWidth: 600 }}>
        <div className="mb-3">
          <label className="form-label">Date</label>
          <input className="form-control" type="date" value={date} onChange={(e) => setDate(e.target.value)} min={new Date().toISOString().slice(0,10)} />
          {available === true && <div className="text-success mt-1"><i className="bi bi-check-circle-fill"/> Available</div>}
          {available === false && <div className="text-danger mt-1"><i className="bi bi-x-circle-fill"/> Not available — please choose another date</div>}
        </div>
        <div className="mb-3">
          <label className="form-label">Room</label>
          <select className="form-select" value={roomId} onChange={(e) => setRoomId(e.target.value)}>
            <option value="">Choose a room</option>
            {rooms.map((r:any) => <option key={r.id} value={String(r.id)}>{r.name}</option>)}
          </select>
        </div>
        <div className="mb-3">
          <label className="form-label">Notes</label>
          <textarea className="form-control" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <button className="btn btn-primary" type="submit" disabled={available !== true || loading}>{loading ? 'Booking...' : 'Book'}</button>
      </form>
    </div>
  )
}
