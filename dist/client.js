import axios from 'axios';
import https from 'https';
function buildHttpsAgent() {
    if (process.env.HUNTRESS_IGNORE_TLS_ERRORS === 'true') {
        return new https.Agent({ rejectUnauthorized: false });
    }
    return undefined;
}
function buildBasicAuth() {
    const key = process.env.HUNTRESS_API_KEY ?? '';
    const secret = process.env.HUNTRESS_API_SECRET ?? '';
    return Buffer.from(`${key}:${secret}`).toString('base64');
}
export function createHuntressClient() {
    const BASE_URL = (process.env.HUNTRESS_BASE_URL ?? 'https://api.huntress.io/v1').replace(/\/$/, '');
    const client = axios.create({
        baseURL: BASE_URL,
        headers: {
            'Authorization': `Basic ${buildBasicAuth()}`,
            'Content-Type': 'application/json',
        },
        httpsAgent: buildHttpsAgent(),
    });
    // Enrich error messages with response body for easier debugging
    client.interceptors.response.use((res) => res, (error) => {
        if (axios.isAxiosError(error)) {
            const status = error.response?.status ?? 'no response';
            const body = error.response?.data
                ? JSON.stringify(error.response.data)
                : '(no body)';
            const url = error.config?.url ?? '(unknown url)';
            throw new Error(`Huntress API error ${status} at ${url}: ${body}`);
        }
        throw error;
    });
    return client;
}
export const huntressClient = createHuntressClient();
//# sourceMappingURL=client.js.map