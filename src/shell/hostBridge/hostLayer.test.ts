// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { describe, expect, it } from 'vitest';
import type { Layer } from '../../core/types';
import type { EditorStore } from '@state/EditorStore';
import { ensureHostLayer } from './hostLayer';

function fakeStore() {
  const layers = new Map<string, Layer>([['0', { id: '0', name: '0', color: '#fff', visible: true }]]);
  const store = {
    layers,
    activeLayerId: '0',
    addLayer(name: string, color = '#3b82f6') {
      layers.set(name, { id: name, name, color, visible: true });
      store.activeLayerId = name;
    },
    setLayerFinish(id: string, finish: string | null) {
      const l = layers.get(id)!;
      if (finish) l.finish = finish;
      else delete l.finish;
    },
    requestDraw() {},
    emit() {},
  };
  return store;
}

describe('a host keeps a layer', () => {
  it('makes it without making it current, colours it, sets and clears its finish', () => {
    const s = fakeStore();
    expect(ensureHostLayer(s as unknown as EditorStore, { name: 'Room · A · Finishes', color: '#888', finish: 'carpet' })).toBe(true);
    expect(s.activeLayerId).toBe('0');
    expect(s.layers.get('Room · A · Finishes')).toMatchObject({ color: '#888', finish: 'carpet' });
    expect(ensureHostLayer(s as unknown as EditorStore, { name: 'Room · A · Finishes' })).toBe(false);
    expect(s.layers.get('Room · A · Finishes')!.finish).toBe('carpet');
    ensureHostLayer(s as unknown as EditorStore, { name: 'Room · A · Finishes', finish: null });
    expect(s.layers.get('Room · A · Finishes')!.finish).toBeUndefined();
    expect(ensureHostLayer(s as unknown as EditorStore, { name: '  ' })).toBe(false);
  });
});
