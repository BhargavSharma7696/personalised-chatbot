import React, { useEffect, useRef } from 'react'
import { MessageItem } from './MessageItem'
import { useChat, AVAILABLE_MODELS } from '@/context/ChatContext'
import { Bot, Sparkles, Code2, Lightbulb, Compass } from 'lucide-react'

const SUGGESTIONS = [
  {
    icon: Lightbulb,
    title: 'Explain a concept',
    desc: 'Explain quantum computing simply',
  },
  {
    icon: Code2,
    title: 'Write some code',
    desc: 'Write a Python FastAPI SSE streaming endpoint',
  },
  {
    icon: Compass,
    title: 'Brainstorm ideas',
    desc: 'Help me plan architecture for an AI app',
  },
]

export function MessageList() {
  const { messages, isGenerating, selectedModel, sendMessage } = useChat()
  const bottomRef = useRef(null)

  // Auto-scroll to bottom on new messages or streamed tokens
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isGenerating])

  const activeModelObj = AVAILABLE_MODELS.find((m) => m.id === selectedModel) || AVAILABLE_MODELS[0]

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 text-center select-none overflow-y-auto">
        <div className="max-w-md w-full flex flex-col items-center animate-in fade-in zoom-in-95 duration-200">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-sm mb-4">
            <Bot className="h-7 w-7" />
          </div>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            How can I help you today?
          </h2>

          <p className="mt-2 text-xs sm:text-sm text-muted-foreground flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
            <span>Ready with model</span>
            <span className="font-semibold text-foreground underline decoration-emerald-500/50">
              {activeModelObj.label}
            </span>
          </p>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-2.5 w-full">
            {SUGGESTIONS.map((item, idx) => {
              const Icon = item.icon
              return (
                <button
                  key={idx}
                  onClick={() => sendMessage(item.desc)}
                  className="flex flex-col items-start p-3 text-left rounded-xl border border-border/60 bg-muted/30 hover:bg-muted/70 hover:border-border transition-all text-xs group cursor-pointer"
                >
                  <Icon className="h-4 w-4 text-primary mb-2 group-hover:scale-110 transition-transform" />
                  <span className="font-medium text-foreground">{item.title}</span>
                  <span className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                    {item.desc}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-2 sm:px-4 py-4 space-y-1">
      <div className="max-w-3xl mx-auto w-full">
        {messages.map((msg, index) => {
          const isLast = index === messages.length - 1
          return (
            <MessageItem
              key={index}
              role={msg.role}
              content={msg.content}
              isStreaming={isLast && isGenerating && msg.role === 'assistant'}
            />
          )
        })}
        <div ref={bottomRef} className="h-4" />
      </div>
    </div>
  )
}
