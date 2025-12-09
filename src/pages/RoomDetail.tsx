import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/apiClient'
import { Room, Booking } from '../types'

export default function ProductDetail() {
  const { id } = useParams()
  const qc = useQueryClient()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const { data: room, isLoading } = useQuery<Room>(['room', id], async () => {
    const res = await api.get(`/products/${id}`)
    return res.data
  }, { enabled: !!id })

  const { data: bookings } = useQuery<Booking[]>(['bookings', { room_id: id }], async () => {
    const res = await api.get('/book', { params: { room_id: id } })
    return res.data
  }, { enabled: !!id })

  const update = useMutation(async (payload: Partial<Room>) => {
    const res = await api.put(`/products/${id}`, payload)
    return res.data
  }, { onSuccess() { qc.invalidateQueries(['room', id]); qc.invalidateQueries(['products']) } })

  if (isLoading) return <div>Loading...</div>

  return (
    <div>
      <h2>Product: {room?.name}</h2>
      <p>{room?.description}</p>
      <div className="mb-3">
        <label className="form-label">Edit name</label>
        <input className="form-control" value={name} onChange={(e) => setName(e.target.value)} />
        <label className="form-label mt-2">Edit description</label>
        <textarea className="form-control" value={description} onChange={(e) => setDescription(e.target.value)} />
        <div className="mt-2"><button className="btn btn-primary" onClick={() => update.mutate({ name, description })}>Save</button></div>
      </div>
      <h3>Rentals</h3>
      <ul>
        {bookings?.map(b => (
          <li key={b.id}>{b.start_time} - {b.end_time}</li>
        ))}
      </ul>
    </div>
  )
}
