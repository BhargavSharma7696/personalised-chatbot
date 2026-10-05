import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ChatHeader } from '../components/chat/ChatHeader'
import { ChatInput } from '../components/chat/ChatInput'
import { SidebarProvider } from '../components/ui/sidebar'
import { TooltipProvider } from '../components/ui/tooltip'
import { ChatContext, AVAILABLE_MODELS } from '../context/ChatContext'

describe('ChatHeader & ChatInput', () => {
  it('renders model selector with default model', () => {
    const setSelectedModel = vi.fn()
    const mockContext = {
      selectedModel: 'gpt-oss-120b',
      setSelectedModel,
      activeThread: 'thread-1',
      chats: [{ thread: 'thread-1', title: 'Test Thread' }],
      isNewThread: false,
    }

    render(
      <TooltipProvider>
        <SidebarProvider>
          <ChatContext.Provider value={mockContext}>
            <ChatHeader />
          </ChatContext.Provider>
        </SidebarProvider>
      </TooltipProvider>
    )

    expect(screen.getByText('GPT-OSS 120B')).toBeInTheDocument()
    expect(screen.getByText('Test Thread')).toBeInTheDocument()
  })

  it('renders ChatInput and calls sendMessage on send click', () => {
    const sendMessage = vi.fn()
    const mockContext = {
      sendMessage,
      stopGeneration: vi.fn(),
      isGenerating: false,
      error: null,
    }

    render(
      <ChatContext.Provider value={mockContext}>
        <ChatInput />
      </ChatContext.Provider>
    )

    const textarea = screen.getByPlaceholderText(/type your message/i)
    fireEvent.change(textarea, { target: { value: 'Hello bot' } })

    const sendButton = screen.getByRole('button', { name: /send/i })
    fireEvent.click(sendButton)

    expect(sendMessage).toHaveBeenCalledWith('Hello bot')
  })

  it('renders Stop button when isGenerating is true', () => {
    const stopGeneration = vi.fn()
    const mockContext = {
      sendMessage: vi.fn(),
      stopGeneration,
      isGenerating: true,
      error: null,
    }

    render(
      <ChatContext.Provider value={mockContext}>
        <ChatInput />
      </ChatContext.Provider>
    )

    const stopButton = screen.getByRole('button', { name: /stop/i })
    fireEvent.click(stopButton)
    expect(stopGeneration).toHaveBeenCalled()
  })
})
