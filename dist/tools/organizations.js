import { z } from 'zod';
import { huntressClient } from '../client.js';
export function registerOrganizationTools(server) {
    server.tool('huntress_list_organizations', 'List all organisations/clients managed in Huntress.', {
        page: z.number().int().min(1).default(1).describe('Page number (1-based)'),
        limit: z.number().int().min(1).max(500).default(50).describe('Results per page'),
    }, async ({ page, limit }) => {
        try {
            const { data } = await huntressClient.get('/organizations', { params: { page, limit } });
            return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
        }
        catch (e) {
            return { content: [{ type: 'text', text: `Error: ${e instanceof Error ? e.message : String(e)}` }], isError: true };
        }
    });
    server.tool('huntress_get_organization', 'Get full details for a single Huntress organisation by ID.', {
        organization_id: z.number().int().describe('The Huntress organisation ID'),
    }, async ({ organization_id }) => {
        try {
            const { data } = await huntressClient.get(`/organizations/${organization_id}`);
            return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
        }
        catch (e) {
            return { content: [{ type: 'text', text: `Error: ${e instanceof Error ? e.message : String(e)}` }], isError: true };
        }
    });
}
//# sourceMappingURL=organizations.js.map