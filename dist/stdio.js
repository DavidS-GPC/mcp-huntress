/**
 * Stdio entry point for Claude Desktop.
 *
 * dotenv must be loaded before any other local modules — static imports are
 * hoisted in ES modules, so we use dynamic imports below to guarantee the
 * env file is loaded first.
 */
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
// ── 1. Load .env before anything else touches process.env ──────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '..', '.env') });
// ── 2. Dynamic imports — evaluated only after config() has run ─────────────
const { McpServer } = await import('@modelcontextprotocol/sdk/server/mcp.js');
const { StdioServerTransport } = await import('@modelcontextprotocol/sdk/server/stdio.js');
const { registerAccountTools } = await import('./tools/account.js');
const { registerOrganizationTools } = await import('./tools/organizations.js');
const { registerAgentTools } = await import('./tools/agents.js');
const { registerIncidentTools } = await import('./tools/incidents.js');
const { registerReportTools } = await import('./tools/reports.js');
// ── 3. Wire up server ──────────────────────────────────────────────────────
const server = new McpServer({ name: 'mcp-huntress', version: '1.0.0' });
registerAccountTools(server);
registerOrganizationTools(server);
registerAgentTools(server);
registerIncidentTools(server);
registerReportTools(server);
const transport = new StdioServerTransport();
await server.connect(transport);
//# sourceMappingURL=stdio.js.map