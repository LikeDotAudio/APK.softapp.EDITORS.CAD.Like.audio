// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '../EditorStore';

export function cancelDyn(store: EditorStore): void {
  store.tool.onEscape?.(store.toolState, store.api);
  store.closeDynInput();
  store.requestDraw();
  store.emit();

}
