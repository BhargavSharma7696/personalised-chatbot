# Personalised ChatBot 🤖💬

A modern, full-stack conversational AI application built with a **FastAPI + LangGraph** backend and a sleek **React 19 + Vite + Tailwind CSS v4 + shadcn/ui** frontend.

![Tech Stack](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![LangGraph](https://img.shields.io/badge/LangGraph-FF6F00?style=for-the-badge&logo=python&logoColor=white)
![React 19](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-000000?style=for-the-badge&logo=shadcnui&logoColor=white)

---

## ✨ Key Features

- **Deferred Chat Registration:**
  Clicking "New Chat" initializes an isolated conversation state on the client without database writes. The conversation is only persisted in SQLite once the first message is sent.
- **Dynamic Model Switching:**
  Switch between models seamlessly using the header dropdown:
  - `GPT-OSS 120B` (`gpt-oss-120b`) - Default
  - `Space Bunny Alpha` (`stealth/space-bunny-alpha`)
  - `Nemotron-3` (`nvidia/nemotron-3`)
  The selected model is transmitted with every prompt, allowing mid-conversation model changes while maintaining conversational context.
- **Real-Time Token Streaming (SSE):**
  Server-Sent Events streaming with a robust chunk buffer to parse fragmented JSON tokens smoothly as the AI generates responses.
- **Official shadcn/ui Components:**
  Built with official shadcn components including an offcanvas collapsible sidebar (`SidebarProvider`, `Sidebar`, `SidebarTrigger`), dropdown menus, buttons, and custom scroll containers.
- **Rich Markdown & Code Highlighting:**
  Powered by `react-markdown` and `remark-gfm` with language badges and one-click code copy buttons.
- **Zero-CORS Dev Proxy:**
  The Vite dev server proxies API endpoints (`/chat`, `/listchats`) directly to the FastAPI server, avoiding cross-origin issues in development without altering backend code.
- **One-Command Startup:**
  A single script (`./start.sh`) concurrently launches both servers and opens the application in your default browser.

---

## 🏗️ Architecture & Data Flow

```
┌────────────────────────────────────────────────────────┐
│                   React 19 Frontend                    │
│   (ChatSidebar, ChatHeader, MessageList, ChatInput)    │
└──────────────────────────┬─────────────────────────────┘
                           │
                 Vite Dev Reverse Proxy
               (Forwarding /chat & /listchats)
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│                    FastAPI Backend                     │
│                (src/backend/api/api_conn.py)           │
├────────────────────────────────────────────────────────┤
│  • LangGraph StateGraph & OpenRouter LLM clients       │
│  • AsyncSqliteSaver & SQLite chat persistence          │
│  • Server-Sent Events (SSE) StreamingResponse          │
└────────────────────────────────────────────────────────┘
```

---

## 📁 Repository Structure

```
.
├── backend/
│   ├── src/backend/
│   │   ├── api/
│   │   │   └── api_conn.py        # FastAPI endpoints (/chat, /chat/{id}, /listchats)
│   │   └── bot_source/
│   │       ├── chat.py            # LangGraph StateGraph & model bindings
│   │       └── mcp_conn.py        # MCP Tool integrations
│   ├── pyproject.toml             # Python package & dependency definitions
│   └── uv.lock                    # Locked Python dependencies
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── chat/              # Chat components (Sidebar, Header, Messages, Input)
│   │   │   └── ui/                # Official shadcn/ui primitives
│   │   ├── context/
│   │   │   └── ChatContext.jsx    # Chat state, SSE streaming, & deferred registration
│   │   ├── test/                  # Automated Vitest test suites
│   │   ├── App.jsx                # Main application layout
│   │   └── index.css              # Tailwind CSS v4 & theme variables
│   ├── package.json               # Node dependencies & scripts
│   ├── vite.config.js             # Vite configuration with API proxy
│   └── components.json            # shadcn/ui configuration
│
├── start.sh                       # Single-command launcher for backend + frontend + browser
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- [Python 3.11+](https://www.python.org/)
- [uv](https://astral.sh/uv) (Extremely fast Python package installer)
- [Node.js 18+](https://nodejs.org/) and `npm`

### Quick Start (One Command)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/BhargavSharma7696/personalised-chatbot.git
   cd personalised-chatbot
   ```

2. **Set your OpenRouter API Key:**
   ```bash
   echo "OPENROUTER_API_KEY=your_openrouter_key_here" > backend/.env
   ```

3. **Install frontend dependencies:**
   ```bash
   cd frontend && npm install && cd ..
   ```

4. **Run both servers and open GUI:**
   ```bash
   ./start.sh
   ```
   This will start:
   - Backend at `http://127.0.0.1:8000`
   - Frontend at `http://localhost:5173`
   - Automatically open `http://localhost:5173` in your default browser.

---

## 🛠️ Manual Execution

If you prefer running services independently:

### Backend
```bash
cd backend
uv run uvicorn api.api_conn:app --app-dir src/backend --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## 📡 API Reference

| Method | Endpoint | Description | Payload / Params |
|---|---|---|---|
| `POST` | `/chat` | Processes prompt, creates thread on first message, streams response | `{"model": "string", "message": "string", "thread": "string"}` |
| `GET` | `/chat/{thread_id}` | Retrieves full message history for a given thread | `thread_id` (Path Parameter) |
| `GET` | `/listchats` | Fetches list of saved chats ordered by last updated | `limit` (default 5), `offset` (default 0) |

---

## 🧪 Testing & Verification

The frontend includes 7 automated test suites with 100% test pass rate using Vitest and React Testing Library:

```bash
cd frontend
npx vitest run
```

To test the production build:
```bash
cd frontend
npm run build
```

---

## 📄 License

This project is licensed under the MIT License.
