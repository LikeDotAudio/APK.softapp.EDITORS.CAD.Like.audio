// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { BBox, Group, Point, SchematicModel } from '../core/types';
import { outlineCorners } from './placement';
import { definitionFor } from './Schematic';

/**
 * The group algebra: everything that makes, breaks, nests and measures a
 * container. Plain functions over `SchematicModel`, the same shape as
 * `Schematic.ts`, because the model is data and the answers it can give are
 * functions over it.
 *
 * EVERY MUTATION HERE LEAVES THE TWO INVARIANTS FROM `core/types.ts` TRUE:
 * one owner per placement, one parent per group, and no cycles. They are
 * maintained by DETACHING first and attaching second, in that order, in every
 * function below - a membership added before the old one is removed is the
 * version of this that draws a block inside two boxes.
 *
 * `groupBounds` is the only expensive call, and it is deliberately not cached:
 * a group's box is derived from live placement positions, so a cache here
 * would have to be invalidated by the drag handler, and a stale box is the
 * exact failure this whole design exists to prevent.
 */

/** Clearance between a group's contents and its drawn box, in drawing units. */
export const GROUP_PAD = 0.45;
/** How much further out each level of nesting is drawn. */
export const GROUP_NEST_STEP = 0.35;

export function groupOf(model: SchematicModel, placementId: number): Group | undefined {
  return model.groups.find((g) => g.members.includes(placementId));
}

export function parentOf(model: SchematicModel, groupId: number): Group | undefined {
  return model.groups.find((g) => g.children.includes(groupId));
}

export function groupById(model: SchematicModel, groupId: number): Group | undefined {
  return model.groups.find((g) => g.id === groupId);
}

/** The groups nobody owns - the top of the tree, and where drawing starts. */
export function rootGroups(model: SchematicModel): Group[] {
  const owned = new Set<number>();
  for (const group of model.groups) for (const child of group.children) owned.add(child);
  return model.groups.filter((g) => !owned.has(g.id));
}

/** How deep a group sits. A root is 0. Bounded by the no-cycles invariant. */
export function depthOf(model: SchematicModel, groupId: number): number {
  let depth = 0;
  let parent = parentOf(model, groupId);
  while (parent && depth < model.groups.length) {
    depth += 1;
    parent = parentOf(model, parent.id);
  }
  return depth;
}

/** `groupId` and every group under it, itself first. */
export function descendants(model: SchematicModel, groupId: number): Group[] {
  const out: Group[] = [];
  const seen = new Set<number>();
  const walk = (id: number) => {
    if (seen.has(id)) return;
    seen.add(id);
    const group = groupById(model, id);
    if (!group) return;
    out.push(group);
    for (const child of group.children) walk(child);
  };
  walk(groupId);
  return out;
}

/** Every placement a group holds, its children's included. */
export function membersDeep(model: SchematicModel, groupId: number): number[] {
  const out: number[] = [];
  for (const group of descendants(model, groupId)) out.push(...group.members);
  return out;
}

/**
 * The rectangle a group is drawn as: its contents' extent, padded once for the
 * group and once more for every level it holds, so a parent never hugs a
 * child's line. Null when a group holds nothing that is still on the sheet -
 * an empty group is a name with no box, which is what `ungroup` is for.
 */
export function groupBounds(model: SchematicModel, groupId: number): BBox | null {
  const ids = membersDeep(model, groupId);
  let x1 = Infinity;
  let y1 = Infinity;
  let x2 = -Infinity;
  let y2 = -Infinity;

  for (const id of ids) {
    const placement = model.placements.find((p) => p.id === id);
    if (!placement) continue;
    const def = definitionFor(model, placement);
    if (!def) continue;
    for (const corner of outlineCorners(def, placement)) {
      x1 = Math.min(x1, corner.x);
      y1 = Math.min(y1, corner.y);
      x2 = Math.max(x2, corner.x);
      y2 = Math.max(y2, corner.y);
    }
  }
  if (!Number.isFinite(x1)) return null;

  /* Padded by how tall this group is, not by how deep it sits: a parent has to
     clear the box its deepest child is already drawing. */
  const pad = (model.groups.find((g) => g.id === groupId)?.pad ?? GROUP_PAD)
    + GROUP_NEST_STEP * heightOf(model, groupId);
  return { x1: x1 - pad, y1: y1 - pad, x2: x2 + pad, y2: y2 + pad };
}

/** Levels of group BELOW this one. A group of blocks alone is 0. */
export function heightOf(model: SchematicModel, groupId: number): number {
  const group = groupById(model, groupId);
  if (!group || group.children.length === 0) return 0;
  let tallest = 0;
  for (const child of group.children) tallest = Math.max(tallest, heightOf(model, child) + 1);
  return tallest;
}

export function boundsContain(outer: BBox, inner: BBox): boolean {
  return (
    outer.x1 <= inner.x1 && outer.y1 <= inner.y1 && outer.x2 >= inner.x2 && outer.y2 >= inner.y2
  );
}

export function boundsHold(box: BBox, point: Point): boolean {
  return point.x >= box.x1 && point.x <= box.x2 && point.y >= box.y1 && point.y <= box.y2;
}

