// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '../EditorStore';

/** Enter in the dyn box: finish the shape at the typed size. */
export function commitDyn(store: EditorStore): void {
  const dyn = store.tool.dyn;
  if (!dyn || !store.dynAnchor) return;
  const point = store.resolveDyn();
  // Nothing usable typed — let a click place the shape instead.
  if (!point) return;
  dyn.commit(store.toolState, point, store.api);
  store.requestDraw();
  store.emit();

}
