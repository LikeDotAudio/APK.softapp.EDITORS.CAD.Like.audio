// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { afterEach, describe, expect, it, vi } from 'vitest';
import schema from '../../../contract/big-picture@1/big-picture.schema.json';
import samples from '../../../contract/big-picture@1/samples.json';
// @ts-expect-error — plain JS shipped with the contract, no .d.ts on purpose
import { validate } from '../../../contract/validate.mjs';
import type { SchematicSnapshot } from '../../flow/Schematic';
import { BIG_PICTURE_SCHEMA, fetchBigPicture, isBigPictureRead, saveBigPicture } from './bigPictureApi';

/*
 * The CUSTOMER side of contract/big-picture@1. WEB.OsApi (server.py) is the
 * supplier; it is asked to answer in these sample shapes and to serve the
 * versioned path. This proves the client reads every sample, writes the
 * schema's `write` body, and moves to the legacy path only on a 404.
 */

const def = (name: string) => schema.$defs[name as keyof typeof schema.$defs];
const check = (name: string, value: unknown) => validate(def(name), value, schema);

function respond(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as Response;
}

afterEach(() => vi.unstubAllGlobals());

describe('cad.like.audio/big-picture@1', () => {
  it('every sample fits its schema', () => {
    expect(schema['x-protocol']).toBe(BIG_PICTURE_SCHEMA);
    expect(check('read', samples.read)).toEqual([]);
    expect(check('read', samples.readEmpty)).toEqual([]);
    expect(check('write', samples.write)).toEqual([]);
    expect(check('saved', samples.saved)).toEqual([]);
    expect(check('refused', samples.conflict)).toEqual([]);
  });

  it('the client accepts both read samples and refuses a sheet without its lists', () => {
    expect(isBigPictureRead(samples.read)).toBe(true);
    expect(isBigPictureRead(samples.readEmpty)).toBe(true);
    expect(isBigPictureRead({ sheet: { placements: [] }, digest: null })).toBe(false);
    expect(isBigPictureRead({ sheet: { placements: [{ id: 'x' }], connectors: [] }, digest: null })).toBe(false);
  });

  it('reads the versioned route, and the legacy one only when that is a 404', async () => {
    const calls: string[] = [];
    vi.stubGlobal('fetch', async (url: string) => {
      calls.push(url);
      return url === '/api/v1/big-picture' ? respond(404, {}) : respond(200, samples.read);
    });
    expect((await fetchBigPicture())?.digest).toBe(samples.read.digest);
    expect(calls).toEqual(['/api/v1/big-picture', '/api/big-picture']);

    calls.length = 0;
    vi.stubGlobal('fetch', async (url: string) => (calls.push(url), respond(200, samples.readEmpty)));
    expect((await fetchBigPicture())?.sheet.exists).toBe(false);
    expect(calls).toEqual(['/api/v1/big-picture']);
  });

  it('writes the schema\'s write body, and reads a 409 as a conflict', async () => {
    let sent: unknown = null;
    vi.stubGlobal('fetch', async (_url: string, init: RequestInit) => {
      sent = JSON.parse(String(init.body));
      return respond(409, samples.conflict);
    });
    const outcome = await saveBigPicture(samples.write.sheet as unknown as SchematicSnapshot, samples.write.base);
    expect(check('write', sent)).toEqual([]);
    expect(outcome).toMatchObject({ ok: false, conflict: true });
  });
});
