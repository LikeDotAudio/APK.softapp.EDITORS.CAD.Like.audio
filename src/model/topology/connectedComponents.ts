// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Doc } from '../Doc';

/** One connected piece of the geometry graph. */
export interface Component {
  verts: number[];
  edgeIds: number[];
}

/** Connected components of the geometry graph (edge-bearing ones only). */
export function connectedComponents(doc: Doc): Component[] {
  // Build adjacency list: vertex -> [{ edgeId, other }]
  const adj = new Map<number, { edgeId: number; other: number }[]>();
  for (const e of doc.edges.values()) {
    let a1 = adj.get(e.v1);
    if (!a1) { a1 = []; adj.set(e.v1, a1); }
    a1.push({ edgeId: e.id, other: e.v2 });

    let a2 = adj.get(e.v2);
    if (!a2) { a2 = []; adj.set(e.v2, a2); }
    a2.push({ edgeId: e.id, other: e.v1 });
  }

  const assigned = new Set<number>();
  const out: Component[] = [];

  for (const vStart of adj.keys()) {
    if (assigned.has(vStart)) continue;
    const compV = new Set<number>();
    const compE = new Set<number>();
    const stack = [vStart];
    while (stack.length > 0) {
      const v = stack.pop()!;
      if (compV.has(v)) continue;
      compV.add(v);
      assigned.add(v);
      const neighbors = adj.get(v);
      if (neighbors) {
        for (const n of neighbors) {
          compE.add(n.edgeId);
          if (!compV.has(n.other)) stack.push(n.other);
        }
      }
    }
    if (compE.size > 0) out.push({ verts: Array.from(compV), edgeIds: Array.from(compE) });
  }
  return out;
}
