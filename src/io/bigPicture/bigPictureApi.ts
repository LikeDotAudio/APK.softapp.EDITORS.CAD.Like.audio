// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { SchematicSnapshot } from '../../flow/Schematic';

/**
 * The wire to `APK:OS/server.py`'s `/api/big-picture` — 06a's document of
 * record, which lives at `APK:OS/system/big-picture.json`.
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

/** Where the routes are, relative to wherever this bundle was served from. */
const ENDPOINT = '/api/big-picture';

export async function fetchBigPicture(): Promise<BigPictureRead | null> {
  try {
    const response = await fetch(ENDPOINT, { headers: { Accept: 'application/json' } });
    if (!response.ok) return null;
    const body = (await response.json()) as BigPictureRead;
    if (!body || typeof body !== 'object' || !body.sheet) return null;
    return body;
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
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sheet, base }),
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
