import { describe, expect, it } from 'vitest';
import { applyChamfers, routeWaterfallWire } from './autoWire';

describe('autoWire', () => {
  it('applies 45-degree chamfers to orthogonal 90-degree corners', () => {
    const rawManhattan = [
      { x: 0, y: 0 },
      { x: 2, y: 0 },
      { x: 2, y: 2 },
    ];
    const chamfered = applyChamfers(rawManhattan, 0);
    // Should split corner into 2 points
    expect(chamfered.length).toBe(4);
    expect(chamfered[0]).toEqual({ x: 0, y: 0 });
    expect(chamfered[chamfered.length - 1]).toEqual({ x: 2, y: 2 });
    // Intermediate chamfer points
    expect(chamfered[1].x).toBeLessThan(2);
    expect(chamfered[1].y).toBe(0);
    expect(chamfered[2].x).toBe(2);
    expect(chamfered[2].y).toBeGreaterThan(0);
  });

  it('routes waterfall wire between source and target with plug stubs and chamfers', () => {
    const src = { x: 0, y: 0 };
    const dst = { x: 4, y: 2 };
    const path = routeWaterfallWire(src, dst, {
      sourceSide: 'output',
      targetSide: 'input',
      laneIndex: 0,
    });
    expect(path.length).toBeGreaterThanOrEqual(4);
    expect(path[0]).toEqual(src);
    expect(path[path.length - 1]).toEqual(dst);
  });
});
