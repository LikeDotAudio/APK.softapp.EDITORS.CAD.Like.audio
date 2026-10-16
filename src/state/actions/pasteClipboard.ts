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
  const newElementIds: number[] = [];

  for (const item of store.clipboard) {
    if (item.type === 'line' && item.p2) {
      const p1x = center.x + item.p1.x;
      const p1y = center.y + item.p1.y;
      const p2x = center.x + item.p2.x;
      const p2y = center.y + item.p2.y;

      const v1 = store.doc.addVertex(p1x, p1y);
      const v2 = store.doc.addVertex(p2x, p2y);
      const edgeId = store.doc.addLineEdge(v1, v2, groupId, item.layerId || store.activeLayerId);
      if (edgeId !== null) newElementIds.push(edgeId);
    } else if (item.type === 'arc' && item.p2 && item.cx !== undefined && item.cy !== undefined && item.r !== undefined) {
      const p1x = center.x + item.p1.x;
      const p1y = center.y + item.p1.y;
      const p2x = center.x + item.p2.x;
      const p2y = center.y + item.p2.y;
      const cx = center.x + item.cx;
      const cy = center.y + item.cy;

      const v1 = store.doc.addVertex(p1x, p1y);
      const v2 = store.doc.addVertex(p2x, p2y);
      const edgeId = store.doc.addArcEdge(v1, v2, cx, cy, item.r, groupId, item.layerId || store.activeLayerId);
      if (edgeId !== null) newElementIds.push(edgeId);
    } else if (item.type === 'text' && item.text !== undefined) {
      const tx = center.x + item.p1.x;
      const ty = center.y + item.p1.y;
      const textId = store.doc.addText(
        item.text,
        tx,
        ty,
        item.height ?? 0.5,
        item.rotation ?? 0,
        item.layerId || store.activeLayerId,
        item.color,
        item.align,
        item.vAlign,
      );
      newElementIds.push(textId);
    } else if (item.type === 'block' && item.blockName) {
      const bx = center.x + item.p1.x;
      const by = center.y + item.p1.y;
      const blockId = store.doc.addBlockInstance(
        item.blockName,
        bx,
        by,
        item.scale ?? 1,
        item.rotation ?? 0,
        item.layerId || store.activeLayerId,
        undefined,
        item.attributes,
      );
      newElementIds.push(blockId);
    }
  }

  store.selection.clear();
  for (const id of newElementIds) {
    store.selection.add(id);
  }

  store.markDocChanged();
  store.requestDraw();
  store.emit();
  store.showHint(`Pasted ${newElementIds.length} element(s).`, 3000);

}
