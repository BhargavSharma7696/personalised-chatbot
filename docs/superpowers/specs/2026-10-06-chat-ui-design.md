# Design Specification: Chat UI with shadcn, Model Selector, and Streaming

**Date:** 2026-10-06  
**Status:** Approved  
**Target:** Frontend (React + Vite + Tailwind CSS + shadcn pattern)  
**Backend:** Existing FastAPI (`backend/src/backend/api/api_conn.py`) — **DO NOT MODIFY**

---

## 1. Overview & Goals

Build a sleek, modern, dark-mode AI Chat interface using Vite + React (JavaScript) and shadcn-styled components. The frontend interfaces with an existing FastAPI backend providing streaming chat responses and conversation persistence.

### Key Requirements & Constraints
1. **Deferred Chat Registration:**
   - Clicking "New Chat" does **not** call the backend.
   - The thread is assigned a client-side UUID (`crypto.randomUUID()`).
   - The chat is registered in the backend SQLite database only when the first message is sent via `POST /chat`.
2. **Model Sharing on Every Message:**
   - Every `POST /chat` payload includes `{ model, message, thread }`.
   - The model selector resides in the chat header and defaults to `gpt-oss-120b`.
   - The user can switch models at any time; subsequent messages in the thread use the newly selected model.
   - Available models:
     - `gpt-oss-120b` (Default)
     - `stealth/space-bunny-alpha`
     - `nvidia/nemotron-3`
3. **No Backend Modifications:**
   - Backend code in `backend/` must remain untouched.
   - All network calls from frontend are proxied via `frontend/vite.config.js` (`/chat` and `/listchats` -> `http://127.0.0.1:8000`) to eliminate CORS hurdles in development.
4. **Lean & Purposeful:**
   - No unnecessary packages or bloated state managers.
   - Rich Markdown rendering with code blocks and copy buttons.
   - Disciplined Git version control with atomic commits at each phase.

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

## 3. UI Component Architecture

```
src/
├── components/
│   ├── ui/                   # shadcn-style primitive components
│   │   ├── button.jsx
│   │   ├── dropdown-menu.jsx
│   │   ├── scroll-area.jsx
│   │   └── textarea.jsx
│   ├── layout/
│   │   └── AppLayout.jsx     # Split view (Sidebar + Chat Area)
│   ├── sidebar/
│   │   ├── Sidebar.jsx       # Chat list, "New Chat" button, collapse/expand
│   │   └── ChatListItem.jsx  # Active state, title truncation, timestamp
│   ├── chat/
│   │   ├── ChatHeader.jsx    # Model selector, sidebar toggle, title
│   │   ├── MessageList.jsx   # Feed with auto-scroll to bottom
│   │   ├── MessageItem.jsx   # User/AI avatar & bubble
│   │   ├── MarkdownContent.jsx # Formatted text + syntax-highlighted code blocks + copy button
│   │   └── ChatInput.jsx     # Auto-resizing textarea, Enter-to-send, Send/Stop button
│   └── context/
│       └── ChatContext.jsx   # State management (threads, messages, models, streaming)
├── lib/
│   └── utils.js              # cn helper (clsx + tailwind-merge)
├── App.jsx
├── main.jsx
└── index.css                 # Dark theme tokens and Tailwind styling
```

---

## 4. Interaction Details

### 4.1 Model Selector
- Positioned in `ChatHeader`.
- Dropdown options:
  - **GPT-OSS 120B** (`gpt-oss-120b`) - Default
  - **Space Bunny Alpha** (`stealth/space-bunny-alpha`)
  - **Nemotron-3** (`nvidia/nemotron-3`)
- Display badge indicating the active model.
- Switching updates `selectedModel` state immediately. Subsequent messages use this model.

### 4.2 Stream Processing & Cancellation
- Using native `fetch` + `response.body.getReader()` + `TextDecoder`.
- Buffer incoming SSE chunks by `\n\n` to prevent JSON parsing errors if chunks split across chunks.
- Provide `AbortController` hooked to a "Stop Generation" button in `ChatInput`.

### 4.3 Error Handling
- Network error banner if the backend is down or stream terminates unexpectedly.
- Retry button for failed prompt submissions.

---

## 5. Verification & Testing Plan

1. **Development Proxy**:
   - Verify `GET /listchats` and `POST /chat` resolve through Vite proxy to `http://127.0.0.1:8000`.
2. **New Chat Behavior**:
   - Click "New Chat" -> Confirm no network request is sent in browser devtools.
   - Send first message -> Verify `POST /chat` is triggered with generated `thread` UUID and selected model.
   - Confirm SSE stream fills assistant response token by token.
   - Confirm chat list refreshes and shows the new chat title in sidebar.
3. **Model Selection**:
   - Switch model to `stealth/space-bunny-alpha` or `nvidia/nemotron-3`.
   - Send next message in the same thread.
   - Verify request payload transmits the updated `model` string.
4. **Chat History Loading**:
   - Click existing chat in sidebar -> Verify `GET /chat/{thread_id}` returns past messages and UI displays them accurately.
5. **Responsiveness & UX**:
   - Collapsible sidebar on mobile and desktop.
   - Auto-scroll during streaming, code copy button functionality.
