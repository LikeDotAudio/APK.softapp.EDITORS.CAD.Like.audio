// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '../EditorStore';

export function copySelection(store: EditorStore): void {
  if (store.selection.size === 0) return;
  const b = store.doc.boundsOf(store.selection);
  if (!b) return;
  const count = store.captureClipboard((b.x1 + b.x2) / 2, (b.y1 + b.y2) / 2);
  store.showHint(`Copied ${count} element(s) to clipboard.`, 3000);

}
