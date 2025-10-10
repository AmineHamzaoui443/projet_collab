import React from 'react'
import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="container mt-4">
      <div className="p-5 mb-4 bg-white rounded-3 shadow-sm">
        <h1 className="display-6">Reservation App</h1>
        <p className="lead">Manage rooms and bookings with a simple interface.</p>
        <div>
          <Link to="/rooms" className="btn btn-primary me-2">Rooms</Link>
          <Link to="/bookings" className="btn btn-outline-primary">Bookings</Link>
        </div>
      </div>
    </div>
  )
}
