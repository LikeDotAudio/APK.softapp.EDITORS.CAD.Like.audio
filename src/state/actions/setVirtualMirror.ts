// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '../EditorStore';

export function setVirtualMirror(
  store: EditorStore,
  x: number,
  enabled = true,
  selected = true,
): void {
  store.mirror.x = x;
  store.mirror.enabled = enabled;
  store.mirror.selected = selected;
  store.requestDraw();
  store.emit();
  store.showHint(
    `Virtual Mirror placed at X = ${x.toFixed(2)}. CAD edge glowing · Symmetrical Mode active.`,
    3500,
  );
}
