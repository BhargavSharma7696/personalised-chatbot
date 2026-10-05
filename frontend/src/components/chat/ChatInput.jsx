import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useChat } from '@/context/ChatContext'
import { ArrowUp, Square, AlertCircle, RefreshCw } from 'lucide-react'

export function ChatInput() {
  const { sendMessage, isGenerating, stopGeneration, error } = useChat()
  const [input, setInput] = useState('')
  const textareaRef = useRef(null)

  // Auto-resize textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`
    }
  }, [input])

  const handleSend = () => {
    const trimmed = input.trim()
    if (!trimmed || isGenerating) return
    sendMessage(trimmed)
    setInput('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="w-full max-w-3xl mx-auto px-3 sm:px-4 pb-4 pt-1">
      {error && (
        <div className="mb-2 flex items-center justify-between gap-2 p-2.5 rounded-lg bg-destructive/15 border border-destructive/30 text-destructive text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span className="truncate">{error}</span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleSend}
            className="h-6 px-2 text-xs hover:bg-destructive/20 text-destructive"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        </div>
      )}

      <div className="relative flex flex-col rounded-2xl border border-border/70 bg-muted/40 shadow-sm focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20 transition-all p-2">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message... (Enter to send, Shift+Enter for newline)"
          rows={1}
          className="w-full resize-none bg-transparent px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none max-h-44 min-h-[44px] leading-relaxed"
        />

        <div className="flex items-center justify-between pt-1 px-1">
          <div className="text-[11px] text-muted-foreground select-none">
            {input.length > 0 && <span>{input.length} chars</span>}
          </div>

          <div className="flex items-center gap-1.5">
            {isGenerating ? (
              <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={stopGeneration}
                aria-label="Stop generation"
                className="h-8 gap-1.5 px-3 rounded-full text-xs"
              >
                <Square className="h-3 w-3 fill-current" />
                <span>Stop</span>
              </Button>
            ) : (
              <Button
                type="button"
                size="icon"
                onClick={handleSend}
                disabled={!input.trim()}
                aria-label="Send message"
                className="h-8 w-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-opacity"
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
      <p className="mt-2 text-center text-[11px] text-muted-foreground">
        AI responses are streamed in real time. Please verify critical information.
      </p>
    </div>
  )
}
