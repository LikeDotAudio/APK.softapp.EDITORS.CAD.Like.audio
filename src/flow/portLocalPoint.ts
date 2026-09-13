// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { BlockDefinition, Point, Port, PortSide } from '../core/types';

/**
 * Ports on one side of a definition, in declaration order.
 *
 * The order matters because it is what an omitted `offset` is spread against:
 * two outputs declared `OUT_A` then `OUT_B` sit at a third and two thirds down
 * the right edge, and stay there when a third is added between them.
 */
export function portsOnSide(def: BlockDefinition, side: PortSide): Port[] {
  return def.ports.filter((p) => p.side === side);
}

/**
 * Where along its side a port sits, 0..1. A declared `offset` wins; otherwise
 * the ports on that side are spread evenly, which is the only sensible answer
 * for the common symbol with one port per side.
 */
export function portOffset(def: BlockDefinition, port: Port): number {
  if (typeof port.offset === 'number') return Math.min(1, Math.max(0, port.offset));
  const siblings = portsOnSide(def, port.side);
  const index = siblings.indexOf(port);
  if (index < 0) return 0.5;
  return (index + 1) / (siblings.length + 1);
}

/**
 * The port's position in BLOCK-LOCAL coordinates, derived from its side.
 *
 * This function is the whole of PLAN-49.01's third design call. Nothing stores
 * a port coordinate, so nothing can disagree with the side; rotate a block and
 * the geometry turns while `input` stays `input`, because the side was never a
 * position in the first place.
 *
 * World Y points up here, as it does everywhere else in this app, so `control`
 * is +y and `power` is -y.
 */
export function portLocalPoint(def: BlockDefinition, port: Port): Point {
  const hw = def.size.w / 2;
  const hh = def.size.h / 2;
  const t = portOffset(def, port);
  switch (port.side) {
    case 'input':
      return { x: -hw, y: hh - t * def.size.h };
    case 'output':
      return { x: hw, y: hh - t * def.size.h };
    case 'control':
      return { x: -hw + t * def.size.w, y: hh };
    case 'power':
      return { x: -hw + t * def.size.w, y: -hh };
  }
}

/**
 * The outward unit normal of a side on an UNROTATED block. `placementVector`
 * turns it by the placement's rotation; the side itself never changes.
 */
export function sideNormal(side: PortSide): Point {
  switch (side) {
    case 'input':
      return { x: -1, y: 0 };
    case 'output':
      return { x: 1, y: 0 };
    case 'control':
      return { x: 0, y: 1 };
    case 'power':
      return { x: 0, y: -1 };
  }
}
