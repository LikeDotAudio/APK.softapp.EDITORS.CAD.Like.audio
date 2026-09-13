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
  const assigned = new Set<number>();
  const out: Component[] = [];
  for (const vStart of doc.vertices.keys()) {
    if (assigned.has(vStart)) continue;
    const compV = new Set<number>();
    const compE = new Set<number>();
    const queue = [vStart];
    while (queue.length) {
      const v = queue.shift()!;
      if (compV.has(v)) continue;
      compV.add(v);
      assigned.add(v);
      for (const e of doc.edges.values()) {
        if (e.v1 === v || e.v2 === v) {
          compE.add(e.id);
          const other = e.v1 === v ? e.v2 : e.v1;
          if (!compV.has(other)) queue.push(other);
        }
      }
    }
    if (compE.size > 0) out.push({ verts: Array.from(compV), edgeIds: Array.from(compE) });
  }
  return out;
}
