// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { describe, expect, it } from 'vitest';
import { bimPartOf } from './exportIfc';

describe('bimPartOf', () => {
  it('cuts the per-block suffix, so an export asks for the part that exists', () => {
    expect(bimPartOf({ definitionId: 'bim.keysight/3235@sim-bench:U19' })).toBe('keysight/3235');
    expect(bimPartOf({ definitionId: 'bim.meyer-sound/09-087-001-11' })).toBe('meyer-sound/09-087-001-11');
  });
  it('is null for a catalogue or connector block, and for an empty id', () => {
    expect(bimPartOf({ definitionId: 'conn.XLR3-F' })).toBeNull();
    expect(bimPartOf({ definitionId: 'bim.' })).toBeNull();
    expect(bimPartOf({ definitionId: 'bim.@x' })).toBeNull();
  });
});
