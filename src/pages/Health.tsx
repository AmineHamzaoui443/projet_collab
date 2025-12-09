import React, { useEffect, useState } from 'react'
import api from '../lib/apiClient'

interface HealthInfo {
  status: string
  db?: string
  backend_image?: string
  frontend_image?: string
}

export default function HealthPage(): JSX.Element {
  const [info, setInfo] = useState<HealthInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/health').then(r => setInfo(r.data as HealthInfo)).catch(() => setInfo({ status: 'error' })).finally(() => setLoading(false))
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