// ------------------------------------------------------------------ mutation

/** Take a placement out of whatever group holds it. Safe when none does. */
export function detachPlacement(model: SchematicModel, placementId: number): boolean {
  let moved = false;
  for (const group of model.groups) {
    const at = group.members.indexOf(placementId);
    if (at === -1) continue;
    group.members.splice(at, 1);
    moved = true;
  }
  return moved;
}

/** Take a group out of whatever group holds it. Safe when none does. */
export function detachGroup(model: SchematicModel, groupId: number): boolean {
  let moved = false;
  for (const group of model.groups) {
    const at = group.children.indexOf(groupId);
    if (at === -1) continue;
    group.children.splice(at, 1);
    moved = true;
  }
  return moved;
}

/** True when `maybeChild` is `groupId` or sits somewhere under it. */
export function isDescendant(model: SchematicModel, groupId: number, maybeChild: number): boolean {
  return descendants(model, groupId).some((g) => g.id === maybeChild);
}

/**
 * Put `childId` inside `parentId`. Refuses the two shapes that would break the
 * tree: a group into itself, and a group into one of its own descendants.
 */
export function nestGroup(model: SchematicModel, childId: number, parentId: number): boolean {
  if (childId === parentId) return false;
  const parent = groupById(model, parentId);
  const child = groupById(model, childId);
  if (!parent || !child) return false;
  if (isDescendant(model, childId, parentId)) return false;
  detachGroup(model, childId);
  parent.children.push(childId);
  return true;
}

/**
 * Make a group of what is handed to it. THIS IS THE WHOLE TOOL.
 *
 * Placements are taken from whatever held them; groups are re-parented. A
 * group whose members are all being taken is nested WHOLE rather than emptied
 * — that is the difference between drawing a box around two racks and
 * dissolving both racks into one bag of boxes, and the second one is never
 * what somebody drawing a box around two racks meant.
 */
export function makeGroup(
  model: SchematicModel,
  placementIds: number[],
  groupIds: number[],
  name: string,
  layerId = '0',
): Group | null {
  /* Anything already inside one of the groups being taken comes along with it
     rather than being pulled out and listed twice. */
  const swallowed = new Set<number>();
  for (const id of groupIds) for (const g of descendants(model, id)) swallowed.add(g.id);

  const nesting = groupIds.filter((id) => !isSwallowedByAnother(model, id, groupIds));
  const members = placementIds.filter((id) => {
    const holder = groupOf(model, id);
    return !holder || !swallowed.has(holder.id);
  });

  if (members.length === 0 && nesting.length === 0) return null;

  const group: Group = {
    id: model.nextGroupId++,
    name: name.trim() || `GROUP${model.groups.length + 1}`,
    children: [],
    members: [],
    layerId,
  };
  model.groups.push(group);

  for (const id of members) {
    detachPlacement(model, id);
    group.members.push(id);
  }
  for (const id of nesting) nestGroup(model, id, group.id);
  return group;
}

/** True when another id in the same batch already contains this one. */
function isSwallowedByAnother(model: SchematicModel, id: number, batch: number[]): boolean {
  return batch.some((other) => other !== id && isDescendant(model, other, id));
}

/**
 * Dissolve one group. Its contents go to its parent rather than to the sheet
 * when it had one — ungrouping a rack inside a room leaves the boxes in the
 * room, which is what the eye expects and what the alternative silently loses.
 */
export function ungroup(model: SchematicModel, groupId: number): boolean {
  const group = groupById(model, groupId);
  if (!group) return false;
  const parent = parentOf(model, groupId);

  detachGroup(model, groupId);
  model.groups = model.groups.filter((g) => g.id !== groupId);

  if (parent) {
    parent.members.push(...group.members);
    parent.children.push(...group.children);
  }
  return true;
}

export function renameGroup(model: SchematicModel, groupId: number, name: string): boolean {
  const group = groupById(model, groupId);
  if (!group) return false;
  const next = name.trim();
  if (!next || next === group.name) return false;
  group.name = next;
  return true;
}

export function toggleCollapsed(model: SchematicModel, groupId: number): boolean {
  const group = groupById(model, groupId);
  if (!group) return false;
  group.collapsed = !group.collapsed;
  return true;
}

/**
 * The innermost group whose drawn box holds a point, or null. Innermost so a
 * click inside a rack inside a room picks the rack: the deeper box is the one
 * the reader is pointing at, and the shallower one is always reachable by
 * clicking the space between them.
 */
export function hitGroupAt(model: SchematicModel, world: Point): Group | null {
  let best: Group | null = null;
  let bestDepth = -1;
  for (const group of model.groups) {
    const box = groupBounds(model, group.id);
    if (!box || !boundsHold(box, world)) continue;
    const depth = depthOf(model, group.id);
    if (depth > bestDepth) {
      bestDepth = depth;
      best = group;
    }
  }
  return best;
}

/** Drop a placement from every group. Called when the placement itself goes. */
export function forgetPlacement(model: SchematicModel, placementId: number): void {
  detachPlacement(model, placementId);
}
