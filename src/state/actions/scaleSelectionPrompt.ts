// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '../EditorStore';

export function scaleSelectionPrompt(store: EditorStore): void {
  if (store.selection.size === 0) {
    store.showHint('Select elements to scale first.', 3000);
    return;
  }
  const scaleStr = window.prompt('Enter scale factor (e.g. 2.0 to double, 0.5 to halve):', '2.0');
  if (!scaleStr) return;
  const factor = parseFloat(scaleStr);
  if (isNaN(factor) || factor <= 0) return;

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

  store.history.push(store.doc.snapshot());
  store.doc.scaleEdges(store.selection, cx, cy, factor);
  store.markDocChanged();
  store.requestDraw();
  store.emit();
  store.showHint(`Scaled ${store.selection.size} element(s) by ${factor}x.`, 3000);

}
