// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { describe, it, expect } from 'vitest';
import { Viewport } from '../Viewport';
import { MAX_ZOOM } from '../../core/constants';
import { applyPuck, foldPuck, puckMoveOf } from './puckFrame';

const frame = (o: Record<string, unknown>) => ({ apkos: 'puck', action: 'move', pan: { dx: 0, dy: 0 }, zoom: 1, ...o });
const view = () => {
  const v = new Viewport();
  v.resize(800, 600); // pan (400, 300): world origin at the centre
  return v;
};

describe('puck frames', () => {
  it('reads only well-formed move frames', () => {
    expect(puckMoveOf(null)).toBeNull();
    expect(puckMoveOf('puck')).toBeNull();
    expect(puckMoveOf({ apkos: 'puck', action: 'status', state: 'online' })).toBeNull();
    expect(puckMoveOf(frame({ pan: { dx: 3, dy: 0 }, consumers: { cad: false } }))).toBeNull();
    expect(puckMoveOf(frame({}))).toBeNull(); // nothing to do
    expect(puckMoveOf(frame({ pan: { dx: '5', dy: NaN }, zoom: -2 }))).toBeNull();
    expect(puckMoveOf(frame({ pan: { dx: 2, dy: -1 }, zoom: 1.1, consumers: { cad: true } }))).toEqual({ dx: 2, dy: -1, zoom: 1.1 });
  });

  it('folds frames: pans add, zooms multiply', () => {
    const f = foldPuck(foldPuck(null, { dx: 1, dy: 2, zoom: 2 }), { dx: 3, dy: -1, zoom: 1.5 });
    expect(f).toEqual({ dx: 4, dy: 1, zoom: 3 });
  });

  it('+dx moves the view right (the drawing slides left), +dy moves it up (the drawing slides down)', () => {
    const v = view();
    const before = v.toScreen(0, 0);
    applyPuck(v, { dx: 10, dy: 5, zoom: 1 });
    const after = v.toScreen(0, 0);
    expect(after.x - before.x).toBe(-10);
    expect(after.y - before.y).toBe(5);
    // the world point now at the centre lies right of and above the old one (world Y up)
    const c = v.toWorld(400, 300);
    expect(c.x).toBeGreaterThan(0);
    expect(c.y).toBeGreaterThan(0);
  });

  it('zooms about the canvas centre, inside the clamps', () => {
    const v = view();
    applyPuck(v, { dx: 10, dy: 0, zoom: 1 });
    const centre = v.toWorld(400, 300);
    const z = v.zoom;
    applyPuck(v, { dx: 0, dy: 0, zoom: 1.25 });
    expect(v.zoom).toBeCloseTo(z * 1.25);
    const still = v.toWorld(400, 300);
    expect(still.x).toBeCloseTo(centre.x);
    expect(still.y).toBeCloseTo(centre.y);
    applyPuck(v, { dx: 0, dy: 0, zoom: 1e12 });
    expect(v.zoom).toBe(MAX_ZOOM);
  });
});
