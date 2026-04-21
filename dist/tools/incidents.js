import { z } from 'zod';
import { huntressClient } from '../client.js';
export function registerIncidentTools(server) {
    server.tool('huntress_list_incidents', 'List Huntress incident reports. Filter by status, severity, organisation, or date range.', {
        organization_id: z.number().int().optional().describe('Filter to a specific organisation'),
        agent_id: z.number().int().optional().describe('Filter to a specific agent/endpoint'),
        status: z.enum(['open', 'resolved', 'sent', 'closed']).optional().describe('Filter by incident status'),
        severity: z.enum(['low', 'medium', 'high', 'critical']).optional().describe('Filter by severity'),
        platform: z.enum(['windows', 'mac', 'linux']).optional().describe('Filter by platform'),
        sent_after: z.string().optional().describe('ISO 8601 date — only incidents sent after this date'),
        sent_before: z.string().optional().describe('ISO 8601 date — only incidents sent before this date'),
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(500).default(50),
    }, async ({ organization_id, agent_id, status, severity, platform, sent_after, sent_before, page, limit }) => {
        try {
            const params = { page, limit };
            if (organization_id)
                params.organization_id = organization_id;
            if (agent_id)
                params.agent_id = agent_id;
            if (status)
                params.status = status;
            if (severity)
                params.severity = severity;
            if (platform)
                params.platform = platform;
            if (sent_after)
                params.sent_after = sent_after;
            if (sent_before)
                params.sent_before = sent_before;
            const { data } = await huntressClient.get('/incident_reports', { params });
            return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
        }
        catch (e) {
            return { content: [{ type: 'text', text: `Error: ${e instanceof Error ? e.message : String(e)}` }], isError: true };
        }
    });
    server.tool('huntress_get_incident', 'Get full details for a single Huntress incident report by ID, including all indicators and remediation steps.', {
        incident_id: z.number().int().describe('The Huntress incident report ID'),
    }, async ({ incident_id }) => {
        try {
            const { data } = await huntressClient.get(`/incident_reports/${incident_id}`);
            return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
        }
        catch (e) {
            return { content: [{ type: 'text', text: `Error: ${e instanceof Error ? e.message : String(e)}` }], isError: true };
        }
    });
    server.tool('huntress_resolve_incident', 'Mark a Huntress incident report as resolved.', {
        incident_id: z.number().int().describe('The Huntress incident report ID to resolve'),
        note: z.string().optional().describe('Optional resolution note/comment'),
    }, async ({ incident_id, note }) => {
        try {
            const payload = {};
            if (note)
                payload.note = note;
            const { data } = await huntressClient.post(`/incident_reports/${incident_id}/resolution`, payload);
            return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
        }
        catch (e) {
            return { content: [{ type: 'text', text: `Error: ${e instanceof Error ? e.message : String(e)}` }], isError: true };
        }
    });
    server.tool('huntress_approve_remediations', 'Bulk approve remediations for a Huntress incident report.', {
        incident_id: z.number().int().describe('The Huntress incident report ID'),
        remediation_ids: z.array(z.number().int()).optional().describe('Specific remediation IDs to approve. Omit to approve all.'),
    }, async ({ incident_id, remediation_ids }) => {
        try {
            const payload = {};
            if (remediation_ids?.length)
                payload.remediation_ids = remediation_ids;
            const { data } = await huntressClient.post(`/incident_reports/${incident_id}/remediations/bulk_approval`, payload);
            return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
        }
        catch (e) {
            return { content: [{ type: 'text', text: `Error: ${e instanceof Error ? e.message : String(e)}` }], isError: true };
        }
    });
}
//# sourceMappingURL=incidents.js.map