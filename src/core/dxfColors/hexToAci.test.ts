// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { describe, expect, it } from 'vitest';
import { hexToAci } from './hexToAci';

describe('hexToAci', () => {
  it('answers a palette swatch with its own index', () => {
    expect(hexToAci('#3b82f6')).toBe(5);
    expect(hexToAci('#1E293B')).toBe(7);
  });
  it('lands anything else on the nearest ACI colour', () => {
    expect(hexToAci('#fe0101')).toBe(1);
    expect(hexToAci('#0f0')).toBe(3);
  });
  it('answers 7 for a colour it cannot read', () => {
    expect(hexToAci('hsl(10, 80%, 45%)')).toBe(7);
  });
});
