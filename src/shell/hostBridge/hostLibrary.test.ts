// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { describe, expect, it } from 'vitest';
import schema from '../../../contract/host@1/host.schema.json';
// @ts-expect-error — plain JS shipped with the contract, no .d.ts on purpose
import { validateMessage } from '../../../contract/validate.mjs';
import { HOST_HANDLERS, HOST_PROTOCOL, offerLibraryToHost } from './hostBridge';

describe('one library per sheet (ROAD-3603): a host that owns the library is asked, not doubled', () => {
  it('opens its own sash until the host says hello { library: true }; then sends library { lens } and opens none', () => {
    const sent: unknown[] = [];
    const parent = { postMessage: (m: unknown) => sent.push(m) };
    (globalThis as unknown as { window: unknown }).window = { parent, location: { origin: 'https://apk.local' } };
    expect(offerLibraryToHost('part')).toBe(false);
    const store = { } as never;
    try { HOST_HANDLERS.hello!(store, { library: true }); } catch { /* publishToHost needs a whole store: not this test's */ }
    expect(offerLibraryToHost('catalog')).toBe(true);
    expect(sent).toEqual([{ protocol: HOST_PROTOCOL, type: 'library', lens: 'catalog' }]);
    expect(validateMessage(schema, 'toHost', sent[0])).toEqual([]);
    try { HOST_HANDLERS.hello!(store, {}); } catch { /* as above */ }
    expect(offerLibraryToHost('part')).toBe(false);
  });
});
