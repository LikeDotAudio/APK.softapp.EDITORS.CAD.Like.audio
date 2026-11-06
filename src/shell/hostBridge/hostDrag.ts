// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Point, SchematicModel } from '../../core/types';
import { groupById, hitGroupAt, membersDeep } from '../../flow/groups';
import { hitPlacementAt, hitPortAt, placementOf } from '../../flow/Schematic';

/**
 * A HOST'S BLOCKS UNDER THE SELECT TOOL (ROAD-3529)
 *
 * A host's `schematic` places BIM blocks (hostSchematic.ts). Select is the
 * tool a host hands the user (`tool` { id: 'select' }), and it worked on the
 * geometry only — the vertex graph and block instances — so a host's block
 * could be seen but not moved. These are the two things Select now does with
 * them: press on a host placement and drag it, or press inside a host group
 * (not on a block) and drag everything in it. The move is the host's to keep:
 * `geometry.hostPlacements` reports every seat on the next frame and the host
 * adopts it, so nothing here goes on the undo stack.
 */

/** The host placements a press at `world` takes: the block under it, else everything in the host group under it. */
export function hostDragAt(model: SchematicModel, world: Point): number[] {
  const hit = hitPlacementAt(model, world);
  if (hit) return hit.hostKey ? [hit.id] : [];
  const group = hitGroupAt(model, world);
  if (!group || !group.hostKey) return [];
  return membersDeep(model, group.id).filter((id) => placementOf(model, id)?.hostKey);
}

/** Moves those placements by (dx, dy); true when any moved. */
export function dragHostPlacements(model: SchematicModel, ids: readonly number[], dx: number, dy: number): boolean {
  if (dx === 0 && dy === 0) return false;
  let moved = false;
  for (const id of ids) {
    const p = placementOf(model, id);
    if (!p || !p.hostKey) continue;
    p.at = { x: p.at.x + dx, y: p.at.y + dy };
    moved = true;
  }
  return moved;
}

/**
 * What a click on the sheet landed on among a host's blocks, for `pick`'s
 * `host` field: { key, ref, terminal? } — the host's own name for the block and,
 * on a port, that port's caption (the terminal the host sent) — or { key, group }
 * inside one of its groups. `tol` is in drawing units.
 */
export interface HostPickHit { key: string; ref?: string; terminal?: string; group?: string }

export function hostPickAt(model: SchematicModel, world: Point, tol: number): HostPickHit | null {
  const port = hitPortAt(model, world, tol);
  const at = port ? placementOf(model, port.placementId) : hitPlacementAt(model, world);
  if (at?.hostKey && at.hostRef) {
    const def = model.definitions.find((d) => d.id === at.definitionId);
    const label = port ? def?.ports.find((p) => p.id === port.portId)?.label : undefined;
    return { key: at.hostKey, ref: at.hostRef, ...(label ? { terminal: label } : {}) };
  }
  const group = hitGroupAt(model, world);
  const id = group?.hostKey ? groupById(model, group.id)?.source?.id : undefined;
  return id && group?.hostKey ? { key: group.hostKey, group: id } : null;
}
