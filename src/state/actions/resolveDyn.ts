// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '../EditorStore';
import type { Point } from '../../core/types';

/** The end point implied by whatever is typed, or null when nothing usable is. */
export function resolveDyn(store: EditorStore): Point | null {
  const dyn = store.tool.dyn;
  if (!dyn || !store.dynAnchor) return null;
  return dyn.resolve(store.toolState, store.dynNumbers(), store.dynMode, store.dynCursor);

}
