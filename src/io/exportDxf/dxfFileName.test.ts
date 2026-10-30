// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { describe, expect, it } from 'vitest';
import { dxfFileName } from './dxfFileName';

describe('dxfFileName', () => {
  it("suggests the drawing's own name", () => {
    expect(dxfFileName('mm', 'bracket.dxf')).toBe('bracket.dxf');
    expect(dxfFileName('in', 'Clipboard.json')).toBe('Clipboard.dxf');
    expect(dxfFileName('mm', 'plans/room 2.png')).toBe('room 2.dxf');
  });

  it('falls back to my-part-<units>.dxf only for an unnamed drawing', () => {
    expect(dxfFileName('mm', null)).toBe('my-part-mm.dxf');
    expect(dxfFileName('in')).toBe('my-part-in.dxf');
    expect(dxfFileName('in', '  ')).toBe('my-part-in.dxf');
  });
});
