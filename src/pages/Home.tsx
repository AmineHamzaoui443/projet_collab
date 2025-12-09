import React from 'react'
import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="container mt-4">
      <div className="p-5 mb-4 bg-white rounded-3 shadow-sm">
        <h1 className="display-6">Product Rental App</h1>
        <p className="lead">Manage products and rentals with a simple interface.</p>
        <div>
          <Link to="/products" className="btn btn-primary me-2">Products</Link>
          <Link to="/bookings" className="btn btn-outline-primary">Bookings</Link>
        </div>
      </div>
    </div>
  )
}
