// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '../EditorStore';

export function setSelectionProtected(store: EditorStore, isProtected: boolean): void {
  if (store.selection.size === 0) return;
  for (const id of store.selection) {
    const e = store.doc.edges.get(id);
    if (e) e.protected = isProtected;
    const t = store.doc.texts.get(id);
    if (t) t.protected = isProtected;
    const f = store.doc.fills.get(id);
    if (f) f.protected = isProtected;
    const b = store.doc.blockInstances.get(id);
    if (b) b.protected = isProtected;
  }
  store.requestDraw();
  store.emit();

}
