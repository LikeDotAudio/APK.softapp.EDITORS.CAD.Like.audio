// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '../EditorStore';
import type { Units } from '../../core/types';

/**
 * Show and type lengths in `units`. The drawing is in mm whatever this says
 * (cad-1, docUnits.ts): no point moves, the view stays where it is, and the
 * undo history is untouched — only the numbers a person reads change. The
 * choice is saved with the session (markDocChanged autosaves it).
 */
export function setUnits(store: EditorStore, units: Units): void {
  if (units === store.units) return;
  store.units = units;
  store.markDocChanged();
  store.requestDraw();
  store.emit();
}
