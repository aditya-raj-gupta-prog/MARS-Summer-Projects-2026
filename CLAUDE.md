# IITR Unified Campus Intelligence Dashboard

## Architecture
- Frontend: Next.js 15 (App Router, TypeScript, Tailwind CSS)
- Backend: Modular Model Context Protocol (MCP) servers under `mcp-servers/`

## Development Commands
- Frontend Dev: `cd frontend && npm run dev`
- Cafeteria Server Dev: `cd mcp-servers/cafeteria && npm run dev`

## Rules
- No centralized databases. Every MCP server must fetch or mock data live from its own domain context.
- Adhere strictly to explicit TypeScript types. No implicit 'any'.
