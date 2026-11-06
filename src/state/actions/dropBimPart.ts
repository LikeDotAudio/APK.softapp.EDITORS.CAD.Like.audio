// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { partToDefinition, type BimPart } from '../../flow/bimPart';
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

/** The part a drop carries, or null: { bim } with an id. */
export function bimPartOfDrop(text: string | undefined | null): BimPart | null {
  if (!text) return null;
  try {
    const v = JSON.parse(text) as { bim?: BimPart } | null;
    return v && v.bim && typeof v.bim.id === 'string' && v.bim.id ? v.bim : null;
  } catch {
    return null;
  }
}

/** Place `part` at `at` (drawing units) on the current layer; the placement, or null. */
export function placeBimPart(
  store: Pick<EditorStore, 'schematic' | 'activeLayerId' | 'editFlow' | 'showHint'>,
  part: BimPart,
  at: Point,
): BlockPlacement | null {
  const def = partToDefinition(part);
  if (!store.schematic.definitions.some((d) => d.id === def.id)) store.schematic.definitions.push(def);
  let placed: BlockPlacement | null = null;
  store.editFlow(() => {
    placed = placeBlock(store.schematic, def.id, at, store.activeLayerId);
    return !!placed;
  });
  if (placed) store.showHint(`Placed ${part.name || part.model || part.id} — its BIM block.`, 3000);
  return placed;
}
