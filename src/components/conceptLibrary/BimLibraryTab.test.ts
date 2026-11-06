// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { describe, expect, it } from 'vitest';
import { BIM_LIBRARY_PUBLIC, bimLibraryUrl, conceptDefinition, libraryFrameUrl } from './BimLibraryTab';

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

describe('the library sash (ROAD-3587)', () => {
  it('on an https page (the gateway) the app is this origin\'s /library/ — never http://…:8160, mixed content there', async () => {
    const was = (globalThis as unknown as { window: unknown }).window;
    (globalThis as unknown as { window: unknown }).window = { location: { protocol: 'https:', hostname: 'apk.local', origin: 'https://apk.local', hash: '#/drawing' } };
    const asked: string[] = [];
    const ok = (async (u: string) => { asked.push(String(u)); return { ok: true } as Response; }) as unknown as typeof fetch;
    expect(await bimLibraryUrl(ok)).toEqual({ url: 'https://apk.local/library/', live: true });
    expect(asked).toEqual(['https://apk.local/api/bim/health']);
    (globalThis as unknown as { window: unknown }).window = was;
  });

  it('opens the app in pick mode with this editor\'s theme', () => {
    const u = new URL(libraryFrameUrl('https://apk.local/library/'));
    expect(u.searchParams.get('mode')).toBe('pick');
    expect(u.searchParams.get('theme')).toBe('dark');
    expect(JSON.parse(u.searchParams.get('tokens') ?? '{}').bg).toBe('#1e1e1e');
  });

  it('a concept picked from the library is placed as the CAD\'s own symbol; a part as its BIM block', () => {
    expect(conceptDefinition({ id: 'concept/math-add', model: 'math-add' })?.id).toBe('math.add');
    expect(conceptDefinition({ id: 'concept/adapter-st2110-gateway' })?.id).toBe('adapter.st2110_gateway');
    expect(conceptDefinition({ id: 'keysight/34401a', model: '34401a' })).toBeNull();
  });
});

describe('📖 Catalog and the wide sash (ROAD-3603)', () => {
  it('opens the app on the Catalog lens when asked, the list otherwise', () => {
    expect(new URL(libraryFrameUrl('https://apk.local/library/', 'catalog')).searchParams.get('lens')).toBe('catalog');
    expect(new URL(libraryFrameUrl('https://apk.local/library/', 'part')).searchParams.has('lens')).toBe(false);
  });
});
