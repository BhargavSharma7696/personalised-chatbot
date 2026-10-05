import asyncio
import os
from typing import TypedDict, Annotated, List
from langgraph.graph import END, START, StateGraph
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage
from langgraph.graph.message import add_messages
from dotenv import load_dotenv
from langchain_openrouter import ChatOpenRouter
from langgraph.prebuilt import ToolNode, tools_condition
from pydantic import SecretStr


load_dotenv()
openrouterkey = os.getenv("OPENROUTER_API_KEY")



class State(TypedDict):
    messages: Annotated[List[BaseMessage], add_messages]


def build_graph(tools,checkp):

    avail_models = { 
        "gpt-oss-120b": ChatOpenRouter(
            api_key=SecretStr(openrouterkey) if openrouterkey is not None else None,
            model="openai/gpt-oss-120b",
            temperature=0.7,
            ), 
        "stealth/space-bunny-alpha": ChatOpenRouter(
            api_key=SecretStr(openrouterkey) if openrouterkey is not None else None,
            model="stealth/space-bunny-alpha",
            temperature=0.7),
        "nvidia/nemotron-3": ChatOpenRouter(
            api_key=SecretStr(openrouterkey) if openrouterkey is not None else None,
            model="nvidia/nemotron-3-ultra-550b-a55b:free",
            temperature=0.7)
    }

    bound_models = {a : b.bind_tools(tools) for a, b in avail_models.items()}

   

    async def chatNode(state: State, config):
        llm_with_tools = bound_models[config["configurable"].get("model", "gpt-oss-120b")]
        messages = state["messages"]
        response = await llm_with_tools.ainvoke(messages)

        return {"messages": response}
    
    tool_node = ToolNode(tools)
    builder = StateGraph(State)

    builder.add_node("chatNode", chatNode)
    builder.add_node("tools", tool_node)

    builder.add_edge(START, "chatNode")
    builder.add_conditional_edges("chatNode", tools_condition)
    builder.add_edge("tools","chatNode")

    graph = builder.compile(checkpointer=checkp) 
    return graph   







