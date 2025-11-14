const revoked = new Map();
const CLEAN_INTERVAL_MS = 60000;
const interval = setInterval(() => {
    const now = Date.now();
    for (const [t, obj] of revoked.entries()) {
        if (!obj || obj.exp <= now)
            revoked.delete(t);
    }
}, CLEAN_INTERVAL_MS);
if (typeof interval.unref === 'function') {
    interval.unref();
}
/**
 *
 * @param token
 * @param expMs
 *
 */
export function revokeTokenString(token, expMs) {
    const fallback = Date.now() + 12 * 3600 * 1000;
    revoked.set(String(token), { exp: Number(expMs ?? fallback) });
}
/**
 *
 * @param token
 */
export function isTokenRevoked(token) {
    return revoked.has(String(token));
}
export const _revokedMap = revoked;
export default { revokeTokenString, isTokenRevoked, _revokedMap };
