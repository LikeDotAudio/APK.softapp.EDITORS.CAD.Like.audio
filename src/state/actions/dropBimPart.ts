// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { partToDefinition, type BimPart } from '../../flow/bimPart';
import type { BimOccurrence, BimRef } from '../../core/types';
import { placeBlock } from '../../flow/Schematic';
import type { BlockPlacement, Point } from '../../core/types';
import type { EditorStore } from '../EditorStore';

/**
 * A PART DRAGGED IN FROM THE BIM LIBRARY (the owner, 2026-11-06: "drag = place").
 *
 * Every row of the BIM library app (DATABASE.server.BIM library.html, contract
 * library@1 `drag`) is a drag source of `application/x-apk-bim` { bim, ref }:
 * the part as the CAD draws it and its BIM reference. Dropped on this canvas it
 * is placed where it was let go, as the user's own block — the same block the
 * 🏗 BIM button's pick arms the Flow tool with (partToDefinition).
 */
export const BIM_DRAG_MIME = 'application/x-apk-bim';

/** The part a drop carries, or null: { bim } with an id — with the drop's BIM reference on it as `ref`. */
export function bimPartOfDrop(text: string | undefined | null): BimPart | null {
  if (!text) return null;
  try {
    const v = JSON.parse(text) as { bim?: BimPart; ref?: Partial<BimRef> } | null;
    if (!(v && v.bim && typeof v.bim.id === 'string' && v.bim.id)) return null;
    return v.ref && v.ref.part ? { ...v.bim, ref: v.ref } : v.bim;
  } catch {
    return null;
  }
}

/**
 * The BIM occurrence a drop carries (ROAD-3577): a row of the 📦 Project palette is
 * { bim, ref, occurrence: {project, instance, globalId} } — an instance, not just its part.
 */
export function occurrenceOfDrop(text: string | undefined | null): BimOccurrence | null {
  if (!text) return null;
  try {
    const o = (JSON.parse(text) as { occurrence?: Partial<BimOccurrence> } | null)?.occurrence;
    return o && o.project && o.instance && o.globalId
      ? { project: String(o.project), instance: String(o.instance), globalId: String(o.globalId) } : null;
  } catch {
    return null;
  }
}

/**
 * Place `part` at `at` (drawing units) on the current layer; the placement, or null. With an
 * `occurrence` the placement IS that BIM instance (on `occurrence.sheet`), and one already on
 * this drawing is refused — the palette frees it only when it is removed.
 */
export function placeBimPart(
  store: Pick<EditorStore, 'schematic' | 'activeLayerId' | 'editFlow' | 'showHint'>,
  part: BimPart,
  at: Point,
  occurrence?: BimOccurrence | null,
): BlockPlacement | null {
  if (occurrence) {
    const there = store.schematic.placements.find((p) => p.occurrence?.globalId === occurrence.globalId);
    if (there) {
      store.showHint(`${there.refdes ?? occurrence.instance} is already on this drawing.`, 3000);
      return null;
    }
  }
  const def = partToDefinition(part);
  const known = store.schematic.definitions.find((d) => d.id === def.id);
  if (!known) store.schematic.definitions.push(def);
  else if (!known.bimRef && def.bimRef) known.bimRef = def.bimRef;   // a block from before ROAD-3572 learns its reference
  let placed: BlockPlacement | null = null;
  store.editFlow(() => {
    placed = placeBlock(store.schematic, def.id, at, store.activeLayerId);
    if (placed && occurrence) placed.occurrence = { ...occurrence };
    return !!placed;
  });
  if (placed) store.showHint(`Placed ${part.name || part.model || part.id} — its BIM block.`, 3000);
  return placed;
}
