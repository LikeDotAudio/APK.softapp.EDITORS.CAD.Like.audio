// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '../EditorStore';
import { findSnap } from '../../viewport/snap/findSnap';

export function pasteClipboard(store: EditorStore): void {
  if (store.clipboard.length === 0) return;
  store.history.push(store.doc.snapshot());

  // Snap the drop point so a reference-point copy can land exactly on existing geometry.
  const center = store.tool.snaps
    ? store.pointer.world
    : findSnap(store.doc, store.view, store.pointer.rawWorld.x, store.pointer.rawWorld.y, {
        gridSize: store.gridSize,
        snapToGrid: store.snapToGrid,
      });
  const groupId = store.doc.newGroupId();
  const newEdgeIds: number[] = [];

  for (const item of store.clipboard) {
    const p1x = center.x + item.p1.x;
    const p1y = center.y + item.p1.y;
    const p2x = center.x + item.p2.x;
    const p2y = center.y + item.p2.y;

    const v1 = store.doc.addVertex(p1x, p1y);
    const v2 = store.doc.addVertex(p2x, p2y);

    let edgeId: number | null = null;
    if (item.type === 'line') {
      edgeId = store.doc.addLineEdge(v1, v2, groupId, item.layerId || store.activeLayerId);
    } else if (item.type === 'arc' && item.cx !== undefined && item.cy !== undefined && item.r !== undefined) {
      const cx = center.x + item.cx;
      const cy = center.y + item.cy;
      edgeId = store.doc.addArcEdge(v1, v2, cx, cy, item.r, groupId, item.layerId || store.activeLayerId);
    }
    if (edgeId !== null) newEdgeIds.push(edgeId);
  }

  store.selection.clear();
  for (const id of newEdgeIds) {
    store.selection.add(id);
  }

  store.markDocChanged();
  store.requestDraw();
  store.emit();
  store.showHint(`Pasted ${newEdgeIds.length} element(s).`, 3000);

}
