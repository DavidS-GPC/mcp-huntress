import { huntressClient } from '../client.js';
export function registerAccountTools(server) {
    server.tool('huntress_get_account', 'Get the current Huntress account details — name, plan, partner info.', {}, async () => {
        try {
            const { data } = await huntressClient.get('/account');
            return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
        }
        catch (e) {
            return { content: [{ type: 'text', text: `Error: ${e instanceof Error ? e.message : String(e)}` }], isError: true };
        }
    });
}
//# sourceMappingURL=account.js.map