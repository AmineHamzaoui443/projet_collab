export interface User {
  id: number
  email?: string
  name?: string
  role?: string
}

export interface Room {
  id: number
  name: string
  description?: string
  capacity: number
}

export interface Booking {
  id: number
  room_name: string
  room_id: number
  user_id?: number
  user_name?: string
  user_email?: string
  status?: string
  start_time: string
  end_time: string
}
