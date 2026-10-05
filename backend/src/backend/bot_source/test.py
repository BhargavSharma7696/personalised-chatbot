from mcp_conn import load_tools
import asyncio 

lis = asyncio.run(load_tools())

print([t.name for t in lis])

