# Design Specification: Chat UI with Official shadcn Components, Model Selector, and Streaming

**Date:** 2026-10-06  
**Status:** Approved (Updated with official shadcn CLI & components)  
**Target:** Frontend (React + Vite + Tailwind CSS v4 + Official shadcn/ui components)  
**Backend:** Existing FastAPI (`backend/src/backend/api/api_conn.py`) — **DO NOT MODIFY**

---

## 1. Overview & Goals

Build a sleek, modern, dark-mode AI Chat interface using Vite + React (JavaScript) using **official shadcn/ui components** installed via `npx shadcn@latest add` (specifically `sidebar`, `button`, `dropdown-menu`, `scroll-area`, `textarea`, etc.). The frontend interfaces with an existing FastAPI backend providing streaming chat responses and conversation persistence.

### Key Requirements & Constraints
1. **Official shadcn Components:**
   - Initialize shadcn configuration (`components.json`) via `npx -y shadcn@latest init`.
   - Install official shadcn `sidebar` (leveraging `SidebarProvider`, `Sidebar`, `SidebarHeader`, `SidebarContent`, `SidebarMenu`, `SidebarMenuItem`, `SidebarMenuButton`, `SidebarTrigger`).
   - Install official shadcn UI primitives: `button`, `dropdown-menu`, `textarea`, `scroll-area`, `tooltip`, `separator`.
2. **Deferred Chat Registration:**
   - Clicking "New Chat" does **not** call the backend.
   - The thread is assigned a client-side UUID (`crypto.randomUUID()`).
   - The chat is registered in the backend SQLite database only when the first message is sent via `POST /chat`.
3. **Model Sharing on Every Message:**
   - Every `POST /chat` payload includes `{ model, message, thread }`.
   - The model selector resides in the chat header and defaults to `gpt-oss-120b`.
   - The user can switch models at any time; subsequent messages in the thread use the newly selected model.
   - Available models:
     - `gpt-oss-120b` (Default)
     - `stealth/space-bunny-alpha`
     - `nvidia/nemotron-3`
4. **No Backend Modifications:**
   - Backend code in `backend/` must remain untouched.
   - All network calls from frontend are proxied via `frontend/vite.config.js` (`/chat` and `/listchats` -> `http://127.0.0.1:8000`) to eliminate CORS hurdles in development.
5. **Rich Markdown & Version Control:**
   - Rich Markdown rendering for responses (code blocks, syntax highlighting, copy buttons).
   - Atomic git commits after each implementation milestone.

---

## 2. Architecture & Data Flow

### 2.1 Backend API Specification
* `POST /chat`:
  - Request: `{ model: string, message: string, thread: string }`
  - Response: Server-Sent Events (`text/event-stream`). Formatted as:
    ```
    data: {"content": "text chunk"}
    
    ```
  - Behavior: Inserts row into `chats` table if `thread` is not present (title = first 40 chars of message).
* `GET /chat/{thread_id}`:
  - Response: `{"data": [{"type": "human" | "ai", "content": string}]}`
* `GET /listchats?limit=50&offset=0`:
  - Response: `{"chats": [{"thread": string, "title": string, "updated_at": string}]}`

### 2.2 Thread State Lifecycle
1. **Initial / New Chat**:
   - `currentThreadId = crypto.randomUUID()`
   - `messages = []`
   - `isNewThread = true`
   - No backend calls are dispatched.
2. **First Prompt Submission**:
   - Optimistically append `{ role: "user", content: prompt }` to `messages`.
   - Add placeholder `{ role: "assistant", content: "" }` to `messages`.
   - Invoke `POST /chat` with `{ model: selectedModel, message: prompt, thread: currentThreadId }`.
   - Parse SSE stream chunks incrementally appending `content` to the assistant message.
   - On stream completion:
     - `isNewThread = false`
     - Refresh chat list via `GET /listchats?limit=50&offset=0` so the newly registered chat appears in the sidebar.
3. **Existing Chat Selection**:
   - Abort any currently running stream via `AbortController`.
   - Set `currentThreadId = selectedThreadId`.
   - Fetch historical messages via `GET /chat/{thread_id}`.
   - Map backend message objects (`type: "human"` -> user, `type: "ai"` -> assistant) to UI message state.
   - `isNewThread = false`.
4. **Subsequent Messages**:
   - User types new prompt.
   - Send `POST /chat` with the current thread ID and currently selected model.
   - Stream response into UI.

