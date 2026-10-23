// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { describe, expect, it } from 'vitest';
import type { Layer } from '../../core/types';
import { Doc } from '../../model/Doc';
import { sceneForHost } from './sceneForHost';

const layers = (visible = true): Map<string, Layer> =>
  new Map([['0', { id: '0', name: '0', color: '#ffffff', visible }]]);

function rectangle(doc: Doc, w: number, h: number): void {
  doc.addLine({ x: 0, y: 0 }, { x: w, y: 0 });
  doc.addLine({ x: w, y: 0 }, { x: w, y: h });
  doc.addLine({ x: w, y: h }, { x: 0, y: h });
  doc.addLine({ x: 0, y: h }, { x: 0, y: 0 });
}

describe('sceneForHost', () => {
  it('hands a closed rectangle over as four walls and one room', () => {
    const doc = new Doc();
    rectangle(doc, 5, 7);
    const g = sceneForHost(doc, 'm', layers());
    expect(g.walls).toHaveLength(4);
    expect(g.rooms).toHaveLength(1);
    expect(g.rooms[0]!.points).toHaveLength(4);
    expect(g.units).toBe('m');
  });

  it('tessellates an arc into several wall segments', () => {
    const doc = new Doc();
    doc.addArc(0, 0, 2, { x: 2, y: 0 }, { x: 0, y: 2 });
    const g = sceneForHost(doc, 'm', layers());
    expect(g.walls.length).toBeGreaterThan(2);
    const last = g.walls[g.walls.length - 1]!;
    expect(last.b[0]).toBeCloseTo(0);
    expect(last.b[1]).toBeCloseTo(2);
  });

  it('leaves hidden layers out, so the host never draws over what is not shown', () => {
    const doc = new Doc();
    rectangle(doc, 5, 7);
    const g = sceneForHost(doc, 'm', layers(false));
    expect(g.walls).toHaveLength(0);
    expect(g.rooms).toHaveLength(0);
  });
});

describe('hostFromHash', () => {
  it('reads the host a softapp names in the fragment, and nothing otherwise', async () => {
    const { hostFromHash, entranceFromHash } = await import('../entrance');
    expect(hostFromHash('#/drawing?host=acoustic')).toBe('acoustic');
    expect(hostFromHash('#/drawing')).toBeNull();
    expect(entranceFromHash('#/drawing?host=acoustic')).toBe('drawing');
  });
});
