import React, { ChangeEvent, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/apiClient'
import { Room } from '../types'

// ProductsList is a theme rename: API endpoints now exposed at /api/products
// but the underlying DB table remains `rooms`.
export default function ProductsList(): JSX.Element {
  const qc = useQueryClient()
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
      return res.data as Room[]
    },
  })

  const create = useMutation(async (payload: Partial<Room>) => {
    const res = await api.post('/products', payload)
    return res.data as Room
  }, {
    onSuccess() { qc.invalidateQueries(['products']) }
  })

  const remove = useMutation(async (id: number) => {
    await api.delete(`/products/${id}`)
  }, { onSuccess() { qc.invalidateQueries(['products']) } })

  const saveEdit = useMutation(async (payload: Partial<Room> & { id: number }) => {
    const res = await api.put(`/products/${payload.id}`, payload)
    return res.data as Room
  }, { onSuccess() { qc.invalidateQueries(['products']); setEditing(null); } })

  // Removed unused `submit` handler and `name` state to satisfy linter.

  if (isLoading) return <div>Loading...</div>
  if (error) {
    // Surface error details for debugging
    console.error('RoomsList error', error)
    const e = error as unknown as { response?: { data?: { error?: string } }; message?: string }
    const msg = e?.response?.data?.error || e?.message || 'Error loading rooms'
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
        {data?.map((r: Room) => (
          <div className="col-12 col-md-6 col-lg-4 mb-3" key={r.id}>
            <div className="card card-hover">
              <div className="card-body">
                <h5 className="card-title">{r.name}</h5>
                <p className="card-text">{r.description}</p>
                <div>
                  {sessionUser?.role === 'admin' && (
                    <>
                      <button className="btn btn-sm btn-primary me-2" onClick={() => setEditing({ id: r.id, name: r.name, capacity: r.capacity, description: r.description })}><i className="bi bi-pencil" /> Edit</button>
                      <button className="btn btn-sm btn-danger" onClick={() => remove.mutate(r.id)}><i className="bi bi-trash" /> Delete</button>
                    </>
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
                  <label htmlFor="addNameInput" className="form-label">Name</label>
                  <input id="addNameInput" className="form-control" value={newProductName} onChange={(e: ChangeEvent<HTMLInputElement>) => setNewProductName(e.target.value)} />
                </div>
                <div className="mb-3">
                  <label htmlFor="addCapacityInput" className="form-label">Capacity (optional)</label>
                  <input id="addCapacityInput" className="form-control" type="number" value={typeof newProductCapacity === 'number' ? newProductCapacity : ''} onChange={(e: ChangeEvent<HTMLInputElement>) => setNewProductCapacity(e.target.value ? Number(e.target.value) : '')} />
                </div>
                <div className="mb-3">
                  <label htmlFor="addDescInput" className="form-label">Description</label>
                  <textarea id="addDescInput" className="form-control" value={newProductDesc} onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setNewProductDesc(e.target.value)} />
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
                  } catch (err: unknown) {
                    const ex = err as { response?: { data?: { error?: string } }; message?: string }
                    setAlert({ type: 'danger', message: ex?.response?.data?.error || ex?.message || String(ex) })
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
                  <label htmlFor="editNameInput" className="form-label">Name</label>
                  <input id="editNameInput" className="form-control" value={editing.name} onChange={(e: ChangeEvent<HTMLInputElement>) => setEditing({ ...editing, name: e.target.value })} />
                </div>
                <div className="mb-3">
                  <label htmlFor="editCapacityInput" className="form-label">Capacity</label>
                  <input id="editCapacityInput" className="form-control" type="number" value={editing.capacity || 1} onChange={(e: ChangeEvent<HTMLInputElement>) => setEditing({ ...editing, capacity: Number(e.target.value) })} />
                </div>
                <div className="mb-3">
                  <label htmlFor="editDescInput" className="form-label">Description</label>
                  <textarea id="editDescInput" className="form-control" value={editing.description || ''} onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setEditing({ ...editing, description: e.target.value })} />
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
