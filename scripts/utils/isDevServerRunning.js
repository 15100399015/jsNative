const net = require("net");
const node_fetch = require("node-fetch");
/**
 * Determine whether we can run the dev server.
 *
 * Return values:
 * - `not_running`: The port is unoccupied.
 * - `matched_server_running`: The port is occupied by another instance of this
 *   dev server (matching the passed `projectRoot`).
 * - `port_taken`: The port is occupied by another process.
 * - `unknown`: An error was encountered; attempt server creation anyway.
 */
async function isDevServerRunning(scheme, host, port, projectRoot) {
    try {
        if (!(await isPortOccupied(host, port))) {
            return 'not_running';
        }
        const statusResponse = await node_fetch(`${scheme}://${host}:${port}/status`);
        const body = await statusResponse.text();
        return body === 'packager-status:running' &&
            statusResponse.headers.get('X-React-Native-Project-Root') === projectRoot
            ? 'matched_server_running'
            : 'port_taken';
    }
    catch (e) {
        return 'unknown';
    }
}
module.exports = isDevServerRunning;
async function isPortOccupied(host, port) {
    let result = false;
    const server = net.createServer();
    return new Promise((resolve, reject) => {
        server.once('error', e => {
            server.close();
            if (e.code === 'EADDRINUSE') {
                result = true;
            }
            else {
                reject(e);
            }
        });
        server.once('listening', () => {
            result = false;
            server.close();
        });
        server.once('close', () => {
            resolve(result);
        });
        server.listen({ host, port });
    });
}
