// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '../EditorStore';

export function rotateSelectionPrompt(store: EditorStore): void {
  if (store.selection.size === 0) {
    store.showHint('Select elements to rotate first.', 3000);
    return;
  }
  const degStr = window.prompt('Enter rotation angle in degrees (e.g. 45 or -90):', '45');
  if (!degStr) return;
  const deg = parseFloat(degStr);
  if (isNaN(deg)) return;

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const id of store.selection) {
    const e = store.doc.edge(id);
    if (!e) continue;
    const [a, b] = store.doc.endpointsOf(e);
    minX = Math.min(minX, a.x, b.x);
    minY = Math.min(minY, a.y, b.y);
    maxX = Math.max(maxX, a.x, b.x);
    maxY = Math.max(maxY, a.y, b.y);
  }
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const rad = (deg * Math.PI) / 180;

  store.history.push(store.doc.snapshot());
  store.doc.rotateEdges(store.selection, cx, cy, rad);
  store.markDocChanged();
  store.requestDraw();
  store.emit();
  store.showHint(`Rotated ${store.selection.size} element(s) by ${deg}°.`, 3000);

}
