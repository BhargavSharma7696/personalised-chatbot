import React from 'react'
import { TooltipProvider } from '@/components/ui/tooltip'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { ChatProvider } from '@/context/ChatContext'
import { ChatSidebar } from '@/components/chat/ChatSidebar'
import { ChatHeader } from '@/components/chat/ChatHeader'
import { MessageList } from '@/components/chat/MessageList'
import { ChatInput } from '@/components/chat/ChatInput'

export default function App() {
  return (
    <TooltipProvider>
      <ChatProvider>
        <SidebarProvider defaultOpen={true}>
          <div className="flex h-screen w-full overflow-hidden bg-background text-foreground antialiased">
            <ChatSidebar />
            <SidebarInset className="flex flex-col flex-1 h-full min-w-0 overflow-hidden bg-background">
              <ChatHeader />
              <main className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
                <MessageList />
                <ChatInput />
              </main>
            </SidebarInset>
          </div>
        </SidebarProvider>
      </ChatProvider>
    </TooltipProvider>
  )
}
