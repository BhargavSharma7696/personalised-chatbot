import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { ChatProvider, useChat, AVAILABLE_MODELS } from '../context/ChatContext'

describe('ChatContext', () => {
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

  it('initializes with default model gpt-oss-120b and a local thread ID', () => {
    const { result } = renderHook(() => useChat(), { wrapper: ChatProvider })
    expect(result.current.selectedModel).toBe('gpt-oss-120b')
    expect(result.current.activeThread).toBeDefined()
    expect(result.current.messages).toEqual([])
    expect(result.current.isGenerating).toBe(false)
  })

  it('startNewChat does NOT hit backend and generates a new local UUID', () => {
    const fetchSpy = vi.spyOn(global, 'fetch')
    const { result } = renderHook(() => useChat(), { wrapper: ChatProvider })
    const initialThread = result.current.activeThread

    // Clear initial fetchChats call on mount
    fetchSpy.mockClear()

    act(() => {
      result.current.startNewChat()
    })

    expect(result.current.activeThread).not.toBe(initialThread)
    expect(result.current.messages).toEqual([])
    // Must NOT hit backend when starting new chat
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('updates selectedModel correctly', () => {
    const { result } = renderHook(() => useChat(), { wrapper: ChatProvider })
    act(() => {
      result.current.setSelectedModel('stealth/space-bunny-alpha')
    })
    expect(result.current.selectedModel).toBe('stealth/space-bunny-alpha')
  })

  it('provides available models defined in backend', () => {
    expect(AVAILABLE_MODELS).toHaveLength(3)
    expect(AVAILABLE_MODELS.map((m) => m.id)).toEqual([
      'gpt-oss-120b',
      'stealth/space-bunny-alpha',
      'nvidia/nemotron-3',
    ])
  })

  it('fetches chats on mount or via fetchChats', async () => {
    const mockChats = [
      { thread: 'thread-1', title: 'Chat 1', updated_at: '2026-10-06' },
    ]
    vi.spyOn(global, 'fetch').mockImplementation((url) => {
      if (typeof url === 'string' && url.includes('/listchats')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ chats: mockChats }),
        })
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })

    const { result } = renderHook(() => useChat(), { wrapper: ChatProvider })
    await act(async () => {
      await result.current.fetchChats()
    })

    expect(result.current.chats).toEqual(mockChats)
  })

  it('selectChat loads history from /chat/{thread_id}', async () => {
    const mockHistory = {
      data: [
        { type: 'human', content: 'Hello' },
        { type: 'ai', content: 'Hi there!' },
      ],
    }
    vi.spyOn(global, 'fetch').mockImplementation((url) => {
      if (typeof url === 'string' && url.includes('/chat/thread-123')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockHistory,
        })
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ chats: [] }),
      })
    })

    const { result } = renderHook(() => useChat(), { wrapper: ChatProvider })
    await act(async () => {
      await result.current.selectChat('thread-123')
    })

    expect(result.current.activeThread).toBe('thread-123')
    expect(result.current.messages).toEqual([
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi there!' },
    ])
  })

  it('sendMessage sends model, message, and thread, and streams SSE chunks', async () => {
    // Mock SSE stream reader
    const sseChunks = [
      'data: {"content": "Hello "}\n\n',
      'data: {"content": "world!"}\n\n',
    ]
    let chunkIndex = 0

    const mockStream = new ReadableStream({
      pull(controller) {
        if (chunkIndex < sseChunks.length) {
          controller.enqueue(new TextEncoder().encode(sseChunks[chunkIndex++]))
        } else {
          controller.close()
        }
      },
    })

    let sentPayload = null
    vi.spyOn(global, 'fetch').mockImplementation((url, options) => {
      if (url === '/chat') {
        sentPayload = JSON.parse(options.body)
        return Promise.resolve({
          ok: true,
          body: mockStream,
        })
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ chats: [] }),
      })
    })

    const { result } = renderHook(() => useChat(), { wrapper: ChatProvider })

    await act(async () => {
      await result.current.sendMessage('How are you?')
    })

    // Verify payload contract
    expect(sentPayload).toBeDefined()
    expect(sentPayload.message).toBe('How are you?')
    expect(sentPayload.model).toBe('gpt-oss-120b')
    expect(sentPayload.thread).toBe(result.current.activeThread)

    // Verify messages accumulated
    expect(result.current.messages).toEqual([
      { role: 'user', content: 'How are you?' },
      { role: 'assistant', content: 'Hello world!' },
    ])
  })
})
