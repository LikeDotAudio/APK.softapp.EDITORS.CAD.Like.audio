// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
/**
 * THE PUCK — a 3Dconnexion SpaceMouse, read by the OS shell off the bus and
 * posted into the focused window as
 *   { apkos: 'puck', action: 'move', pan: { dx, dy }, zoom, orbit, unit, consumers, host }
 * about 60 times a second while it is deflected. `pan` is CSS px in VIEW terms
 * (+dx: the view moves right, the drawing slides left; +dy: the view moves up,
 * the drawing slides down); `zoom` multiplies (>1 in). The sheet is 2D, so
 * `orbit` is ignored. `consumers.cad === false` is the bench switching us off;
 * on the Big Picture door (#/big-picture, the desktop's 🔌 Schematics) the
 * switch is `consumers.schematic` instead (ROAD-3624), the SpaceMouse window's
 * "Schematic canvas" — so the two can be flown or left alone apart.
 */
import type { Viewport } from '../Viewport';

export interface PuckMove {
  dx: number;
  dy: number;
  zoom: number;
}

const num = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

/** The pan/zoom of one `move` frame, or null for anything else (malformed, a status, switched off). */
export type PuckConsumer = 'cad' | 'schematic';

export function puckMoveOf(data: unknown, consumer: PuckConsumer = 'cad'): PuckMove | null {
  if (!data || typeof data !== 'object') return null;
  const m = data as Record<string, unknown>;
  if (m.apkos !== 'puck' || m.action !== 'move') return null;
  const consumers = m.consumers as Record<string, unknown> | undefined;
  if (consumers && typeof consumers === 'object' && consumers[consumer] === false) return null;
  const pan = (m.pan && typeof m.pan === 'object' ? m.pan : {}) as Record<string, unknown>;
  const dx = num(pan.dx) ? pan.dx : 0;
  const dy = num(pan.dy) ? pan.dy : 0;
  const zoom = num(m.zoom) && m.zoom > 0 ? m.zoom : 1;
  if (!dx && !dy && zoom === 1) return null;
  return { dx, dy, zoom };
}

/** Frames that arrived before the next paint, folded into one: pans add, zooms multiply. */
export function foldPuck(a: PuckMove | null, b: PuckMove): PuckMove {
  return a ? { dx: a.dx + b.dx, dy: a.dy + b.dy, zoom: a.zoom * b.zoom } : { ...b };
}

/** Apply a frame: zoom about the canvas centre (zoomAt clamps it), then pan. */
export function applyPuck(view: Viewport, move: PuckMove): void {
  if (move.zoom !== 1) view.zoomAt(view.width / 2, view.height / 2, move.zoom);
  // screen-px pan: the view moving right/up slides the drawing left/down
  view.panX -= move.dx;
  view.panY += move.dy;
}
