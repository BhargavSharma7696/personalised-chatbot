import React from 'react'
import { Bot, User } from 'lucide-react'
import { MarkdownContent } from './MarkdownContent'
import { cn } from '../../lib/utils'

export function MessageItem({ role, content, isStreaming = false }) {
  const isUser = role === 'user'

  return (
    <div
      className={cn(
        'group flex w-full gap-3 py-3 px-2 sm:px-4 transition-colors',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
          <Bot className="h-4 w-4" />
        </div>
      )}

      <div
        className={cn(
          'max-w-[85%] sm:max-w-[78%] rounded-2xl px-4 py-2.5 text-sm shadow-sm',
          isUser
            ? 'bg-primary text-primary-foreground ml-auto rounded-tr-sm'
            : 'bg-muted/50 border border-border/50 text-foreground rounded-tl-sm'
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap break-words leading-relaxed text-sm">{content}</p>
        ) : (
          <div className="relative">
            {content ? (
              <MarkdownContent content={content} />
            ) : isStreaming ? (
              <div className="flex items-center gap-1.5 py-1 text-muted-foreground text-xs">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Thinking...</span>
              </div>
            ) : null}

            {isStreaming && content && (
              <span className="inline-block w-1.5 h-4 ml-1 bg-emerald-400 animate-pulse align-middle" />
            )}
          </div>
        )}
      </div>

      {isUser && (
        <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-lg bg-primary/20 text-primary border border-primary/30">
          <User className="h-4 w-4" />
        </div>
      )}
    </div>
  )
}
