// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { SchematicSnapshot } from '../../flow/Schematic';

/**
 * The wire to WEB.OsApi `server.py`'s Big Picture route — 06a's document of
 * record, which lives at the OS's `system/big-picture.json`.
 *
 * THE CONTRACT is `contract/big-picture@1/` at the root of this repository: a
 * JSON Schema and one sample of every body (read, write, saved, refused),
 * tested against this file by bigPictureContract.test.ts. The route is
 * versioned: `/api/v1/big-picture` first, and — for one release, while the
 * server learns the new path — the old unversioned `/api/big-picture` when
 * that answers 404. Every write names `schema: 'cad.like.audio/big-picture@1'`
 * so the server can refuse a shape it does not know. A breaking change is
 * `@2` on a `/api/v2/` path, with `/api/v1/` kept for one release.
 *
 * WHY A DIGEST TRAVELS BOTH WAYS. The sheet is written whole, and two windows
 * can have it open. `digest` is what the client read; the server refuses a save
 * that does not quote the digest currently on disk, with a 409 and the real
 * one. Losing somebody's drawing is not recoverable with a keypress the way a
 * re-saved tape program is, so the refusal is the feature.
 *
 * WHY EVERY FAILURE IS SOFT. This app is also served from apk.audio, where
 * there is no `server.py` at all — the fetch 404s or never connects. That is a
 * sheet with no file behind it, not a broken editor: the browser session in
 * IndexedDB is still the working copy, and the Big Picture panel says the file
 * is unreachable rather than the window failing to open.
 */

/** The saved shape. A superset of the browser session's schematic snapshot. */
export interface BigPictureSheet extends SchematicSnapshot {
  saved_at?: string | null;
  saved_by?: string;
  /** False when the server answered an empty sheet because no file exists yet. */
  exists?: boolean;
}

export interface BigPictureRead {
  sheet: BigPictureSheet;
  digest: string | null;
}

export interface BigPictureWrite {
  saved_at: string;
  digest: string | null;
  groups: number;
  placements: number;
}

export const BIG_PICTURE_SCHEMA = 'cad.like.audio/big-picture@1';

/** Where the route is: the versioned path, then (one release) the legacy one. */
export const BIG_PICTURE_ENDPOINTS = ['/api/v1/big-picture', '/api/big-picture'] as const;

/** The versioned route, falling back to the legacy one only when the server does not know it (404). */
async function call(init?: RequestInit): Promise<Response> {
  let response: Response | null = null;
  for (const endpoint of BIG_PICTURE_ENDPOINTS) {
    response = await fetch(endpoint, init);
    if (response.status !== 404) return response;
  }
  return response!;
}

const isIntArray = (v: unknown) => Array.isArray(v) && v.every((n) => Number.isInteger(n));

/**
 * Is this the read shape (contract/big-picture@1 `read`)? Checked on the way in
 * so a server answering something else is "no sheet", not a crash three menus
 * later. The deep invariants (one owner per placement, no group cycles) are the
 * server's validate_big_picture; this is the shape.
 */
export function isBigPictureRead(body: unknown): body is BigPictureRead {
  if (!body || typeof body !== 'object') return false;
  const { sheet, digest } = body as { sheet?: unknown; digest?: unknown };
  if (digest !== null && typeof digest !== 'string') return false;
  if (!sheet || typeof sheet !== 'object') return false;
  const s = sheet as Record<string, unknown>;
  if (!Array.isArray(s.placements) || !Array.isArray(s.connectors)) return false;
  if (s.groups !== undefined && !Array.isArray(s.groups)) return false;
  const placementsOk = s.placements.every((p) => p && typeof p === 'object' && Number.isInteger((p as { id?: unknown }).id) && typeof (p as { definitionId?: unknown }).definitionId === 'string');
  const connectorsOk = s.connectors.every((c) => c && typeof c === 'object' && Number.isInteger((c as { id?: unknown }).id) && !!(c as { from?: unknown }).from && !!(c as { to?: unknown }).to);
  const groupsOk = ((s.groups ?? []) as unknown[]).every((g) => g && typeof g === 'object' && isIntArray((g as { members?: unknown }).members) && isIntArray((g as { children?: unknown }).children));
  return placementsOk && connectorsOk && groupsOk;
}

export async function fetchBigPicture(): Promise<BigPictureRead | null> {
  try {
    const response = await call({ headers: { Accept: 'application/json' } });
    if (!response.ok) return null;
    const body: unknown = await response.json();
    return isBigPictureRead(body) ? body : null;
  } catch {
    return null;
  }
}

export type SaveOutcome =
  | { ok: true; result: BigPictureWrite }
  | { ok: false; conflict: boolean; message: string };

export async function saveBigPicture(
  sheet: SchematicSnapshot,
  base: string | null,
): Promise<SaveOutcome> {
  try {
    const response = await call({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ schema: BIG_PICTURE_SCHEMA, sheet, base }),
    });
    const body = await response.json().catch(() => null);
    if (response.ok && body) return { ok: true, result: body as BigPictureWrite };
    return {
      ok: false,
      conflict: response.status === 409,
      message:
        (body && typeof body.error === 'string' && body.error) ||
        `the server refused the save (${response.status})`,
    };
  } catch {
    return {
      ok: false,
      conflict: false,
      message:
        'no APK:OS server answered — the sheet is still in this browser, but nothing was filed.',
    };
  }
}
