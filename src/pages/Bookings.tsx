import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/apiClient'
import { Booking } from '../types'

export default function Bookings() {
  const [roomId, setRoomId] = useState<number | ''>('')
  const [filterUser, setFilterUser] = useState('')
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  interface AppliedFilters {
    filterUser?: string
    filterFrom?: string
    filterTo?: string
    filterStatus?: string
    roomId?: number | ''
  }
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters | null>(null)
  const [toast, setToast] = useState<{ type: 'success'|'info'|'danger', message: string } | null>(null)

  const qc = useQueryClient()
  const { data, isLoading, error } = useQuery<Booking[]>({
    queryKey: ['bookings', appliedFilters],
    queryFn: async () => {
      const params: Record<string, string | number> = {}
      if (appliedFilters) {
        const { filterUser: fu, filterFrom: ff, filterTo: ft, filterStatus: fs, roomId: rid } = appliedFilters
        if (fu) params.user = fu
        if (ff) params.date_from = ff
        if (ft) params.date_to = ft
        if (fs) params.status = fs
        if (rid) params.room_id = rid
      }
      const res = await api.get('/book', { params })
      return res.data as Booking[]
    },
  })

  const remove = useMutation(async (id: number) => {
    await api.delete(`/book/${id}`)
  }, { onSuccess() { qc.invalidateQueries(['bookings']) } })

  const updateStatus = useMutation(async ({ id, status }: { id: number; status: string }) => {
    const res = await api.patch(`/book/${id}/status`, { status })
    return res.data
  }, { onSuccess(data) { qc.invalidateQueries(['bookings']); setToast({ type: 'success', message: `Status updated: ${data.status}` }); setTimeout(() => setToast(null), 2500) } })

  if (isLoading) return <div>Loading...</div>
  if (error) {
    console.error('Bookings error', error)
    const e = error as { response?: { data?: { error?: string } }; message?: string }
    const msg = e?.response?.data?.error || e?.message || 'Error loading bookings'
    return <div style={{ color: 'red' }}>Error loading bookings: {msg}</div>
  }

  return (
    <div>
      <h2>Bookings</h2>
      {toast && <div className={`alert alert-${toast.type}`}>{toast.message}</div>}

      <div className="card mb-3">
        <div className="card-body">
          <form className="row g-2" onSubmit={(e) => e.preventDefault()}>
            <div className="col-md-3">
              <input className="form-control" placeholder="User name or email" value={filterUser} onChange={(e) => setFilterUser(e.target.value)} />
            </div>
            <div className="col-md-2">
              <input className="form-control" type="date" placeholder="From" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} />
            </div>
            <div className="col-md-2">
              <input className="form-control" type="date" placeholder="To" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} />
            </div>
            <div className="col-md-2">
              <select className="form-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="">Any status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div className="col-md-3 d-flex gap-2">
              <button className="btn btn-primary" onClick={() => { setAppliedFilters({ filterUser, filterFrom, filterTo, filterStatus, roomId }); setToast({ type: 'info', message: 'Filters applied' }); setTimeout(() => setToast(null), 1800) }}>Apply</button>
              <button className="btn btn-secondary" onClick={() => { setFilterUser(''); setFilterFrom(''); setFilterTo(''); setFilterStatus(''); setRoomId(''); setAppliedFilters(null); setToast({ type: 'info', message: 'Filters reset' }); setTimeout(() => setToast(null), 1800) }}>Reset</button>
            </div>
          </form>
        </div>
      </div>

      <div className="table-responsive">
        <table className="table table-striped">
          <thead>
            <tr>
              <th>ID</th>
              <th>Room</th>
              <th>User</th>
              <th>Start</th>
              <th>End</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data?.map(b => {
              const startT = new Date(b.start_time).getTime()
              const endT = new Date(b.end_time).getTime()
              const overlap = data?.some(other => other.id !== b.id && other.room_id === b.room_id && ( (new Date(other.start_time).getTime() < endT) && (new Date(other.end_time).getTime() > startT) ))
              return (
                <tr key={b.id} className={overlap ? 'table-danger' : ''}>
                    <td>{b.id}</td>
                    <td>{b.room_name || b.room_id}</td>
                    <td>{b.user_name || b.user_email || b.user_id}</td>
                    <td>{new Date(b.start_time).toLocaleString(undefined, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                    <td>{new Date(b.end_time).toLocaleString(undefined, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                    <td>
                      <span className={`badge ${b.status === 'confirmed' ? 'bg-success' : b.status === 'rejected' ? 'bg-danger' : 'bg-warning text-dark'}`}>{b.status || 'pending'}</span>
                    </td>
                    <td>
                    {b.status !== 'confirmed' && <button className="btn btn-sm btn-success me-1" onClick={() => updateStatus.mutate({ id: b.id, status: 'confirmed' })}>Approve</button>}
                    {b.status !== 'rejected' && <button className="btn btn-sm btn-warning me-1" onClick={() => updateStatus.mutate({ id: b.id, status: 'rejected' })}>Reject</button>}
                    <button className="btn btn-sm btn-danger" onClick={() => remove.mutate(b.id)}>Delete</button>
                    </td>
                  </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
