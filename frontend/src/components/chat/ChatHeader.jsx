import React from 'react'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { useChat, AVAILABLE_MODELS } from '@/context/ChatContext'
import { ChevronDown, Check, Sparkles, MessageSquare } from 'lucide-react'

export function ChatHeader() {
  const { selectedModel, setSelectedModel, chats, activeThread, isNewThread } = useChat()

  const currentChat = chats.find((c) => c.thread === activeThread)
  const chatTitle = currentChat ? currentChat.title : isNewThread ? 'New Conversation' : 'Chat'
  const activeModelObj = AVAILABLE_MODELS.find((m) => m.id === selectedModel) || AVAILABLE_MODELS[0]

  return (
    <header className="sticky top-0 z-20 flex h-14 w-full items-center justify-between border-b border-border/50 bg-background/90 px-3 sm:px-4 backdrop-blur-md">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <SidebarTrigger className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted" />
        <div className="h-4 w-px bg-border/60 hidden sm:block" />
        <div className="flex items-center gap-2 min-w-0">
          <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0 hidden sm:inline" />
          <h1 className="text-sm font-medium truncate text-foreground max-w-[200px] sm:max-w-md">
            {chatTitle}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 px-2.5 text-xs bg-muted/40 hover:bg-muted border-border/60"
              >
                <Sparkles className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span className="font-medium text-foreground">{activeModelObj.label}</span>
                <ChevronDown className="h-3 w-3 text-muted-foreground ml-0.5" />
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-64 p-1.5">
            <DropdownMenuLabel className="text-xs font-semibold px-2 py-1 text-muted-foreground">
              Select Model
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="my-1" />
            {AVAILABLE_MODELS.map((model) => {
              const isSelected = selectedModel === model.id
              return (
                <DropdownMenuItem
                  key={model.id}
                  onClick={() => setSelectedModel(model.id)}
                  className="flex items-start justify-between gap-2 px-2 py-2 rounded-md cursor-pointer hover:bg-muted focus:bg-muted text-xs"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium text-foreground">{model.label}</span>
                    <span className="text-[11px] text-muted-foreground leading-tight">
                      {model.description}
                    </span>
                  </div>
                  {isSelected && <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />}
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
