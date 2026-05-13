import { createHmac, timingSafeEqual } from 'crypto';

function secret() {
  return process.env.MEMBER_QR_SECRET ?? 'dev-qr-secret-change-in-production';
}

function sign(userId: string, gymId: string): string {
  return createHmac('sha256', secret())
    .update(`${userId}:${gymId}`)
    .digest('hex')
    .slice(0, 32);
}

/** Returns the string to encode in the QR code. */
export function buildQrPayload(userId: string, gymId: string): string {
  return `${userId}:${gymId}:${sign(userId, gymId)}`;
}

/** Verifies and parses a QR payload. Returns null if tampered or malformed. */
export function parseQrPayload(payload: string): { userId: string; gymId: string } | null {
  // UUIDs contain hyphens, not colons — so split(':') gives exactly 3 parts
  const idx1 = payload.indexOf(':');
  if (idx1 === -1) return null;
  const idx2 = payload.indexOf(':', idx1 + 1);
  if (idx2 === -1) return null;

  const userId = payload.slice(0, idx1);
  const gymId  = payload.slice(idx1 + 1, idx2);
  const sig    = payload.slice(idx2 + 1);

  if (!userId || !gymId || sig.length !== 32) return null;

  const expected = sign(userId, gymId);
  try {
    const aBuf = Buffer.from(sig.padEnd(32, '0'), 'hex');
    const bBuf = Buffer.from(expected, 'hex');
    if (aBuf.length !== bBuf.length) return null;
    if (!timingSafeEqual(aBuf, bBuf)) return null;
  } catch {
    return null;
  }

  return { userId, gymId };
}
