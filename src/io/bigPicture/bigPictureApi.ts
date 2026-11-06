// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { SchematicSnapshot } from '../../flow/Schematic';
import { bigPictureIfc, sheetFromIfc } from './bigPictureIfc';

/**
 * The wire to WEB.OsApi `server.py`'s Big Picture route — 06a's document of
 * record, filed as IFC (IFC4X3_ADD2 STEP) at the OS's `big-picture.ifc`.
 *
 * THE CONTRACT is `contract/big-picture@2/` at the root of this repository: a
 * JSON Schema and one sample of every body (read, write, saved, refused),
 * tested against this file by bigPictureContract.test.ts. The body carries the
 * sheet as STEP text (`ifc`), written by bigPictureIfc.ts — the CAD's own
 * schematic IFC (cad-6) — and every write names
 * `schema: 'cad.like.audio/big-picture@2'`.
 *
 * big-picture@1 (JSON on `/api/v1/big-picture`) is READ-ONLY on the server
 * for one release and removed on 2027-01-01 (WEB.OsApi big_picture.py
 * BIG_PICTURE_V1_REMOVAL). This client reads it in one case only: the v2 file
 * does not exist yet, so a sheet filed as JSON before 2026-11-06 is opened from
 * v1 and its next save files it as IFC (base null — there is no IFC to replace).
 * Remove V1_ENDPOINT and that branch with the server route.
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

/** The sheet as the editor holds it, plus what the server says about the file. */
export interface BigPictureSheet extends SchematicSnapshot {
  saved_at?: string | null;
  saved_by?: string;
  /** False when the server answered that no file exists yet. */
  exists?: boolean;
}

export interface BigPictureRead {
  sheet: BigPictureSheet;
  digest: string | null;
}

/** contract/big-picture@2 `read`: the filed STEP text, or null when nothing is filed. */
export interface BigPictureReadV2 {
  schema: typeof BIG_PICTURE_SCHEMA;
  ifc: string | null;
  digest: string | null;
  exists: boolean;
  saved_at: string | null;
}

export interface BigPictureWrite {
  saved_at: string;
  digest: string | null;
  groups: number;
  placements: number;
}

export const BIG_PICTURE_SCHEMA = 'cad.like.audio/big-picture@2';
export const BIG_PICTURE_ENDPOINT = '/api/v2/big-picture';
/** big-picture@1, read-only until 2027-01-01: read only to open a sheet filed as JSON before IFC. */
export const V1_ENDPOINT = '/api/v1/big-picture';
/** The server's cap (big_picture.py MAX_BIG_PICTURE_BYTES), checked here so a runaway is refused before it is sent. */
export const MAX_BIG_PICTURE_BYTES = 4 * 1024 * 1024;

const isIntArray = (v: unknown) => Array.isArray(v) && v.every((n) => Number.isInteger(n));

/** Is this the v2 read shape? Checked on the way in so a server answering something else is "no sheet", not a crash. */
export function isBigPictureReadV2(body: unknown): body is BigPictureReadV2 {
  if (!body || typeof body !== 'object') return false;
  const b = body as Record<string, unknown>;
  if (b.schema !== BIG_PICTURE_SCHEMA) return false;
  if (b.digest !== null && typeof b.digest !== 'string') return false;
  if (b.ifc !== null && typeof b.ifc !== 'string') return false;
  return typeof b.exists === 'boolean' && (b.exists ? typeof b.ifc === 'string' : b.ifc === null);
}

/**
 * Is this the v1 read shape (contract/big-picture@1 `read`)? The deep
 * invariants (one owner per placement, no group cycles) are the server's
 * validate_big_picture; this is the shape.
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

async function getJson(url: string): Promise<{ status: number; body: unknown } | null> {
  try {
    const response = await fetch(url, { headers: { Accept: 'application/json' } });
    return { status: response.status, body: response.ok ? await response.json() : null };
  } catch {
    return null;
  }
}

/** A sheet filed as JSON before IFC, read once so its next save files it as IFC (until 2027-01-01). */
async function legacySheet(): Promise<BigPictureSheet | null> {
  const old = await getJson(V1_ENDPOINT);
  if (!old || !isBigPictureRead(old.body) || !old.body.sheet.exists) return null;
  return old.body.sheet;
}

const EMPTY: BigPictureSheet = { placements: [], connectors: [], groups: [], nextPlacementId: 1, nextConnectorId: 1, nextGroupId: 1, saved_at: null, exists: false };

export async function fetchBigPicture(): Promise<BigPictureRead | null> {
  const read = await getJson(BIG_PICTURE_ENDPOINT);
  if (!read || !isBigPictureReadV2(read.body)) return null;
  const v2 = read.body;
  if (!v2.exists || v2.ifc === null) {
    // nothing filed as IFC: the digest to quote is null either way, whatever v1 holds
    const legacy = await legacySheet();
    return { sheet: legacy ? { ...legacy, exists: false } : { ...EMPTY }, digest: null };
  }
  try {
    return { sheet: { ...sheetFromIfc(v2.ifc), saved_at: v2.saved_at, exists: true }, digest: v2.digest };
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
  opts: { timestamp?: number } = {},
): Promise<SaveOutcome> {
  let ifc: string;
  try {
    ifc = await bigPictureIfc(sheet, { timestamp: opts.timestamp ?? Date.now(), fetcher: globalThis.fetch?.bind(globalThis) });
  } catch (err) {
    return { ok: false, conflict: false, message: `the sheet could not be written as IFC: ${(err as Error).message}` };
  }
  if (new TextEncoder().encode(ifc).length > MAX_BIG_PICTURE_BYTES) {
    return { ok: false, conflict: false, message: `that sheet is larger than ${MAX_BIG_PICTURE_BYTES / (1024 * 1024)} MB as IFC — nothing was sent.` };
  }
  try {
    const response = await fetch(BIG_PICTURE_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ schema: BIG_PICTURE_SCHEMA, ifc, base }),
    });
    const body = await response.json().catch(() => null);
    if (response.ok && body) return { ok: true, result: body as BigPictureWrite };
    return {
      ok: false,
      conflict: response.status === 409,
      message:
        (body && typeof body.error === 'string' && body.error) ||
        (response.status === 404
          ? 'this APK:OS server does not file the Big Picture as IFC yet (no /api/v2/big-picture) — rebuild WEB.OsApi.'
          : `the server refused the save (${response.status})`),
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
