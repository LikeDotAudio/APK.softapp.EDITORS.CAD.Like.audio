// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '../EditorStore';

export function selectAll(store: EditorStore): void {
  store.selection.clear();
  for (const id of store.doc.edges.keys()) store.selection.add(id);
  store.requestDraw();
  store.emit();

}
