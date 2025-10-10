import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Home from '../pages/Home'
import Login from '../pages/Login'
import Register from '../pages/Register'
import RoomsList from '../pages/RoomsList'
import RoomDetail from '../pages/RoomDetail'
import Bookings from '../pages/Bookings'
import BookRoom from '../pages/BookRoom'
import MyReservations from '../pages/MyReservations'
import RequireAdmin from '../components/RequireAdmin'

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/rooms" element={<RoomsList />} />
      <Route path="/rooms/:id" element={<RoomDetail />} />
      <Route path="/bookings" element={
        <RequireAdmin>
          <Bookings />
        </RequireAdmin>
      } />
  <Route path="/book-room" element={<BookRoom />} />
  <Route path="/my-reservations" element={<MyReservations />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
