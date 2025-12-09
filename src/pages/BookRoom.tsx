import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/apiClient'
import { Room } from '../types'

export default function RentProduct() {
  const [date, setDate] = useState('')
  const [productId, setProductId] = useState<string>('')
  const [products, setProducts] = useState<Room[]>([])
  const [notes, setNotes] = useState('')
  const [available, setAvailable] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => { // load products
    api.get('/products').then(r => setProducts(r.data as Room[])).catch(() => setProducts([]))
  }, [])

  useEffect(() => {
    if (!date || !productId) return setAvailable(null)
    // Ensure numeric product_id is sent to backend
    const pid = Number(productId)
    api.get('/book/availability', { params: { room_id: pid, date } })
      .then(r => setAvailable(Boolean((r.data as { available?: boolean }).available)))
      .catch(() => setAvailable(null))
  }, [date, productId])

  const navigate = useNavigate()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (available !== true) return
    setLoading(true)
    try {
      const session = localStorage.getItem('sessionUser') ? JSON.parse(localStorage.getItem('sessionUser')!) : null
      const payload: { room_id: number; notes?: string; user_id?: number; date: string } = { room_id: Number(productId), notes, date }
      if (session && typeof session.id === 'number') payload.user_id = session.id
      await api.post('/book', payload)
      // navigate to my reservations (client-side)
      navigate('/my-reservations')
    } catch (err: unknown) {
      console.error('Booking error', err)
      const ex = err as { response?: { data?: { error?: string } }; message?: string }
      alert(ex?.response?.data?.error || ex?.message || 'Booking failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="container mt-3">
      <h2>Rent a Product</h2>
      <form onSubmit={submit} className="card p-3" style={{ maxWidth: 600 }}>
        <div className="mb-3">
          <label className="form-label">Date</label>
          <input className="form-control" type="date" value={date} onChange={(e) => setDate(e.target.value)} min={new Date().toISOString().slice(0,10)} />
          {available === true && <div className="text-success mt-1"><i className="bi bi-check-circle-fill"/> Available</div>}
          {available === false && <div className="text-danger mt-1"><i className="bi bi-x-circle-fill"/> Not available — please choose another date</div>}
        </div>
        <div className="mb-3">
          <label className="form-label">Product</label>
          <select className="form-select" value={productId} onChange={(e) => setProductId(e.target.value)}>
            <option value="">Choose a product</option>
            {products.map((r: Room) => <option key={r.id} value={String(r.id)}>{r.name}</option>)}
          </select>
        </div>
        <div className="mb-3">
          <label className="form-label">Notes</label>
          <textarea className="form-control" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <button className="btn btn-primary" type="submit" disabled={available !== true || loading}>{loading ? 'Renting...' : 'Rent'}</button>
      </form>
    </div>
  )
}
