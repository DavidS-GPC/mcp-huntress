/**
 * Guards MCP endpoints with a shared secret.
 * Accepts either:
 *   Authorization: Bearer <key>
 *   x-mcp-key: <key>
 */
export function mcpAuthMiddleware(req, res, next) {
    const authHeader = req.headers['authorization'];
    const keyHeader = req.headers['x-mcp-key'];
    const expectedKey = process.env.MCP_AUTH_KEY;
    if (!expectedKey) {
        res.status(500).json({ error: 'MCP_AUTH_KEY not configured on server' });
        return;
    }
    const provided = keyHeader ??
        (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined);
    if (provided !== expectedKey) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }
    next();
}
