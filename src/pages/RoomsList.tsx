import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/apiClient'
import { Room } from '../types'

// ProductsList is a theme rename: API endpoints now exposed at /api/products
// but the underlying DB table remains `rooms`.
export default function ProductsList() {
  const qc = useQueryClient()
  const [name, setName] = useState('')
  const [editing, setEditing] = useState<null | { id: number; name: string; capacity?: number; description?: string }>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newProductName, setNewProductName] = useState('')
  const [newProductDesc, setNewProductDesc] = useState('')
  const [newProductCapacity, setNewProductCapacity] = useState<number | ''>(1)
  const [alert, setAlert] = useState<{ type: 'success'|'danger', message: string } | null>(null)

  function getSessionUser() {
    try { const s = localStorage.getItem('sessionUser'); return s ? JSON.parse(s) : null } catch { return null }
  }
  const sessionUser = getSessionUser()

  const { data, isLoading, error } = useQuery<Room[]>({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await api.get('/products')
      return res.data
    },
  })

  const create = useMutation(async (payload: Partial<Room>) => {
    const res = await api.post('/products', payload)
    return res.data
  }, {
    onSuccess() { qc.invalidateQueries(['products']) }
  })

  const remove = useMutation(async (id: number) => {
    await api.delete(`/products/${id}`)
  }, { onSuccess() { qc.invalidateQueries(['products']) } })

  const saveEdit = useMutation(async (payload: Partial<Room> & { id: number }) => {
    const res = await api.put(`/products/${payload.id}`, payload)
    return res.data
  }, { onSuccess() { qc.invalidateQueries(['products']); setEditing(null); } })

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name) return
    await create.mutateAsync({ name })
    setName('')
  }

  if (isLoading) return <div>Loading...</div>
  if (error) {
    // Surface error details for debugging
    // eslint-disable-next-line no-console
    console.error('RoomsList error', error)
    const msg = (error as any)?.response?.data?.error || (error as any)?.message || 'Error loading rooms'
    return <div style={{ color: 'red' }}>Error loading rooms: {msg}</div>
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center">
        <h2>Products</h2>
        {sessionUser?.role === 'admin' ? (
          <div>
            <button className="btn btn-success" onClick={() => setShowAddModal(true)}>Add</button>
          </div>
        ) : null}
      </div>

      <div className="row mt-3">
        {data?.map(r => (
          <div className="col-12 col-md-6 col-lg-4 mb-3" key={r.id}>
            <div className="card card-hover">
              <div className="card-body">
                <h5 className="card-title">{r.name}</h5>
                <p className="card-text">{r.description}</p>
                <div>
                  {sessionUser?.role === 'admin' && (
                    <button className="btn btn-sm btn-primary me-2" onClick={() => setEditing({ id: r.id, name: r.name, capacity: r.capacity, description: r.description })}><i className="bi bi-pencil" /> Edit</button>
                  )}
                  {sessionUser?.role === 'admin' && (
                    <button className="btn btn-sm btn-danger" onClick={() => remove.mutate(r.id)}><i className="bi bi-trash" /> Delete</button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {alert && <div className={`alert alert-${alert.type} mt-3`}>{alert.message}</div>}

      {/* Add Modal */}
      {showAddModal && (
        <div className="modal show d-block" tabIndex={-1} role="dialog">
          <div className="modal-dialog" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add Product</h5>
                <button type="button" className="btn-close" onClick={() => setShowAddModal(false)} aria-label="Close"></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Name</label>
                  <input className="form-control" value={newProductName} onChange={(e) => setNewProductName(e.target.value)} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Capacity (optional)</label>
                  <input className="form-control" type="number" value={newProductCapacity as any} onChange={(e) => setNewProductCapacity(e.target.value ? Number(e.target.value) : '')} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Description</label>
                  <textarea className="form-control" value={newProductDesc} onChange={(e) => setNewProductDesc(e.target.value)} />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={async () => {
                  if (!newProductName.trim()) { setAlert({ type: 'danger', message: 'Name is required' }); return }
                  try {
                    await create.mutateAsync({ name: newProductName.trim(), description: newProductDesc, capacity: newProductCapacity || 1 })
                    setAlert({ type: 'success', message: 'Product created' })
                    setShowAddModal(false)
                    setNewProductName('')
                    setNewProductDesc('')
                    setNewProductCapacity(1)
                  } catch (err: any) {
                    setAlert({ type: 'danger', message: err?.response?.data?.error || String(err) })
                  }
                }}>Create</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal (simple bootstrap markup) */}
      {editing && (
        <div className="modal show d-block" tabIndex={-1} role="dialog">
          <div className="modal-dialog" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Product</h5>
                <button type="button" className="btn-close" onClick={() => setEditing(null)} aria-label="Close"></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Name</label>
                  <input className="form-control" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Capacity</label>
                  <input className="form-control" type="number" value={editing.capacity || 1} onChange={(e) => setEditing({ ...editing, capacity: Number(e.target.value) })} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Description</label>
                  <textarea className="form-control" value={editing.description || ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setEditing(null)}>Cancel</button>
                <button className="btn btn-primary" onClick={() => saveEdit.mutate({ id: editing.id, name: editing.name, capacity: editing.capacity, description: editing.description })}>Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
