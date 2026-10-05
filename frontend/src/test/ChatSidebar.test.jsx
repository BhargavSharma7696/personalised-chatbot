import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ChatSidebar } from '../components/chat/ChatSidebar'
import { SidebarProvider } from '../components/ui/sidebar'
import { TooltipProvider } from '../components/ui/tooltip'
import { ChatContext } from '../context/ChatContext'

describe('ChatSidebar', () => {
  it('renders New Chat button and list of past chats', () => {
    const startNewChat = vi.fn()
    const selectChat = vi.fn()
    const mockContext = {
      chats: [
        { thread: 'thread-1', title: 'First Conversation', updated_at: '2026-10-06' },
        { thread: 'thread-2', title: 'Second Conversation', updated_at: '2026-10-06' },
      ],
      activeThread: 'thread-1',
      startNewChat,
      selectChat,
    }

    render(
      <TooltipProvider>
        <SidebarProvider>
          <ChatContext.Provider value={mockContext}>
            <ChatSidebar />
          </ChatContext.Provider>
        </SidebarProvider>
      </TooltipProvider>
    )

    expect(screen.getByText('New Chat')).toBeInTheDocument()
    expect(screen.getByText('First Conversation')).toBeInTheDocument()
    expect(screen.getByText('Second Conversation')).toBeInTheDocument()

    fireEvent.click(screen.getByText('New Chat'))
    expect(startNewChat).toHaveBeenCalled()

    fireEvent.click(screen.getByText('Second Conversation'))
    expect(selectChat).toHaveBeenCalledWith('thread-2')
  })

  it('renders empty state when there are no chats', () => {
    const mockContext = {
      chats: [],
      activeThread: 'thread-new',
      startNewChat: vi.fn(),
      selectChat: vi.fn(),
    }

    render(
      <TooltipProvider>
        <SidebarProvider>
          <ChatContext.Provider value={mockContext}>
            <ChatSidebar />
          </ChatContext.Provider>
        </SidebarProvider>
      </TooltipProvider>
    )

    expect(screen.getByText(/no conversations yet/i)).toBeInTheDocument()
  })
})
