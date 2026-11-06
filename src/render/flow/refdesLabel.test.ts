// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { describe, expect, it } from 'vitest';
import { REFDES, refdesLabel } from './refdesLabel';

/** A monospace stand-in: each character is 0.6 of the font size. */
const measure = (t: string, px: number) => t.length * px * 0.6;
const name = 'U92 · Chromecast-52d674149f6a88568c6f6a48f042a';

describe('a host block name sized by its block (ROAD-3563)', () => {
  it('a block a few pixels wide (the whole bench at fit) draws no name at all', () => {
    expect(refdesLabel(name, 8, measure)).toBeNull();
    expect(refdesLabel(name, REFDES.minPx / REFDES.ofWidth - 1, measure)).toBeNull();
  });

  it('a mid-size block draws its name small and clipped to the block', () => {
    const l = refdesLabel(name, 60, measure)!;
    expect(l.px).toBeCloseTo(7.2);
    expect(l.text.endsWith('…')).toBe(true);
    expect(measure(l.text, l.px)).toBeLessThanOrEqual(60 * REFDES.room);
  });

  it('zoomed in, the whole name at the usual marker size', () => {
    expect(refdesLabel(name, 400, measure)).toEqual({ text: name, px: REFDES.maxPx });
  });
});
