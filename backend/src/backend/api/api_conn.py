from contextlib import asynccontextmanager
from langgraph.checkpoint.sqlite.aio import AsyncSqliteSaver
import aiosqlite
from fastapi import FastAPI, Request
from langchain_core.messages import HumanMessage
from pydantic import BaseModel
from bot_source.chat import build_graph
from bot_source.mcp_conn import load_tools
from fastapi.responses import StreamingResponse
import json 

def get_conn():
    return app.state.conn

@asynccontextmanager
async def lifespan(app):
    app.state.conn = await aiosqlite.connect("chat.db")
    checkp = AsyncSqliteSaver(app.state.conn)
    conn = get_conn()
    await conn.execute("""
        CREATE TABLE IF NOT EXISTS chats (
            thread TEXT PRIMARY KEY,
            title  TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)
    await conn.commit()
    tools = await load_tools()
    app.state.graph = build_graph(tools,checkp)
    yield
    await app.state.close()


app = FastAPI(lifespan=lifespan)

class Message(BaseModel):
    model : str
    message : str
    thread : str


@app.post("/chat")
#handles new chat, chat progression, streaming, chat title
async def chat(message : Message):
    conn = get_conn()
    cur = await conn.execute("SELECT 1 FROM chats WHERE thread = ?", (message.thread,))
    row = await cur.fetchone()

    if row is None:

        title = message.message[:40].replace("\n", " ").strip() or "New chat"
        await conn.execute(
        "INSERT OR IGNORE INTO chats (thread, title) VALUES (?, ?)",
        (message.thread, title),
        )
        await conn.commit()
    async def generator(message):
        obj = app.state.graph.astream({"messages" : [HumanMessage(content=message.message)]}, 
                                     stream_mode="messages", 
                                     config = {
                                         "configurable": {"thread_id" : message.thread, 
                                                          "model":message.model}})
        async for chunk, metadata in obj:
            if chunk.type == "tool":
                continue
            if chunk.content:
                chunk_data = json.dumps({"content" : chunk.content})
                yield f"data: {chunk_data}\n\n"
    return StreamingResponse(generator(message), media_type="text/event-stream")

@app.get("/chat/{thread_id}")
async def getChatHistory(thread_id : str):
    #model naa bhi ho toh handle ho jayega, gpt-oss-120b default 
    config = {"configurable": {"thread_id": thread_id}}
    state = await app.state.graph.aget_state(config)
    msgs = state.values.get("messages", [])
    dat = [{"type":msg.type, "content":msg.content} for msg in msgs if msg.content and (msg.type == "ai" or msg.type == "human")]
    return {"data":dat}


@app.get("/listchats")
async def listChats(limit: int = 5, offset : int = 0):
    conn = get_conn()
    cur = await conn.execute(
            """
            SELECT thread, title, created_at
            FROM chats
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
            """,
            (limit, offset),
        )
    rows = await cur.fetchall()
    chats = [{"thread": r[0], "title": r[1], "updated_at": r[2]} for r in rows]
    return {"chats":chats}

