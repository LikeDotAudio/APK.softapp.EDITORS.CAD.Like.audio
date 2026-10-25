// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { describe, expect, it } from 'vitest';
import { parseHostSpaces } from './hostSpaces';

describe('a host names its drawings as model spaces', () => {
  it('keeps good rows, drops bad and repeated ones', () => {
    const s = parseHostSpaces({
      items: [
        { id: 'host:plan', name: 'Plan', subtitle: '5000 × 7000 mm', bounds: [0, 0, 5, 7] },
        { id: 'host:plan', name: 'again', bounds: [0, 0, 1, 1] },
        { id: 'host:flat', name: 'Flat', bounds: [0, 0, 5, 0] },
        { id: 'host:nan', name: 'NaN', bounds: [0, 0, NaN, 1] },
        { name: 'no id', bounds: [0, 0, 1, 1] },
        { id: 'host:cut', name: 'Cut-aways', bounds: [-3, 8, 9, 14] },
      ],
    });
    expect(s).toEqual([
      { id: 'host:plan', name: 'Plan', subtitle: '5000 × 7000 mm', bounds: { x1: 0, y1: 0, x2: 5, y2: 7 } },
      { id: 'host:cut', name: 'Cut-aways', bounds: { x1: -3, y1: 8, x2: 9, y2: 14 } },
    ]);
    expect(parseHostSpaces({ items: 'no' })).toEqual([]);
  });
});
