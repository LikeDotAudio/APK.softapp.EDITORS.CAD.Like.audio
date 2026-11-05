// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { describe, expect, it } from 'vitest';
import type { CadBlockInstance } from '../../core/types';
import { patchPlacesKey } from './hostBridge';

const inst = (id: number, x: number, attributes?: Record<string, string>) =>
  ({ id, uuid: `u${id}`, blockName: 'B', x, y: 0, scale: 1, rotation: 0, layerId: '0', attributes }) as CadBlockInstance;

describe('a dragged product is republished where it was put down', () => {
  it('changes when a patch block moves, and not for a block the host does not see', () => {
    const blockInstances = new Map([
      [1, inst(1, 10, { paletteId: 'sim-group:rack' })],
      [2, inst(2, 50)],
    ]);
    const doc = { blockInstances };
    const before = patchPlacesKey(doc);
    blockInstances.get(2)!.x = 99;
    expect(patchPlacesKey(doc)).toBe(before);
    blockInstances.get(1)!.x = 12.5;
    expect(patchPlacesKey(doc)).not.toBe(before);
  });
});
