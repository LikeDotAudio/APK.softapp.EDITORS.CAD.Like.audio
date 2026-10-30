// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { describe, expect, it } from 'vitest';
import type { Layer } from '../../core/types';
import { BASE_STROKE_PX, layerStroke } from './layerStroke';

const layer = (extra: Partial<Layer>): Layer => ({ id: 'L', name: 'L', color: '#fff', visible: true, ...extra });

describe('layerStroke', () => {
  it('draws a CONTINUOUS, unweighted layer as the plain solid line', () => {
    expect(layerStroke(layer({}), 'mm', 1)).toEqual({ width: BASE_STROKE_PX, dash: [] });
    expect(layerStroke(layer({ linetype: 'CONTINUOUS' }), 'mm', 1).dash).toEqual([]);
  });

  it('dashes a DASHED layer at its drawing-unit pattern times the zoom', () => {
    // acadiso DASHED is 12.7 mm dash, 6.35 mm gap
    const { dash } = layerStroke(layer({ linetype: 'DASHED' }), 'mm', 2);
    expect(dash[0]).toBeCloseTo(25.4);
    expect(dash[1]).toBeCloseTo(12.7);
  });

  it('uses a layer-carried pattern for a linetype it does not know by name', () => {
    expect(layerStroke(layer({ linetype: 'FENCE', linetypePattern: [4, -2] }), 'mm', 1).dash).toEqual([4, 2]);
  });

  it('thickens a 0.50 mm layer to twice the default', () => {
    expect(layerStroke(layer({ lineweight: 50 }), 'mm', 1).width).toBeCloseTo(BASE_STROKE_PX * 2);
    expect(layerStroke(layer({ lineweight: 18 }), 'mm', 1).width).toBe(BASE_STROKE_PX);
  });

  it('draws solid when the pattern is too fine to see at this zoom', () => {
    expect(layerStroke(layer({ linetype: 'DASHED' }), 'mm', 0.01).dash).toEqual([]);
  });
});
