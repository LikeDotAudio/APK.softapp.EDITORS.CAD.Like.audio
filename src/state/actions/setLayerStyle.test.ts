// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { describe, expect, it } from 'vitest';
import type { Layer } from '../../core/types';
import { applyLayerStyle } from './setLayerStyle';

const layer = (extra: Partial<Layer> = {}): Layer => ({ id: 'L', name: 'L', color: '#fff', visible: true, ...extra });

describe('applyLayerStyle', () => {
  it('sets a declared linetype by name, in any case', () => {
    const l = layer();
    expect(applyLayerStyle(l, { linetype: 'hidden' })).toBe(true);
    expect(l.linetype).toBe('HIDDEN');
  });

  it('takes CONTINUOUS (or nothing) back to the absent default', () => {
    const l = layer({ linetype: 'DASHED' });
    expect(applyLayerStyle(l, { linetype: 'CONTINUOUS' })).toBe(true);
    expect('linetype' in l).toBe(false);
    expect(applyLayerStyle(l, { linetype: '' })).toBe(false);
  });

  it("drops a file-borne pattern when a declared linetype replaces it, and keeps it when the layer's own name is picked", () => {
    const l = layer({ linetype: 'FENCE', linetypePattern: [4, -2] });
    expect(applyLayerStyle(l, { linetype: 'FENCE' })).toBe(false);
    expect(l).toMatchObject({ linetype: 'FENCE', linetypePattern: [4, -2] });
    applyLayerStyle(l, { linetype: 'CENTER' });
    expect(l.linetype).toBe('CENTER');
    expect('linetypePattern' in l).toBe(false);
  });

  it('refuses a linetype that is neither declared nor the layer’s own', () => {
    const l = layer({ linetype: 'DASHED' });
    expect(applyLayerStyle(l, { linetype: 'ZIGZAG' })).toBe(false);
    expect(l.linetype).toBe('DASHED');
  });

  it('snaps a lineweight to a DXF step, and null takes it back to Default', () => {
    const l = layer();
    applyLayerStyle(l, { lineweight: 52 });
    expect(l.lineweight).toBe(53);
    applyLayerStyle(l, { lineweight: 0 });
    expect(l.lineweight).toBe(0);
    applyLayerStyle(l, { lineweight: null });
    expect('lineweight' in l).toBe(false);
  });

  it('leaves alone what it was not asked about', () => {
    const l = layer({ linetype: 'DOT', lineweight: 35 });
    applyLayerStyle(l, { lineweight: 50 });
    expect(l).toMatchObject({ linetype: 'DOT', lineweight: 50 });
    applyLayerStyle(l, { linetype: 'BORDER' });
    expect(l).toMatchObject({ linetype: 'BORDER', lineweight: 50 });
  });
});
