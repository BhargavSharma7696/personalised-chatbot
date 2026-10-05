import React from 'react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { useChat } from '@/context/ChatContext'
import { MessageSquare, Plus, Bot, Sparkles } from 'lucide-react'

export function ChatSidebar({ ...props }) {
  const { chats, activeThread, startNewChat, selectChat, selectedModel } = useChat()

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50 bg-sidebar" {...props}>
      <SidebarHeader className="p-3 gap-3 border-b border-border/40">
        <div className="flex items-center gap-2 px-1">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Bot className="h-4 w-4" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="font-semibold text-sm leading-none text-sidebar-foreground">
              MyChatBot
            </span>
            <span className="text-[11px] text-muted-foreground mt-0.5">FastAPI & LangGraph</span>
          </div>
        </div>

        <Button
          onClick={startNewChat}
          variant="outline"
          className="w-full justify-start gap-2 bg-sidebar-accent/50 hover:bg-sidebar-accent border-sidebar-border text-sidebar-foreground group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
        >
          <Plus className="h-4 w-4 shrink-0" />
          <span className="group-data-[collapsible=icon]:hidden">New Chat</span>
        </Button>
      </SidebarHeader>

      <SidebarContent className="px-2 py-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground px-2">
            Conversations
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {chats.length === 0 ? (
                <div className="px-3 py-6 text-center text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
                  No conversations yet. Send a message to start!
                </div>
              ) : (
                chats.map((chat) => {
                  const isActive = activeThread === chat.thread
                  return (
                    <SidebarMenuItem key={chat.thread}>
                      <SidebarMenuButton
                        isActive={isActive}
                        onClick={() => selectChat(chat.thread)}
                        tooltip={chat.title || 'Untitled Chat'}
                        className="gap-2.5 px-2.5 py-2 text-sm transition-colors data-active:bg-sidebar-accent data-active:text-sidebar-accent-foreground data-active:font-medium"
                      >
                        <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="truncate">{chat.title || 'New Chat'}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-border/40">
        <div className="flex items-center gap-2 px-1 text-xs text-muted-foreground group-data-[collapsible=icon]:justify-center">
          <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="truncate group-data-[collapsible=icon]:hidden">
            Active: <span className="font-mono text-sidebar-foreground">{selectedModel}</span>
          </span>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
