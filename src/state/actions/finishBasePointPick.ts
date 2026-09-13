// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '../EditorStore';

export function finishBasePointPick(store: EditorStore): void {
  const origin = store.pointer.world;
  store.pickingBasePoint = false;
  store.setCursor(store.tool.cursor);
  const count = store.captureClipboard(origin.x, origin.y);
  store.showHint(
    count > 0
      ? `Copied ${count} element(s) from the reference point — Ctrl+V drops that point at the cursor.`
      : 'Nothing copied.',
    4000,
  );
  store.requestDraw();
  store.emit();

}
