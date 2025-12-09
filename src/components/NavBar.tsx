import React from 'react'
import { Navbar, Nav, Container, NavDropdown } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'

function getSessionUser() {
  try {
    const s = localStorage.getItem('sessionUser')
    return s ? JSON.parse(s) : null
  } catch {
    return null
  }
}

export default function NavBar() {
  const navigate = useNavigate()
  const user = getSessionUser()

  function logout() {
    localStorage.removeItem('sessionUser')
    navigate('/')
    window.location.reload()
  }

  // Derive simple role flags for rendering
  const isLoggedIn = !!user
  const isAdmin = !!user && user.role === 'admin'

  return (
    <Navbar bg="light" expand="lg" className="mb-3">
      <Container>
        <Navbar.Brand as={Link} to="/">Product Rental App</Navbar.Brand>
        <Navbar.Toggle aria-controls="main-nav" />
        <Navbar.Collapse id="main-nav">
          <Nav className="me-auto">
            {/* Always visible */}
            <Nav.Link as={Link} to="/products">Products</Nav.Link>

            {/* Admin-only booking management */}
            {isAdmin && <Nav.Link as={Link} to="/bookings">Bookings</Nav.Link>}

            {/* Logged-in users can book and view reservations */}
            {isLoggedIn && (
              <>
                <Nav.Link as={Link} to="/rent-product">Rent Product</Nav.Link>
                <Nav.Link as={Link} to="/my-reservations">My Reservations</Nav.Link>
              </>
            )}
          </Nav>
          <Nav>
            {isLoggedIn ? (
              <NavDropdown title={user.name || user.email || 'User'} id="user-menu">
                <NavDropdown.Item onClick={logout}>Logout</NavDropdown.Item>
              </NavDropdown>
            ) : (
              <>
                <Nav.Link as={Link} to="/login">Login</Nav.Link>
                <Nav.Link as={Link} to="/register">Register</Nav.Link>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  )
}
