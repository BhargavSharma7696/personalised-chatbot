from langchain_mcp_adapters.client import MultiServerMCPClient

client = MultiServerMCPClient(
    {
        "filesystem": {
            "transport": "stdio",
            "command": "npx",
            "args": [
                "-y",
                "@modelcontextprotocol/server-filesystem",
                "/home/bhargav/OBSIDIAN",   
            ],
        }
    }
)

async def load_tools():
    return await client.get_tools()