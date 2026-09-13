// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '../EditorStore';

export function setSelectionProtected(store: EditorStore, isProtected: boolean): void {
  if (store.selection.size === 0) return;
  for (const edgeId of store.selection) {
    const e = store.doc.edges.get(edgeId);
    if (e) e.protected = isProtected;
  }
  store.requestDraw();
  store.emit();

}
