import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from '../App'

describe('App Integration', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.spyOn(global, 'fetch').mockImplementation((url) => {
      if (typeof url === 'string' && url.includes('/listchats')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ chats: [] }),
        })
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ data: [] }),
      })
    })
  })

  it('renders application with sidebar, header, and chat input', () => {
    render(<App />)

    // Check sidebar elements
    expect(screen.getByText('MyChatBot')).toBeInTheDocument()
    expect(screen.getByText('New Chat')).toBeInTheDocument()

    // Check model selector in header & welcome banner
    const modelElements = screen.getAllByText('GPT-OSS 120B')
    expect(modelElements.length).toBeGreaterThanOrEqual(1)

    // Check empty state
    expect(screen.getByText('How can I help you today?')).toBeInTheDocument()

    // Check input area
    expect(screen.getByPlaceholderText(/type your message/i)).toBeInTheDocument()
  })
})
