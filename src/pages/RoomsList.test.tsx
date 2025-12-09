import React from 'react'
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import RoomsList from './RoomsList'
import api from '../lib/apiClient'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { fireEvent } from '@testing-library/react'
import type { Room } from '../types'

vi.mock('../lib/apiClient', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
  }
}))

// typed mocks are not necessary here; use `any` for mock functions

function createQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
}

describe('RoomsList (ProductsList)', () => {
  beforeEach(() => {
    // reset mock
    ;(api.get as unknown as any)?.mockReset()
  })

  afterEach(() => {
    cleanup()
    vi.resetAllMocks()
  })

  it('renders Loading... initially', async () => {
    const products: Room[] = [{ id: 1, name: 'MacBook', description: 'Apple laptop', capacity: 1 }]
    ;(api.get as unknown as any).mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve({ data: products }), 50)))

    render(
      <QueryClientProvider client={createQueryClient()}>
        <MemoryRouter>
          <RoomsList />
        </MemoryRouter>
      </QueryClientProvider>
    )

    // Loading should appear
    expect(screen.getByText('Loading...')).toBeInTheDocument()

    // wait for data to render
    expect(await screen.findByText('MacBook')).toBeInTheDocument()
  })

  it('renders products returned by API', async () => {
    const products: Room[] = [
      { id: 1, name: 'MacBook', description: 'Apple laptop', capacity: 1 },
      { id: 2, name: 'Deluxe Room', description: 'Spacious', capacity: 4 },
    ]
    ;(api.get as unknown as any).mockResolvedValue({ data: products })

    render(
      <QueryClientProvider client={createQueryClient()}>
        <MemoryRouter>
          <RoomsList />
        </MemoryRouter>
      </QueryClientProvider>
    )

    expect(await screen.findByText('MacBook')).toBeInTheDocument()
    expect(await screen.findByText('Deluxe Room')).toBeInTheDocument()
  })

  it('handles empty product list', async () => {
    ;(api.get as unknown as any).mockResolvedValue({ data: [] })

    const { container } = render(
      <QueryClientProvider client={createQueryClient()}>
        <MemoryRouter>
          <RoomsList />
        </MemoryRouter>
      </QueryClientProvider>
    )

    await waitFor(() => expect((api.get as unknown as any).mock.calls.length).toBeGreaterThanOrEqual(1))

    const titles = container.querySelectorAll('.card-title')
    expect(titles.length).toBe(0)
    expect(await screen.findByText('Products')).toBeInTheDocument()
  })

  it('shows an error message when API fails', async () => {
    ;(api.get as unknown as any).mockRejectedValue(new Error('Network error'))

    render(
      <QueryClientProvider client={createQueryClient()}>
        <MemoryRouter>
          <RoomsList />
        </MemoryRouter>
      </QueryClientProvider>
    )

    expect(await screen.findByText(/^Error loading rooms/i)).toBeInTheDocument()
  })

  it('admin can open Add modal and create a product', async () => {
    // Set admin session
    localStorage.setItem('sessionUser', JSON.stringify({ id: 1, role: 'admin' }))
    const products: Room[] = [{ id: 1, name: 'Sample', description: 'x', capacity: 1 }]
    ;(api.get as unknown as any).mockResolvedValue({ data: products })
    const postMock = (api.post as unknown as any)
    postMock.mockResolvedValue({ data: { id: 2, name: 'NewProd', description: 'd', capacity: 2 } })

    render(
      <QueryClientProvider client={createQueryClient()}>
        <MemoryRouter>
          <RoomsList />
        </MemoryRouter>
      </QueryClientProvider>
    )

    // wait for product to render
    expect(await screen.findByText('Sample')).toBeInTheDocument()

    // Open modal
    const addBtn = screen.getByText('Add')
    addBtn.click()

    // Fill form
    const nameInput = await screen.findByLabelText('Name')
    const descInput = screen.getByLabelText('Description')
    const capInput = screen.getByLabelText('Capacity (optional)')
    fireEvent.change(nameInput, { target: { value: 'NewProd' } })
    fireEvent.change(descInput, { target: { value: 'd' } })
    fireEvent.change(capInput, { target: { value: '2' } })

    const createBtn = screen.getByText('Create')
    createBtn.click()

    await waitFor(() => expect(postMock).toHaveBeenCalled())
    expect(await screen.findByText(/Product created/i)).toBeInTheDocument()
    localStorage.removeItem('sessionUser')
  })

  it('admin can edit and delete a product', async () => {
    localStorage.setItem('sessionUser', JSON.stringify({ id: 1, role: 'admin' }))
    const products: Room[] = [{ id: 10, name: 'Editable', description: 'desc', capacity: 1 }]
    ;(api.get as unknown as any).mockResolvedValue({ data: products })
    const putMock = (api.put as unknown as any)
    putMock.mockResolvedValue({ data: { id: 10, name: 'Edited', description: 'desc', capacity: 1 } })
    const delMock = (api.delete as unknown as any)
    delMock.mockResolvedValue({})

    render(
      <QueryClientProvider client={createQueryClient()}>
        <MemoryRouter>
          <RoomsList />
        </MemoryRouter>
      </QueryClientProvider>
    )

    expect(await screen.findByText('Editable')).toBeInTheDocument()

    const editBtn = screen.getByText('Edit')
    editBtn.click()

    const editName = await screen.findByLabelText('Name')
    fireEvent.change(editName, { target: { value: 'Edited' } })

    const saveBtn = screen.getByText('Save')
    saveBtn.click()
    await waitFor(() => expect(putMock).toHaveBeenCalled())

    const delBtn = screen.getByText('Delete')
    fireEvent.click(delBtn)
    await waitFor(() => expect(delMock).toHaveBeenCalled())

    localStorage.removeItem('sessionUser')
  })

  it('non-admin does not see admin controls', async () => {
    localStorage.setItem('sessionUser', JSON.stringify({ id: 2, role: 'user' }))
    const products: Room[] = [{ id: 5, name: 'NoAdmin', description: '', capacity: 1 }]
    ;(api.get as unknown as any).mockResolvedValue({ data: products })

    render(
      <QueryClientProvider client={createQueryClient()}>
        <MemoryRouter>
          <RoomsList />
        </MemoryRouter>
      </QueryClientProvider>
    )

    expect(await screen.findByText('NoAdmin')).toBeInTheDocument()
    expect(screen.queryByText('Add')).toBeNull()
    expect(screen.queryByText('Edit')).toBeNull()
    expect(screen.queryByText('Delete')).toBeNull()
    localStorage.removeItem('sessionUser')
  })
})
