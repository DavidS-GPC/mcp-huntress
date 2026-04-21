import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { randomUUID } from 'crypto';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { mcpAuthMiddleware } from './middleware/mcpAuth.js';
import { registerAccountTools } from './tools/account.js';
import { registerOrganizationTools } from './tools/organizations.js';
import { registerAgentTools } from './tools/agents.js';
import { registerIncidentTools } from './tools/incidents.js';
import { registerReportTools } from './tools/reports.js';
const PORT = parseInt(process.env.PORT ?? '3004', 10);
// Per-session transport maps — new McpServer per session prevents state leakage
const streamableTransports = new Map();
const sseTransports = new Map();
function createServer() {
    const server = new McpServer({ name: 'mcp-huntress', version: '1.0.0' });
    registerAccountTools(server);
    registerOrganizationTools(server);
    registerAgentTools(server);
    registerIncidentTools(server);
    registerReportTools(server);
    return server;
}
const app = express();
app.use(cors());
app.use(express.json());
// ─── Health check (no auth) ──────────────────────────────────────────────────
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', server: 'mcp-huntress', port: PORT });
});
// ─── PRIMARY: Streamable HTTP (SDK-recommended, required for Claude.ai Teams) ─
app.post('/mcp', mcpAuthMiddleware, async (req, res) => {
    const sessionId = req.headers['mcp-session-id'];
    let transport;
    if (sessionId && streamableTransports.has(sessionId)) {
        transport = streamableTransports.get(sessionId);
    }
    else if (!sessionId && isInitializeRequest(req.body)) {
        transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: () => randomUUID(),
            onsessioninitialized: (id) => {
                streamableTransports.set(id, transport);
            },
        });
        transport.onclose = () => {
            if (transport.sessionId)
                streamableTransports.delete(transport.sessionId);
        };
        const server = createServer();
        await server.connect(transport);
    }
    else {
        res.status(400).json({
            error: 'Bad Request: send an InitializeRequest without Mcp-Session-Id to start a new session',
        });
        return;
    }
    await transport.handleRequest(req, res, req.body);
});
// GET /mcp — SSE notification stream within Streamable HTTP sessions
app.get('/mcp', mcpAuthMiddleware, async (req, res) => {
    const sessionId = req.headers['mcp-session-id'];
    if (!sessionId || !streamableTransports.has(sessionId)) {
        res.status(400).json({ error: 'Invalid or missing Mcp-Session-Id header' });
        return;
    }
    await streamableTransports.get(sessionId).handleRequest(req, res);
});
// DELETE /mcp — explicit session termination
app.delete('/mcp', mcpAuthMiddleware, async (req, res) => {
    const sessionId = req.headers['mcp-session-id'];
    if (sessionId && streamableTransports.has(sessionId)) {
        await streamableTransports.get(sessionId).close();
        streamableTransports.delete(sessionId);
    }
    res.status(200).json({ ok: true });
});
// ─── FALLBACK: Legacy HTTP+SSE (older Claude Desktop versions) ───────────────
app.get('/sse', mcpAuthMiddleware, async (req, res) => {
    const transport = new SSEServerTransport('/messages', res);
    const sessionId = randomUUID();
    sseTransports.set(sessionId, transport);
    transport.onclose = () => sseTransports.delete(sessionId);
    const server = createServer();
    await server.connect(transport);
    await transport.start();
});
app.post('/messages', mcpAuthMiddleware, async (req, res) => {
    const sessionId = req.query['sessionId'];
    if (!sessionId || !sseTransports.has(sessionId)) {
        res.status(400).json({ error: 'Unknown or expired SSE session' });
        return;
    }
    await sseTransports.get(sessionId).handlePostMessage(req, res, req.body);
});
// ─── Start ───────────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
    console.log(`[mcp-huntress] Streamable HTTP : http://0.0.0.0:${PORT}/mcp`);
    console.log(`[mcp-huntress] Legacy SSE      : http://0.0.0.0:${PORT}/sse`);
    console.log(`[mcp-huntress] Health          : http://0.0.0.0:${PORT}/health`);
});
