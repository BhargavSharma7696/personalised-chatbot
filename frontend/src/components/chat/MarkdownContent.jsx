import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Check, Copy } from 'lucide-react'

function CodeBlock({ className, children, ...props }) {
  const [copied, setCopied] = useState(false)
  const match = /language-(\w+)/.exec(className || '')
  const language = match ? match[1] : ''
  const codeText = String(children).replace(/\n$/, '')

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(String(children))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy code:', err)
    }
  }

  // If there's no language class and it's inline (or no line breaks), render inline code
  if (!match && !String(children).includes('\n')) {
    return (
      <code
        className="px-1.5 py-0.5 rounded bg-muted/80 text-foreground font-mono text-xs border border-border/50"
        {...props}
      >
        {children}
      </code>
    )
  }

  return (
    <div className="my-3 rounded-lg border border-border/60 bg-zinc-950 dark:bg-zinc-900/90 overflow-hidden text-sm">
      <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-900/70 border-b border-border/40 text-xs text-muted-foreground font-mono">
        <span className="font-medium text-zinc-300">{language || 'code'}</span>
        <button
          onClick={handleCopy}
          aria-label={copied ? 'Copied' : 'Copy'}
          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="p-3 overflow-x-auto font-mono text-xs text-zinc-100 leading-relaxed">
        <pre {...props}>
          <code>{children}</code>
        </pre>
      </div>
    </div>
  )
}

export function MarkdownContent({ content }) {
  return (
    <div className="prose prose-invert max-w-none break-words text-sm leading-relaxed space-y-2">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code: CodeBlock,
          p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
          ul: ({ children }) => <ul className="list-disc pl-5 my-2 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-5 my-2 space-y-1">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          h1: ({ children }) => <h1 className="text-lg font-bold mt-4 mb-2">{children}</h1>,
          h2: ({ children }) => <h2 className="text-base font-semibold mt-3 mb-2">{children}</h2>,
          h3: ({ children }) => <h3 className="text-sm font-semibold mt-2 mb-1">{children}</h3>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-primary/50 pl-3 italic my-2 text-muted-foreground">
              {children}
            </blockquote>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="text-primary underline underline-offset-2 hover:opacity-80 transition-opacity"
            >
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="my-3 overflow-x-auto rounded border border-border/50">
              <table className="min-w-full divide-y divide-border/60 text-xs">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="px-3 py-2 bg-muted/60 text-left font-semibold text-foreground">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 border-t border-border/40 text-foreground/90">{children}</td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
