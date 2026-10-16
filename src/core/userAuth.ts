// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.

/**
 * Cryptographic user permission and hash verification.
 *
 * Computes a deterministic SHA-256 digest over username and authorization status
 * using Web Crypto (`crypto.subtle`), enabling verifiable permission gating
 * (e.g., verifying `status === 'allowed'` before permitting save/export operations).
 */

export type UserStatus = 'allowed' | 'read_only' | 'blocked' | 'guest';

export interface UserAuth {
  username: string;
  status: UserStatus | string;
  hash: string;
  timestamp: number;
}

const DEFAULT_AUTH_SALT = 'APK:CAD:USER:AUTH:2026';

/**
 * Computes a SHA-256 hash string from username, status, and application salt.
 */
export async function generateUserStatusHash(
  username: string,
  status: string,
  salt = DEFAULT_AUTH_SALT,
): Promise<string> {
  const normalizedUser = username.trim().toLowerCase();
  const normalizedStatus = status.trim().toLowerCase();
  const payload = `${normalizedUser}:${normalizedStatus}:${salt}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(payload);

  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  // FNV-1a fallback when crypto.subtle is unavailable
  let hash = 0x811c9dc5;
  for (let i = 0; i < data.length; i++) {
    hash ^= data[i];
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * Creates a signed UserAuth credential object for a given user and status.
 */
export async function createUserAuth(
  username: string,
  status: UserStatus = 'allowed',
  salt = DEFAULT_AUTH_SALT,
): Promise<UserAuth> {
  const hash = await generateUserStatusHash(username, status, salt);
  return {
    username: username.trim(),
    status,
    hash,
    timestamp: Date.now(),
  };
}

/**
 * Verifies that the given hash matches the username and status cryptographically.
 */
export async function verifyUserStatus(
  username: string,
  status: string,
  providedHash: string,
  salt = DEFAULT_AUTH_SALT,
): Promise<boolean> {
  const expectedHash = await generateUserStatusHash(username, status, salt);
  return expectedHash.toLowerCase() === providedHash.trim().toLowerCase();
}

/**
 * Checks whether the user credentials allow saving and writes.
 */
export async function canUserSave(
  userAuth: UserAuth | null | undefined,
  salt = DEFAULT_AUTH_SALT,
): Promise<{ allowed: boolean; reason?: string }> {
  if (!userAuth || !userAuth.username) {
    return { allowed: false, reason: 'Anonymous or unauthenticated session.' };
  }
  if (userAuth.status !== 'allowed') {
    return {
      allowed: false,
      reason: `User "${userAuth.username}" status is "${userAuth.status}" (saving requires "allowed").`,
    };
  }
  const isValid = await verifyUserStatus(userAuth.username, userAuth.status, userAuth.hash, salt);
  if (!isValid) {
    return { allowed: false, reason: 'Cryptographic status hash mismatch or forged token.' };
  }
  return { allowed: true };
}
