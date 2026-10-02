// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { CadBlockDefinition, Point } from '../../core/types';
import type { Doc } from '../Doc';

/**
 * Creates a CadBlockDefinition from selected edges in the document.
 */
export function createBlockFromSelection(
  doc: Doc,
  name: string,
  edgeIds: Iterable<number>,
  basePoint?: Point,
): CadBlockDefinition | null {
  const ids = Array.from(edgeIds);
  if (ids.length === 0) return null;

  let bp = basePoint;
  if (!bp) {
    const box = doc.boundsOf(ids);
    if (!box) return null;
    bp = { x: (box.x1 + box.x2) / 2, y: (box.y1 + box.y2) / 2 };
  }

  const def: CadBlockDefinition = {
    name: name.trim().toUpperCase().replace(/\s+/g, '_') || `BLOCK_${Date.now()}`,
    basePoint: { x: 0, y: 0 },
    lines: [],
    arcs: [],
    circles: [],
    texts: [],
    fills: [],
  };

  const processedGroups = new Set<number>();

  for (const id of ids) {
    const edge = doc.edge(id);
    if (!edge) continue;

    // Lossless circle preservation if group is an intact circle
    if (edge.groupId && doc.groupIntact.has(edge.groupId) && !processedGroups.has(edge.groupId)) {
      const prim = doc.groupPrimitives.get(edge.groupId);
      if (prim && prim.type === 'circle') {
        def.circles.push({
          cx: prim.cx - bp.x,
          cy: prim.cy - bp.y,
          r: prim.r,
          layerId: edge.layerId,
        });
        processedGroups.add(edge.groupId);
        continue;
      }
    }

    if (processedGroups.has(edge.groupId)) continue;

    const [v1, v2] = doc.endpointsOf(edge);
    if (edge.type === 'line') {
      def.lines.push({
        x1: v1.x - bp.x,
        y1: v1.y - bp.y,
        x2: v2.x - bp.x,
        y2: v2.y - bp.y,
        layerId: edge.layerId,
      });
    } else if (edge.type === 'arc') {
      const a1 = ((Math.atan2(v1.y - edge.cy, v1.x - edge.cx) * 180) / Math.PI + 360) % 360;
      const a2 = ((Math.atan2(v2.y - edge.cy, v2.x - edge.cx) * 180) / Math.PI + 360) % 360;
      def.arcs.push({
        cx: edge.cx - bp.x,
        cy: edge.cy - bp.y,
        r: edge.r,
        a1,
        a2,
        layerId: edge.layerId,
      });
    }
  }

  doc.blocks.set(def.name, def);
  return def;
}

/**
 * Explodes a CadBlockInstance into native editable lines, arcs, circles, texts, and fills.
 */
export function explodeBlockInstance(doc: Doc, instanceId: number): boolean {
  const inst = doc.blockInstances.get(instanceId);
  if (!inst) return false;

  const def = doc.blocks.get(inst.blockName);
  if (!def) return false;

  const rad = ((inst.rotation ?? 0) * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const s = inst.scale ?? 1;

  const transformPoint = (p: Point): Point => ({
    x: inst.x + s * (p.x * cos - p.y * sin),
    y: inst.y + s * (p.x * sin + p.y * cos),
  });

  const layer = inst.layerId || '0';

  // Explode lines
  for (const l of def.lines) {
    const p1 = transformPoint({ x: l.x1, y: l.y1 });
    const p2 = transformPoint({ x: l.x2, y: l.y2 });
    doc.addLine(p1, p2, undefined, l.layerId || layer);
  }

  // Explode circles
  for (const c of def.circles) {
    const cp = transformPoint({ x: c.cx, y: c.cy });
    const r = c.r * s;
    const vRight = doc.addVertex(cp.x + r, cp.y);
    const vLeft = doc.addVertex(cp.x - r, cp.y);
    const gid = doc.newGroupId();
    doc.addArcEdge(vRight, vLeft, cp.x, cp.y, r, gid, c.layerId || layer);
    doc.addArcEdge(vLeft, vRight, cp.x, cp.y, r, gid, c.layerId || layer);
    doc.groupPrimitives.set(gid, { type: 'circle', cx: cp.x, cy: cp.y, r });
    doc.groupIntact.add(gid);
  }

  // Explode arcs
  for (const a of def.arcs) {
    const cp = transformPoint({ x: a.cx, y: a.cy });
    const r = a.r * s;
    const rot = (inst.rotation ?? 0);
    const a1Rad = (((a.a1 + rot) % 360) * Math.PI) / 180;
    const a2Rad = (((a.a2 + rot) % 360) * Math.PI) / 180;
    const p1 = { x: cp.x + r * Math.cos(a1Rad), y: cp.y + r * Math.sin(a1Rad) };
    const p2 = { x: cp.x + r * Math.cos(a2Rad), y: cp.y + r * Math.sin(a2Rad) };
    doc.addArc(cp.x, cp.y, r, p1, p2, undefined, a.layerId || layer);
  }

  // Explode texts
  if (def.texts) {
    for (const t of def.texts) {
      const tp = transformPoint({ x: t.x, y: t.y });
      doc.addText(t.text, tp.x, tp.y, t.height * s, (t.rotation ?? 0) + (inst.rotation ?? 0), t.layerId || layer);
    }
  }

  // Explode fills
  if (def.fills) {
    for (const f of def.fills) {
      const pts = f.points.map(transformPoint);
      doc.addFill(pts, 'solid', f.layerId || layer, f.color, f.opacity);
    }
  }

  doc.blockInstances.delete(instanceId);
  return true;
}
