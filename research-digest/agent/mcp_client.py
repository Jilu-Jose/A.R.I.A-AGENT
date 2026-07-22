import os
from typing import List, Dict, Any
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

async def call_mcp_tool(command: str, args: List[str], tool_name: str, tool_args: dict, env: dict = None):
    """Helper to run a tool on an MCP server via stdio"""
    server_env = os.environ.copy()
    if env:
        server_env.update(env)
        
    server_params = StdioServerParameters(command=command, args=args, env=server_env)
    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()
            result = await session.call_tool(tool_name, arguments=tool_args)
            return result
