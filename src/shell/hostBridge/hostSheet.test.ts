// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { describe, expect, it } from 'vitest';
import type { Layer } from '../../core/types';
import { Doc } from '../../model/Doc';
import { drawSeed, layerEdgeIds } from './hostSheet';
import { sceneForHost } from './sceneForHost';

describe('hostSheet', () => {
  it('draws a seed as one closed loop on its own layer', () => {
    const doc = new Doc();
    doc.addLine({ x: 0, y: 0 }, { x: 5, y: 0 });
    const ids = drawSeed(doc, 'Elevation Left', [[10, 0], [17, 0], [17, 3], [10, 3]]);
    expect(ids).toHaveLength(4);
    expect(layerEdgeIds(doc, 'Elevation Left')).toEqual(ids);
    expect(layerEdgeIds(doc, '0')).toHaveLength(1);
    const layers = new Map<string, Layer>([
      ['0', { id: '0', name: '0', color: '#fff', visible: true }],
      ['Elevation Left', { id: 'Elevation Left', name: 'Elevation Left', color: '#fff', visible: true }],
    ]);
    const rooms = sceneForHost(doc, 'm', layers).rooms;
    expect(rooms).toHaveLength(1);
    expect(rooms[0]!.layerId).toBe('Elevation Left');
  });
});
