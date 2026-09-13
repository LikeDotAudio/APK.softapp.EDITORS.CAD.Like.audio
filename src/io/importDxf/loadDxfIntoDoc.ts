// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Doc } from '../../model/Doc';
import type { DxfParseResult } from './DxfParseResult';

/**
 * Loads parsed DXF entities into the Doc instance.
 */
export function loadDxfIntoDoc(doc: Doc, parseResult: DxfParseResult): void {
  for (const entity of parseResult.entities) {
    const groupId = doc.newGroupId();
    const layerId = entity.layer || '0';

    if (entity.type === 'LINE') {
      if (
        entity.x1 !== undefined &&
        entity.y1 !== undefined &&
        entity.x2 !== undefined &&
        entity.y2 !== undefined
      ) {
        const v1 = doc.addVertex(entity.x1, entity.y1);
        const v2 = doc.addVertex(entity.x2, entity.y2);
        doc.addLineEdge(v1, v2, groupId, layerId);
      }
    } else if (entity.type === 'CIRCLE') {
      if (entity.cx !== undefined && entity.cy !== undefined && entity.r !== undefined) {
        const vRight = doc.addVertex(entity.cx + entity.r, entity.cy);
        const vLeft = doc.addVertex(entity.cx - entity.r, entity.cy);
        doc.addArcEdge(vRight, vLeft, entity.cx, entity.cy, entity.r, groupId, layerId);
        doc.addArcEdge(vLeft, vRight, entity.cx, entity.cy, entity.r, groupId, layerId);
        doc.groupPrimitives.set(groupId, { type: 'circle', cx: entity.cx, cy: entity.cy, r: entity.r });
        doc.groupIntact.add(groupId);
      }
    } else if (entity.type === 'ARC') {
      if (
        entity.cx !== undefined &&
        entity.cy !== undefined &&
        entity.r !== undefined &&
        entity.startAngle !== undefined &&
        entity.endAngle !== undefined
      ) {
        const a1Rad = (entity.startAngle * Math.PI) / 180;
        const a2Rad = (entity.endAngle * Math.PI) / 180;

        const x1 = entity.cx + entity.r * Math.cos(a1Rad);
        const y1 = entity.cy + entity.r * Math.sin(a1Rad);
        const x2 = entity.cx + entity.r * Math.cos(a2Rad);
        const y2 = entity.cy + entity.r * Math.sin(a2Rad);

        const v1 = doc.addVertex(x1, y1);
        const v2 = doc.addVertex(x2, y2);
        doc.addArcEdge(v1, v2, entity.cx, entity.cy, entity.r, groupId, layerId);
      }
    } else if (entity.type === 'LWPOLYLINE' && entity.points && entity.points.length > 1) {
      const pts = entity.points;
      const count = pts.length;
      const segmentCount = entity.isClosed ? count : count - 1;

      for (let i = 0; i < segmentCount; i++) {
        const p1 = pts[i];
        const p2 = pts[(i + 1) % count];

        const v1 = doc.addVertex(p1.x, p1.y);
        const v2 = doc.addVertex(p2.x, p2.y);

        if (p1.bulge && Math.abs(p1.bulge) > 1e-6) {
          const theta = 4 * Math.atan(p1.bulge);
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const d = Math.hypot(dx, dy);
          const r = Math.abs(d / (2 * Math.sin(theta / 2)));

          const s = (p1.bulge * d) / 2;
          const mx = (p1.x + p2.x) / 2;
          const my = (p1.y + p2.y) / 2;

          const nx = -dy / d;
          const ny = dx / d;

          const h = r - Math.abs(s);
          const signH = theta > 0 ? 1 : -1;
          const cx = mx + nx * h * signH;
          const cy = my + ny * h * signH;

          if (p1.bulge > 0) {
            doc.addArcEdge(v1, v2, cx, cy, r, groupId, layerId);
          } else {
            doc.addArcEdge(v2, v1, cx, cy, r, groupId, layerId);
          }
        } else {
          doc.addLineEdge(v1, v2, groupId, layerId);
        }
      }
    }
  }
}
