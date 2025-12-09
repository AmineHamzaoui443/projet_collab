import React from 'react'
import { Navigate } from 'react-router-dom'

function getSessionUser() {
  try {
    const s = localStorage.getItem('sessionUser')
    return s ? JSON.parse(s) : null
  } catch {
    return null
  }
}

// Simple route guard used in development that checks the session user's role.
// If the user is not an admin, redirect to /products (acts as a 403 redirect).
export default function RequireAdmin({ children }: { children: React.ReactNode }) {
  const user = typeof window !== 'undefined' ? getSessionUser() : null
  if (!user || user.role !== 'admin') {
    return <Navigate to="/products" replace />
  }
  return <>{children}</>
}
