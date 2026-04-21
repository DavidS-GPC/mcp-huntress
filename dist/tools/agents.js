import { z } from 'zod';
import { huntressClient } from '../client.js';
export function registerAgentTools(server) {
    server.tool('huntress_list_agents', 'List Huntress agents (endpoints) across all organisations or filtered by a specific one.', {
        organization_id: z.number().int().optional().describe('Filter to a specific organisation ID'),
        platform: z.enum(['windows', 'mac', 'linux']).optional().describe('Filter by OS platform'),
        status: z.enum(['online', 'offline']).optional().describe('Filter by agent connectivity status'),
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(500).default(50),
    }, async ({ organization_id, platform, status, page, limit }) => {
        try {
            const params = { page, limit };
            if (organization_id)
                params.organization_id = organization_id;
            if (platform)
                params.platform = platform;
            if (status)
                params.status = status;
            const { data } = await huntressClient.get('/agents', { params });
            return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
        }
        catch (e) {
            return { content: [{ type: 'text', text: `Error: ${e instanceof Error ? e.message : String(e)}` }], isError: true };
        }
    });
    server.tool('huntress_get_agent', 'Get full details for a single Huntress agent/endpoint by ID.', {
        agent_id: z.number().int().describe('The Huntress agent ID'),
    }, async ({ agent_id }) => {
        try {
            const { data } = await huntressClient.get(`/agents/${agent_id}`);
            return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
        }
        catch (e) {
            return { content: [{ type: 'text', text: `Error: ${e instanceof Error ? e.message : String(e)}` }], isError: true };
        }
    });
}
//# sourceMappingURL=agents.js.map