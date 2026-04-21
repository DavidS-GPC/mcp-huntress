import { z } from 'zod';
import { huntressClient } from '../client.js';
export function registerReportTools(server) {
    server.tool('huntress_list_reports', 'List Huntress summary reports (monthly threat summaries per organisation).', {
        organization_id: z.number().int().optional().describe('Filter to a specific organisation'),
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(500).default(50),
    }, async ({ organization_id, page, limit }) => {
        try {
            const params = { page, limit };
            if (organization_id)
                params.organization_id = organization_id;
            const { data } = await huntressClient.get('/reports', { params });
            return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
        }
        catch (e) {
            return { content: [{ type: 'text', text: `Error: ${e instanceof Error ? e.message : String(e)}` }], isError: true };
        }
    });
    server.tool('huntress_list_billing_reports', 'List Huntress billing reports. Useful for checking agent counts and subscription usage.', {
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(500).default(50),
    }, async ({ page, limit }) => {
        try {
            const { data } = await huntressClient.get('/billing_reports', { params: { page, limit } });
            return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
        }
        catch (e) {
            return { content: [{ type: 'text', text: `Error: ${e instanceof Error ? e.message : String(e)}` }], isError: true };
        }
    });
}
//# sourceMappingURL=reports.js.map