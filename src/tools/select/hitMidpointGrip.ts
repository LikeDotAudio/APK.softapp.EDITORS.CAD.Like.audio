// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Point } from '../../core/types';
import { HANDLE_HIT_PX } from '../../render/selectionBox/handleSizes';
import type { ToolApi } from '../types';

/**
 * Edge id under a midpoint grip of the selection, or null. Dragging a midpoint
 * moves that one edge, the way a midpoint grip behaves in AutoCAD.
 */
export function hitMidpointGrip(api: ToolApi, screen: Point, hitPx = HANDLE_HIT_PX): number | null {
  for (const id of api.selection) {
    const e = api.doc.edge(id);
    if (!e) continue;
    const mid = api.doc.edgeMidpoint(e);
    const s = api.view.toScreen(mid.x, mid.y);
    if (Math.abs(s.x - screen.x) <= hitPx && Math.abs(s.y - screen.y) <= hitPx) return e.id;
  }
  return null;
}
