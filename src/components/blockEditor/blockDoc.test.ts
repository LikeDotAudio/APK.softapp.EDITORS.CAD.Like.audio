// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { describe, expect, it } from 'vitest';
import { Doc } from '../../model/Doc';
import { restoreDoc } from '../../model/doc/restoreDoc';
import { toEditor } from '../../shell/hostBridge/blockHost';
import { blockForEditor, blockFromEditor } from './blockDoc';

/* cad-8 / cad-9, the CAD side: Save into CAD keeps the editor's whole block, and reopening hands it back. */

const plan = {
  type: 'floorplan', id: 'plan_1', name: 'Main Production Facility',
  floors: [{ id: 'floor_1', name: 'Ground', level: 1, rooms: [{ id: 'room_1', name: 'Control Room A', polygon: [{ x: 2, y: 2 }, { x: 12, y: 2 }, { x: 12, y: 10 }] }], drops: [{ id: 'dp_1', category: 'DATA', x: 7, y: 6 }] }],
};

describe('a softapp block saved into the CAD', () => {
  it('keeps the floors, rooms and drops of a floor plan through a save and a reopen', () => {
    const doc = new Doc();
    doc.blocks.set('FLOORPLAN', blockFromEditor('FLOORPLAN', plan));
    const reopened = new Doc();
    restoreDoc(reopened, JSON.parse(JSON.stringify(doc.snapshot())));
    const load = toEditor('load', { block: blockForEditor(reopened.blocks.get('FLOORPLAN'), 'FLOORPLAN', 'floorplan'), meta: { blockName: 'FLOORPLAN' } }) as unknown as { block: typeof plan };
    expect(load.block).toEqual(plan);
    expect(load.block.floors[0]!.rooms).toHaveLength(1);
  });

  it('still draws the symbol geometry the editor sent', () => {
    const def = blockFromEditor('SHEET', { type: 'drawingsheet', lines: [{ x1: 0, y1: 0, x2: 1, y2: 1 }], description: 'A sheet' });
    expect(def.lines).toHaveLength(1);
    expect(def.description).toBe('A sheet');
    expect(def.doc?.type).toBe('drawingsheet');
  });

  it('a block from before (no doc) and a new block load as they did', () => {
    const old = { name: 'OLD', basePoint: { x: 0, y: 0 }, lines: [], arcs: [], circles: [] };
    expect(blockForEditor(old, 'OLD', 'device')).toEqual(old);
    expect(blockForEditor(undefined, 'NEW', 'device', 5)).toEqual({ name: 'NEW', type: 'device', timestamp: 5 });
  });
});
