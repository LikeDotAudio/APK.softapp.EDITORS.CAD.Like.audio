// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { ClipboardItem } from '../ClipboardItem';
import type { EditorStore } from '../EditorStore';

/** Store the selection in the clipboard, relative to the given world origin. */
export function captureClipboard(store: EditorStore, cx: number, cy: number): number {
  const items: ClipboardItem[] = [];

  for (const id of store.selection) {
    const e = store.doc.edge(id);
    if (e) {
      const [a, b] = store.doc.endpointsOf(e);
      const item: ClipboardItem = {
        type: e.type,
        p1: { x: a.x - cx, y: a.y - cy },
        p2: { x: b.x - cx, y: b.y - cy },
        layerId: e.layerId,
      };
      if (e.type === 'arc') {
        item.cx = e.cx - cx;
        item.cy = e.cy - cy;
        item.r = e.r;
      }
      items.push(item);
      continue;
    }

    const t = store.doc.texts.get(id);
    if (t) {
      items.push({
        type: 'text',
        p1: { x: t.x - cx, y: t.y - cy },
        text: t.text,
        height: t.height,
        rotation: t.rotation,
        color: t.color,
        align: t.align,
        vAlign: t.vAlign,
        layerId: t.layerId,
      });
      continue;
    }

    const bi = store.doc.blockInstances.get(id);
    if (bi) {
      items.push({
        type: 'block',
        p1: { x: bi.x - cx, y: bi.y - cy },
        blockName: bi.blockName,
        scale: bi.scale,
        rotation: bi.rotation,
        attributes: bi.attributes ? { ...bi.attributes } : undefined,
        layerId: bi.layerId,
      });
      continue;
    }
  }

  store.clipboard = items;
  return items.length;

}
