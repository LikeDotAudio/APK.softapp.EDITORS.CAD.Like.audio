// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '../EditorStore';

export function selectVirtualMirror(store: EditorStore, selected: boolean): void {
  if (store.mirror.selected === selected) return;
  store.mirror.selected = selected;
  store.requestDraw();
  store.emit();
}
