// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '../EditorStore';

export function cancelBasePointPick(store: EditorStore): void {
  if (!store.pickingBasePoint) return;
  store.pickingBasePoint = false;
  store.setCursor(store.tool.cursor);
  store.showHint('Copy from reference point cancelled.', 2000);
  store.requestDraw();

}
