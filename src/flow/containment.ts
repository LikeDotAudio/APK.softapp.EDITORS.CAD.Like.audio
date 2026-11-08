// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.

import { nudgeOnGrid } from './onGrid';
import type { Group, SchematicModel } from '../core/types';
import { groupBounds, rootGroups } from './groups';

export interface ContainmentOptions {
  minPadding?: number;
  bufferBetweenGroups?: number;
}

export const DEFAULT_CONTAINMENT_BUFFER = 0.5;

/**
 * 📦 CONTAINMENT & NO-OVERLAP ENGINE (ported from OneThing SCHEMATIC.placement-auto/7_DrawGroupBoundaries)
 *
 * Ensures all hierarchical groups snugly fit their child members, and pushes
 * overlapping sibling groups apart so boxes never collide.
 */
export function separateOverlappingGroups(
  model: SchematicModel,
  options: ContainmentOptions = {},
): boolean {
  const buffer = options.bufferBetweenGroups ?? DEFAULT_CONTAINMENT_BUFFER;
  const roots = rootGroups(model);
  if (roots.length < 2) return false;

  let shiftedAny = false;

  // Pairwise AABB overlap test on root groups
  for (let i = 0; i < roots.length; i++) {
    for (let j = i + 1; j < roots.length; j++) {
      const gA = roots[i];
      const gB = roots[j];

      const boxA = groupBounds(model, gA.id);
      const boxB = groupBounds(model, gB.id);

      if (!boxA || !boxB) continue;

      // Check overlap with buffer
      const overlapX = Math.min(boxA.x2, boxB.x2) - Math.max(boxA.x1, boxB.x1) + buffer;
      const overlapY = Math.min(boxA.y2, boxB.y2) - Math.max(boxA.y1, boxB.y1) + buffer;

      if (overlapX > 0 && overlapY > 0) {
        // Overlap detected: push apart along the axis of minimum penetration
        if (overlapX <= overlapY) {
          const shift = overlapX / 2;
          const sign = boxA.x1 < boxB.x1 ? -1 : 1;
          shiftGroupPlacements(model, gA, sign * shift, 0);
          shiftGroupPlacements(model, gB, -sign * shift, 0);
        } else {
          const shift = overlapY / 2;
          const sign = boxA.y1 < boxB.y1 ? -1 : 1;
          shiftGroupPlacements(model, gA, 0, sign * shift);
          shiftGroupPlacements(model, gB, 0, -sign * shift);
        }
        shiftedAny = true;
      }
    }
  }

  return shiftedAny;
}

/**
 * Moves all placements contained in a group (and its child groups) by (dx, dy).
 */
export function shiftGroupPlacements(
  model: SchematicModel,
  group: Group,
  dx: number,
  dy: number,
): void {
  for (const pId of group.members) {
    const p = model.placements.find((item) => item.id === pId);
    if (p) nudgeOnGrid(p, dx, dy);   // in grid steps (onGrid.ts)
  }

  for (const childId of group.children) {
    const childGroup = model.groups.find((g) => g.id === childId);
    if (childGroup) {
      shiftGroupPlacements(model, childGroup, dx, dy);
    }
  }
}
