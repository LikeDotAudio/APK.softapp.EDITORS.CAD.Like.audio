// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Point } from '../../core/types';
import { HANDLE_HIT_PX } from '../../render/selectionBox/handleSizes';
import type { ToolApi } from '../types';

/**
 * Vertex id under an endpoint grip of the selection, or null.
 *
 * Vertices shared with an arc are skipped: an arc stores a centre and radius,
 * so moving one end alone would leave the endpoint off its own circle.
 */
export function hitEndpointGrip(api: ToolApi, screen: Point, hitPx = HANDLE_HIT_PX): number | null {
  for (const id of api.selection) {
    const e = api.doc.edge(id);
    if (!e || e.type !== 'line') continue;

    for (const v of api.doc.endpointsOf(e)) {
      const s = api.view.toScreen(v.x, v.y);
      if (Math.abs(s.x - screen.x) > hitPx || Math.abs(s.y - screen.y) > hitPx) continue;
      if (vertexTouchesArc(api, v.id)) continue;
      return v.id;
    }
  }
  return null;
}

function vertexTouchesArc(api: ToolApi, vId: number): boolean {
  for (const e of api.doc.edges.values()) {
    if (e.type === 'arc' && (e.v1 === vId || e.v2 === vId)) return true;
  }
  return false;
}
