import React, { useEffect, useState } from 'react'
import api from '../lib/apiClient'

export default function HealthPage() {
  const [info, setInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/health').then(r => setInfo(r.data)).catch(() => setInfo({ status: 'error' })).finally(() => setLoading(false))
  }, [])

  if (loading) return <div>Loading health...</div>

  return (
    <div className="container mt-3">
      <h2>Application Health</h2>
      <div className="card p-3" style={{ maxWidth: 600 }}>
        <div><strong>Status:</strong> {info?.status}</div>
        <div><strong>Database:</strong> {info?.db}</div>
        <div><strong>Backend image:</strong> {info?.backend_image}</div>
        <div><strong>Frontend image:</strong> {info?.frontend_image}</div>
      </div>
    </div>
  )
}
