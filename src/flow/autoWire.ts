// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.

import type { BBox, Point, PortSide } from '../core/types';

export interface WireRoutingOptions {
  sourceSide?: PortSide;
  targetSide?: PortSide;
  laneIndex?: number;
  lanePitch?: number;
  plugStub?: number;
  keepouts?: BBox[];
}

export const DEFAULT_PLUG_STUB = 0.25;
export const DEFAULT_LANE_PITCH = 0.15;
export const DEFAULT_BASE_CHAMFER = 0.12;
export const DEFAULT_CHAMFER_STEP = 0.03;

/**
 * 📐 CHAMFER & FILLET ENGINE (ported from OneThing SCHEMATIC.Wire-Auto/8_Chamfer)
 * Transforms sharp 90-degree Manhattan turns into 45-degree directional vector legs.
 * Progressive lane nesting air-gaps parallel multi-wire buses.
 */
export function applyChamfers(
  path: Point[],
  laneIndex = 0,
  baseChamfer = DEFAULT_BASE_CHAMFER,
  step = DEFAULT_CHAMFER_STEP,
): Point[] {
  if (path.length < 3) return path;

  const requestedSize = baseChamfer + laneIndex * step;
  const LEG_FRACTION = 0.4;
  const result: Point[] = [path[0]];

  for (let i = 1; i < path.length - 1; i++) {
    const prev = path[i - 1];
    const corner = path[i];
    const next = path[i + 1];

    const dInX = corner.x - prev.x;
    const dInY = corner.y - prev.y;
    const dOutX = next.x - corner.x;
    const dOutY = next.y - corner.y;

    const inLen = Math.hypot(dInX, dInY);
    const outLen = Math.hypot(dOutX, dOutY);

    // Skip collinear points or zero-length segments
    const isCollinear =
      (Math.abs(dInX) < 1e-4 && Math.abs(dOutX) < 1e-4) ||
      (Math.abs(dInY) < 1e-4 && Math.abs(dOutY) < 1e-4);

    if (inLen < 1e-4 || outLen < 1e-4 || isCollinear) {
      result.push(corner);
      continue;
    }

    // Must be orthogonal / Manhattan corner (either inX==0 & outY==0 or inY==0 & outX==0)
    const isOrthogonal =
      (Math.abs(dInX) < 1e-4 && Math.abs(dOutY) < 1e-4) ||
      (Math.abs(dInY) < 1e-4 && Math.abs(dOutX) < 1e-4);

    if (!isOrthogonal) {
      result.push(corner);
      continue;
    }

    const maxChamfer = Math.min(inLen * LEG_FRACTION, outLen * LEG_FRACTION);
    const size = Math.min(requestedSize, maxChamfer);

    if (size < 0.02) {
      result.push(corner);
      continue;
    }

    // Point entering chamfer from incoming leg
    const uInX = dInX / inLen;
    const uInY = dInY / inLen;
    const pEnter: Point = {
      x: corner.x - uInX * size,
      y: corner.y - uInY * size,
    };

    // Point exiting chamfer onto outgoing leg
    const uOutX = dOutX / outLen;
    const uOutY = dOutY / outLen;
    const pExit: Point = {
      x: corner.x + uOutX * size,
      y: corner.y + uOutY * size,
    };

    result.push(pEnter, pExit);
  }

  result.push(path[path.length - 1]);
  return result;
}

/**
 * Normal vector direction for a port side.
 */
function sideNormal(side?: PortSide): Point {
  switch (side) {
    case 'output':
      return { x: 1, y: 0 };
    case 'input':
      return { x: -1, y: 0 };
    case 'control':
      return { x: 0, y: -1 };
    case 'power':
      return { x: 0, y: 1 };
    default:
      return { x: 1, y: 0 };
  }
}

/**
 * Checks if a point lies inside a keepout bounding box (with optional padding).
 */
export function inKeepout(p: Point, box: BBox, pad = 0.05): boolean {
  return (
    p.x >= box.x1 - pad &&
    p.x <= box.x2 + pad &&
    p.y >= box.y1 - pad &&
    p.y <= box.y2 + pad
  );
}

/**
 * 🌊 DYNAMIC WATERFALL ROUTING ENGINE (ported from OneThing SCHEMATIC.Wire-Auto/5_Waterfall)
 *
 * Computes an engineered Manhattan signal path between two terminals.
 * Enforces:
 *   1. Plug stub clearance
 *   2. Waterfall lane stepping
 *   3. 45-degree corner chamfering
 */
export function routeWaterfallWire(
  source: Point,
  target: Point,
  options: WireRoutingOptions = {},
): Point[] {
  const {
    sourceSide = 'output',
    targetSide = 'input',
    laneIndex = 0,
    lanePitch = DEFAULT_LANE_PITCH,
    plugStub = DEFAULT_PLUG_STUB,
  } = options;

  const sNorm = sideNormal(sourceSide);
  const tNorm = sideNormal(targetSide);

  const stubOffset = plugStub + laneIndex * lanePitch;

  // Stubs extending perpendicular from port faces
  const pStubSource: Point = {
    x: source.x + sNorm.x * stubOffset,
    y: source.y + sNorm.y * stubOffset,
  };
  const pStubTarget: Point = {
    x: target.x + tNorm.x * stubOffset,
    y: target.y + tNorm.y * stubOffset,
  };

  const rawPath: Point[] = [source, pStubSource];

  // Standard left-to-right flow: source exiting right, target entering left
  if (sNorm.x > 0 && tNorm.x < 0) {
    if (pStubSource.x < pStubTarget.x) {
      // Clean forward waterfall
      const midX = pStubSource.x;
      rawPath.push({ x: midX, y: pStubTarget.y });
    } else {
      // Target is behind or level with source - detour around
      const detourY =
        source.y < target.y
          ? Math.min(pStubSource.y, pStubTarget.y) - (0.5 + laneIndex * lanePitch)
          : Math.max(pStubSource.y, pStubTarget.y) + (0.5 + laneIndex * lanePitch);
      rawPath.push({ x: pStubSource.x, y: detourY });
      rawPath.push({ x: pStubTarget.x, y: detourY });
    }
  } else if (sNorm.x < 0 && tNorm.x > 0) {
    // Reverse right-to-left flow
    const midX = pStubSource.x;
    rawPath.push({ x: midX, y: pStubTarget.y });
  } else {
    // Mixed sides (e.g. top/bottom or perpendicular ports)
    if (Math.abs(sNorm.x) > 0) {
      rawPath.push({ x: pStubTarget.x, y: pStubSource.y });
    } else {
      rawPath.push({ x: pStubSource.x, y: pStubTarget.y });
    }
  }

  rawPath.push(pStubTarget, target);

  // Eliminate redundant identical points
  const deduped: Point[] = [];
  for (const pt of rawPath) {
    if (
      deduped.length === 0 ||
      Math.hypot(pt.x - deduped[deduped.length - 1].x, pt.y - deduped[deduped.length - 1].y) > 1e-4
    ) {
      deduped.push(pt);
    }
  }

  // Apply 45-degree chamfers
  return applyChamfers(deduped, laneIndex);
}
