// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { SchematicModel } from '../core/types';

/**
 * WHICH OF A HOST'S BLOCKS ARE PICKED (the owner, 2026-11-06: "I cannot touch
 * the blocks"). A click on a host's BIM block went out as `pick` and nothing
 * on the sheet answered it. Select now picks the block here too: it is drawn
 * picked (drawSchematic) and named back to the host on `selection` (`host`).
 *
 * Kept beside the model, not in it: the placements are the host's and are
 * replaced on every `schematic` it sends, and a pick is not part of a saved
 * session. Ids that no longer name a placement are dropped when read.
 */
const picked = new WeakMap<SchematicModel, Set<number>>();

/** The placement ids picked on this model (live; prune with `hostPicked`). */
export function hostSelection(model: SchematicModel): Set<number> {
  let set = picked.get(model);
  if (!set) {
    set = new Set();
    picked.set(model, set);
  }
  return set;
}

/** The picked placements that still exist — the stale ids dropped. */
export function hostPicked(model: SchematicModel): number[] {
  const set = hostSelection(model);
  const live = new Set(model.placements.map((p) => p.id));
  for (const id of [...set]) if (!live.has(id)) set.delete(id);
  return [...set].sort((a, b) => a - b);
}

/** Pick exactly these (or, with `toggle`, flip these in and out of what is picked). True when it changed. */
export function pickHost(model: SchematicModel, ids: readonly number[], toggle = false): boolean {
  const set = hostSelection(model);
  const before = [...set].sort((a, b) => a - b).join();
  if (!toggle) set.clear();
  for (const id of ids) {
    if (toggle && set.has(id)) set.delete(id);
    else set.add(id);
  }
  return [...set].sort((a, b) => a - b).join() !== before;
}
