/**
 * NAS build config.
 *
 * The frontend and backend are served from the same host:port on the NAS,
 * so the API URL is whatever origin the user loaded the page from.
 * This means the same build works whether the user reaches the NAS via
 * its LAN IP (e.g. 192.168.178.140:8080) or its Tailscale IP
 * (e.g. 100.99.209.88:8080) — no hardcoded host to keep in sync.
 *
 * `apiBaseUrl` is a getter rather than a literal so it's evaluated when
 * read (after `window` is available), not at module load time.
 */
export const AppConfig = {
    production: true,
    get apiBaseUrl(): string {
        return typeof window !== 'undefined' ? window.location.origin : '';
    },
};
