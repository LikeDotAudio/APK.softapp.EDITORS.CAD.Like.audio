// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { describe, expect, it } from 'vitest';
import type { FillEntity } from '../../core/types';
import type { EditorStore } from '@state/EditorStore';
import { repaintHostItems } from './hostMove';

function fakeStore() {
  const fill = (id: number, extra: Partial<FillEntity>): FillEntity => ({ id, type: 'hatch', points: [], layerId: 'Elevation Front', ...extra }) as FillEntity;
  const fills = new Map<number, FillEntity>([
    [1, fill(1, { paletteId: 'absorber-100', color: '#3f8f4a', hatchPattern: 'ANSI31' })],
    [2, fill(2, {})],
    [3, fill(3, { paletteId: 'panel', hostKey: 'panels' })],
  ]);
  const pushed: unknown[] = [];
  const store = {
    doc: { fills, snapshot: () => 'snap' },
    history: { push: (s: unknown) => pushed.push(s) },
    palette: { title: 'p', items: [{ id: 'qrd', name: 'QRD', category: 'Diffuser', color: '#d4a52a', hatch: 'SOLID' }] },
    markDocChanged() {},
    requestDraw() {},
    emit() {},
  };
  return { store: store as unknown as EditorStore, fills, pushed };
}

describe('a host repaints a region', () => {
  it('turns a painted region into another item, one undo step, its look the item’s', () => {
    const { store, fills, pushed } = fakeStore();
    expect(repaintHostItems(store, { ids: ['fill:1'], paletteId: 'qrd' })).toBe(1);
    expect(fills.get(1)).toMatchObject({ paletteId: 'qrd', type: 'solid', hatchPattern: 'SOLID', color: '#d4a52a' });
    expect(pushed).toHaveLength(1);
  });
  it('leaves an unpainted fill, the host’s own marks, a block and an unknown item alone', () => {
    const { store, fills, pushed } = fakeStore();
    expect(repaintHostItems(store, { ids: ['fill:2', 'fill:3', 'block:1'], paletteId: 'qrd' })).toBe(0);
    expect(repaintHostItems(store, { ids: ['fill:1'], paletteId: 'nope' })).toBe(0);
    expect(fills.get(3)!.paletteId).toBe('panel');
    expect(pushed).toHaveLength(0);
  });
});