---

## 3. UI Component Architecture with Official shadcn

```
src/
├── components/
│   ├── ui/                         # Official shadcn UI components
│   │   ├── sidebar.jsx             # Official shadcn sidebar system
│   │   ├── button.jsx              # Official shadcn button
│   │   ├── dropdown-menu.jsx       # Official shadcn dropdown menu
│   │   ├── scroll-area.jsx         # Official shadcn scroll area
│   │   ├── tooltip.jsx             # Official shadcn tooltip
│   │   ├── separator.jsx           # Official shadcn separator
│   │   └── textarea.jsx            # Official shadcn textarea
│   ├── chat/
│   │   ├── ChatSidebar.jsx         # App-specific sidebar using shadcn Sidebar components
│   │   ├── ChatHeader.jsx          # Header with Model Selector & SidebarTrigger
│   │   ├── MessageList.jsx         # Scrollable feed with auto-scroll
│   │   ├── MessageItem.jsx         # Avatar, message role, and bubble
│   │   ├── MarkdownContent.jsx     # Markdown renderer with code highlighting & copy button
│   │   └── ChatInput.jsx           # Auto-expanding input with Send & Stop buttons
│   └── context/
│       └── ChatContext.jsx         # Thread, model, message, and stream management
├── hooks/
│   └── use-mobile.jsx              # shadcn responsive hook
├── lib/
│   └── utils.js                    # shadcn utils (clsx + twMerge)
├── App.jsx                         # SidebarProvider wrapping App
├── main.jsx
└── index.css                       # shadcn CSS variables & styling
```

---

## 4. Interaction Details

### 4.1 Official shadcn Sidebar Layout
- Root wrapped in `SidebarProvider`.
- `ChatSidebar` implements:
  - `SidebarHeader`: "New Chat" action button (`SidebarMenuButton` with `Plus` icon).
  - `SidebarContent`: `SidebarGroup` containing recent chats (`SidebarMenu` / `SidebarMenuItem` / `SidebarMenuButton`).
  - Active chat item styled with active indicator badge.
  - Chat titles formatted with fallback and tooltips.
  - `SidebarFooter`: Workspace / status indicators.
- In `ChatHeader`, official `SidebarTrigger` allows collapsing/expanding the sidebar cleanly.

### 4.2 Model Selector
- Positioned in `ChatHeader`.
- Implemented with shadcn `DropdownMenu`:
  - **GPT-OSS 120B** (`gpt-oss-120b`) - Default
  - **Space Bunny Alpha** (`stealth/space-bunny-alpha`)
  - **Nemotron-3** (`nvidia/nemotron-3`)
- Display badge indicating active model.
- Switching updates `selectedModel` state immediately for subsequent messages.

### 4.3 Stream Processing & Cancellation
- Native `fetch` + `response.body.getReader()` + `TextDecoder`.
- Buffer incoming SSE chunks by `\n\n` to prevent JSON parsing errors if chunks split across chunks.
- Provide `AbortController` hooked to a "Stop Generation" button in `ChatInput`.

### 4.4 Error Handling
- Network error banner if the backend is down or stream terminates unexpectedly.
- Retry button for failed prompt submissions.

---

## 5. Verification & Testing Plan

1. **shadcn Setup Verification**:
   - Verify official `sidebar.jsx` and UI components are installed and compile without warnings.
2. **Development Proxy**:
   - Verify `GET /listchats` and `POST /chat` resolve through Vite proxy to `http://127.0.0.1:8000`.
3. **New Chat Behavior**:
   - Click "New Chat" -> Confirm no network request is sent in browser devtools.
   - Send first message -> Verify `POST /chat` is triggered with generated `thread` UUID and selected model.
   - Confirm SSE stream fills assistant response token by token.
   - Confirm chat list refreshes and shows the new chat title in sidebar.
4. **Model Selection**:
   - Switch model to `stealth/space-bunny-alpha` or `nvidia/nemotron-3`.
   - Send next message in the same thread.
   - Verify request payload transmits the updated `model` string.
5. **Chat History Loading**:
   - Click existing chat in sidebar -> Verify `GET /chat/{thread_id}` returns past messages and UI displays them accurately.
6. **Responsiveness & UX**:
   - Collapsible sidebar using `SidebarTrigger` on both desktop and mobile.
   - Auto-scroll during streaming, code copy button functionality.
