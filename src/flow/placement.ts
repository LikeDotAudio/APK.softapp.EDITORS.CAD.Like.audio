// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { BlockDefinition, BlockPlacement, Point } from '../core/types';

/**
 * Block-local -> sheet. Rotation is degrees counter-clockwise about the
 * placement's origin, applied before the uniform scale and the translation.
 *
 * The rotation turns the GEOMETRY and nothing else. A block rotated 90 degrees
 * has its `input` ports pointing up the sheet and they are still `input` ports
 * - which is the behaviour a model that stored a coordinate and inferred the
 * side back out of it cannot have.
 */
export function placementPoint(placement: BlockPlacement, local: Point): Point {
  const rad = ((placement.rotation ?? 0) * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const s = placement.scale ?? 1;
  return {
    x: placement.at.x + s * (local.x * cos - local.y * sin),
    y: placement.at.y + s * (local.x * sin + local.y * cos),
  };
}

/** The same transform for a direction: rotated and scaled, never translated. */
export function placementVector(placement: BlockPlacement, local: Point): Point {
  const rad = ((placement.rotation ?? 0) * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return {
    x: local.x * cos - local.y * sin,
    y: local.x * sin + local.y * cos,
  };
}

/** The outline's four corners on the sheet, clockwise from the bottom left. */
export function outlineCorners(def: BlockDefinition, placement: BlockPlacement): Point[] {
  const hw = def.size.w / 2;
  const hh = def.size.h / 2;
  return [
    { x: -hw, y: -hh },
    { x: -hw, y: hh },
    { x: hw, y: hh },
    { x: hw, y: -hh },
  ].map((p) => placementPoint(placement, p));
}
