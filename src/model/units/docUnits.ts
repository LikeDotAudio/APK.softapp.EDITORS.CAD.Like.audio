// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Units } from '../../core/types';
import { MM_PER_UNIT } from './mmPerUnit';

/**
 * THE DRAWING IS IN MILLIMETRES (cad-1, ROAD-3581)
 *
 * Every coordinate the editor keeps — the Doc's vertices, arcs, texts, fills
 * and block instances, the Flow schematic, declared rooms, the Virtual Mirror,
 * the tracing image, the grid, the view's zoom (px per mm) — is in mm, always.
 * `store.units` is how lengths are SHOWN and TYPED, nothing else: switching it
 * moves no point. Conversion happens only where a person reads or types a
 * number (toDisplay / fromDisplay), and in the DXF writer, which states its
 * own $INSUNITS.
 */
export const DOC_UNITS: Units = 'mm';

/**
 * The SavedSession version whose docSnapshot (and schematic, rooms, mirror,
 * tracing, grid) is in mm whatever its `units` say. Version 1 sessions keep
 * their geometry in `units` and are migrated when they are opened
 * (sessionInMm).
 */
export const SESSION_MM_VERSION = 2;

/** A length in mm, as the person reads it in `units`. */
export function toDisplay(mm: number, units: Units): number {
  return mm / (MM_PER_UNIT[units] ?? 1);
}

/** A length the person typed in `units`, in mm. */
export function fromDisplay(v: number, units: Units): number {
  return v * (MM_PER_UNIT[units] ?? 1);
}
