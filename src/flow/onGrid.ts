// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { BlockPlacement, Point } from '../core/types';
import { placementPoint, placementVector } from './placement';
import { portLocalPoint, sideNormal } from './portLocalPoint';
import type { BlockDefinition, Port } from '../core/types';

/**
 * NOTHING MOVES OFF THE GRID (the owner, 2026-11-07: "the ends of the wires should ALWAYS be on
 * the grid … so connector… then wire length… then grid intersection"; "nothing is allowed to
 * move off the grid").
 *
 * The schematic grid is SCHEMATIC_GRID drawing units (10 mm on a sheet in mm). A placement's
 * centre is always on it (snapAt — placing, a host's seat, a drag, a layout); a BIM block is
 * sized in whole double steps so its edges and every port land on it (bimPart BLOCK); and a
 * port's wire leaves the block through its plug and lug and ends PORT_REACH out, on the next
 * grid intersection — where the wires of the sheet start and end (cables.wirePath).
 */
export const SCHEMATIC_GRID = 10;
/** Port → plug (20) → lug (3) → wire → the grid intersection 30 out. */
export const PORT_REACH = 30;

export const snap = (v: number, g = SCHEMATIC_GRID): number => Math.round(v / g) * g;
export const snapUp = (v: number, g = SCHEMATIC_GRID): number => Math.ceil(v / g - 1e-9) * g;
export const snapAt = (p: Point): Point => ({ x: snap(p.x), y: snap(p.y) });

/* A drag moves by small steps: the raw position is kept aside, the stored one is its snap. */
const raw = new WeakMap<BlockPlacement, Point>();

/** Move `p` by (dx, dy) and keep it on the grid; the fractions carry over to the next step. */
export function nudgeOnGrid(p: BlockPlacement, dx: number, dy: number): void {
  const r = raw.get(p) ?? { ...p.at };
  const next = { x: r.x + dx, y: r.y + dy };
  raw.set(p, next);
  p.at = snapAt(next);
}

/** Where a port's wire ends: PORT_REACH out from the port along its side, on the grid. */
export function wireEndPoint(placement: BlockPlacement, def: BlockDefinition, port: Port): Point {
  const at = placementPoint(placement, portLocalPoint(def, port));
  const n = placementVector(placement, sideNormal(port.side));
  return { x: at.x + n.x * PORT_REACH * (placement.scale ?? 1), y: at.y + n.y * PORT_REACH * (placement.scale ?? 1) };
}
