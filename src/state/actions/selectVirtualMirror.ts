// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '../EditorStore';

export function selectVirtualMirror(store: EditorStore, selected: boolean): void {
  store.mirror.selected = selected;
  if (store.mirror.mirrors) {
    for (const m of store.mirror.mirrors) {
      m.selected = selected;
    }
  }
  store.requestDraw();
  store.emit();
}
