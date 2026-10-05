import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'

export const AVAILABLE_MODELS = [
  { id: 'gpt-oss-120b', label: 'GPT-OSS 120B', description: 'Fast general-purpose model' },
  { id: 'stealth/space-bunny-alpha', label: 'Space Bunny Alpha', description: 'Specialized alpha model' },
  { id: 'nvidia/nemotron-3', label: 'Nemotron-3', description: 'High-capability ultra model' },
]

export const ChatContext = createContext(null)

export function ChatProvider({ children }) {
  const [chats, setChats] = useState([])
  const [activeThread, setActiveThread] = useState(() => {
    return typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `thread-${Date.now()}`
  })
  const [messages, setMessages] = useState([])
  const [selectedModel, setSelectedModel] = useState('gpt-oss-120b')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isNewThread, setIsNewThread] = useState(true)
  const [error, setError] = useState(null)

  const abortControllerRef = useRef(null)

  // Fetch recent chat threads from /listchats
  const fetchChats = useCallback(async () => {
    try {
      const res = await fetch('/listchats?limit=50&offset=0')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      if (data && Array.isArray(data.chats)) {
        setChats(data.chats)
      }
    } catch (err) {
      console.error('Failed to fetch chats:', err)
    }
  }, [])

  // Initial load of chats
  useEffect(() => {
    fetchChats()
  }, [fetchChats])

  // Start a new chat - DOES NOT call backend!
  const startNewChat = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    const newId = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `thread-${Date.now()}`
    setActiveThread(newId)
    setMessages([])
    setIsNewThread(true)
    setIsGenerating(false)
    setError(null)
  }, [])

  // Select an existing chat and load history
  const selectChat = useCallback(async (threadId) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setActiveThread(threadId)
    setIsNewThread(false)
    setIsGenerating(false)
    setError(null)

    try {
      const res = await fetch(`/chat/${encodeURIComponent(threadId)}`)
      if (!res.ok) throw new Error(`Failed to load chat history: HTTP ${res.status}`)
      const json = await res.json()
      const rawMessages = json.data || []
      const formatted = rawMessages.map((msg) => ({
        role: msg.type === 'human' ? 'user' : 'assistant',
        content: msg.content || '',
      }))
      setMessages(formatted)
    } catch (err) {
      console.error('Error loading chat:', err)
      setError(err.message)
    }
  }, [])

  // Stop currently running generation
  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setIsGenerating(false)
  }, [])

  // Send message to POST /chat with SSE streaming
  const sendMessage = useCallback(
    async (prompt) => {
      const trimmed = prompt.trim()
      if (!trimmed || isGenerating) return

      setError(null)

      // Optimistically append user message and empty assistant placeholder
      const userMsg = { role: 'user', content: trimmed }
      const assistantMsg = { role: 'assistant', content: '' }

      setMessages((prev) => [...prev, userMsg, assistantMsg])
      setIsGenerating(true)

      const controller = new AbortController()
      abortControllerRef.current = controller

      const wasNewThread = isNewThread
      const currentThread = activeThread
      const currentModel = selectedModel

      try {
        const response = await fetch('/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: currentModel,
            message: trimmed,
            thread: currentThread,
          }),
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error(`Server returned status ${response.status}`)
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const parts = buffer.split('\n\n')
          buffer = parts.pop() || ''

          for (const part of parts) {
            const lines = part.split('\n')
            for (const line of lines) {
              const trimmedLine = line.trim()
              if (trimmedLine.startsWith('data:')) {
                const jsonStr = trimmedLine.slice(5).trim()
                if (!jsonStr) continue
                try {
                  const parsed = JSON.parse(jsonStr)
                  if (parsed && typeof parsed.content === 'string') {
                    setMessages((prev) => {
                      if (prev.length === 0) return prev
                      const lastIdx = prev.length - 1
                      const updated = [...prev]
                      updated[lastIdx] = {
                        ...updated[lastIdx],
                        content: updated[lastIdx].content + parsed.content,
                      }
                      return updated
                    })
                  }
                } catch (parseErr) {
                  console.warn('SSE JSON parse error:', parseErr, jsonStr)
                }
              }
            }
          }
        }

        // Chat successfully registered on backend
        if (wasNewThread) {
          setIsNewThread(false)
          fetchChats()
        }
      } catch (err) {
        if (err.name === 'AbortError') {
          // Normal user abort
        } else {
          console.error('Chat streaming failed:', err)
          setError(err.message || 'Failed to generate response')
        }
      } finally {
        setIsGenerating(false)
        abortControllerRef.current = null
      }
    },
    [isGenerating, isNewThread, activeThread, selectedModel, fetchChats]
  )

  const value = {
    chats,
    activeThread,
    messages,
    selectedModel,
    setSelectedModel,
    isGenerating,
    isNewThread,
    error,
    startNewChat,
    selectChat,
    sendMessage,
    stopGeneration,
    fetchChats,
  }

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

export function useChat() {
  const ctx = useContext(ChatContext)
  if (!ctx) {
    throw new Error('useChat must be used within a ChatProvider')
  }
  return ctx
}
