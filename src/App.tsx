import React from 'react'
import AppRouter from './routes/AppRouter'
import NavBar from './components/NavBar'

export default function App() {
  return (
    <div>
      <NavBar />
      <main style={{ padding: 16 }}>
        <AppRouter />
      </main>
    </div>
  )
}
