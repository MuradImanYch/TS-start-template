const revoked = new Map<string, { exp: number }>();

const CLEAN_INTERVAL_MS = 60_000;

const interval: NodeJS.Timeout = setInterval(() => {
  const now = Date.now();
  for (const [t, obj] of revoked.entries()) {
    if (!obj || obj.exp <= now) revoked.delete(t);
  }
}, CLEAN_INTERVAL_MS);

if (typeof (interval as any).unref === 'function') {
  (interval as any).unref();
}

/**
 * 
 * @param token
 * @param expMs
 * 
 */
export function revokeTokenString(token: string, expMs?: number): void {
  const fallback = Date.now() + 12 * 3600 * 1000;
  revoked.set(String(token), { exp: Number(expMs ?? fallback) });
}

/**
 *
 * @param token
 */
export function isTokenRevoked(token: string): boolean {
  return revoked.has(String(token));
}

export const _revokedMap = revoked;

export default { revokeTokenString, isTokenRevoked, _revokedMap };
