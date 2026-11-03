import { describe, expect, it } from 'vitest';
import { autoLayoutSchematic } from './autoLayout';
import { createSchematic, placeBlock } from './Schematic';

describe('autoLayout', () => {
  it('automatically positions connected blocks into processing columns', () => {
    const model = createSchematic();
    const b1 = placeBlock(model, 'flow.source', { x: 0, y: 0 })!;
    const b2 = placeBlock(model, 'flow.process', { x: 0, y: 0 })!;
    const b3 = placeBlock(model, 'flow.sink', { x: 0, y: 0 })!;

    // Connect b1 -> b2 -> b3
    model.connectors.push({
      id: 1,
      from: { placementId: b1.id, portId: 'OUT' },
      to: { placementId: b2.id, portId: 'IN' },
      layerId: '0',
    });
    model.connectors.push({
      id: 2,
      from: { placementId: b2.id, portId: 'OUT' },
      to: { placementId: b3.id, portId: 'IN' },
      layerId: '0',
    });

    const changed = autoLayoutSchematic(model);
    expect(changed).toBe(true);

    // Columns should flow b1 (x=0) < b2 (x=3.2) < b3 (x=6.4)
    expect(b1.at.x).toBeLessThan(b2.at.x);
    expect(b2.at.x).toBeLessThan(b3.at.x);
  });
});
