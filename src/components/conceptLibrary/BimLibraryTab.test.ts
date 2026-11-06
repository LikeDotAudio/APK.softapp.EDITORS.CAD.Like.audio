// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { describe, expect, it } from 'vitest';
import { BIM_LIBRARY_PUBLIC, bimLibraryUrl } from './BimLibraryTab';

// the page this editor runs on: the bench, no saved address
(globalThis as unknown as { window: unknown }).window = { location: { protocol: 'http:', hostname: 'bench', hash: '#/drawing' } };

describe('where the BIM library app is (ROAD-3570)', () => {
  it('this host on 8160 when its API answers', async () => {
    const asked: string[] = [];
    const ok = (async (u: string) => { asked.push(String(u)); return { ok: true } as Response; }) as unknown as typeof fetch;
    const r = await bimLibraryUrl(ok);
    expect(r.live).toBe(true);
    expect(r.url).toBe('http://bench:8160/library');
    expect(asked[0]).toMatch(/:8160\/api\/bim\/health$/);
  });

  it('the published copy with its snapshot when nothing answers (cad.like.audio)', async () => {
    const down = (async () => { throw new TypeError('Failed to fetch'); }) as unknown as typeof fetch;
    expect(await bimLibraryUrl(down)).toEqual({ url: BIM_LIBRARY_PUBLIC, live: false });
  });
});
