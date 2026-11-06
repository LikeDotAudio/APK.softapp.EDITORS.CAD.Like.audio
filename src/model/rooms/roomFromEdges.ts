// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Edge, Point, Vertex } from '../../core/types';

/**
 * A ROOM FROM THE EDGES THAT CLOSE IT (ROAD-3581, Declare Room)
 *
 * The user selects the edges round a room and declares it: they must make one
 * closed loop — every corner meets exactly two of them, and they are all one
 * ring. The room is that ring's corners, counter-clockwise, in drawing units
 * (an arc by its chord, as wallFaces takes it); the edges are kept so the
 * walls among them bound the IfcSpace.
 */
export type RoomLoop = { ok: true; points: Point[]; edgeIds: number[]; layerId: string } | { ok: false; why: string };

export function roomFromEdges(vertexOf: (id: number) => Vertex | undefined, edges: readonly Edge[]): RoomLoop {
  if (edges.length < 3) return { ok: false, why: 'Select the edges that close the room: three or more, one loop.' };
  const at = new Map<number, Edge[]>();
  for (const e of edges) {
    if (e.v1 === e.v2) return { ok: false, why: 'A full circle is not a room outline: break it, or draw the room with lines.' };
    for (const v of [e.v1, e.v2]) (at.get(v) ?? at.set(v, []).get(v)!).push(e);
  }
  for (const list of at.values()) {
    if (list.length !== 2) return { ok: false, why: 'The selection is not one closed loop: every corner must meet exactly two of the selected edges.' };
  }
  const ring: number[] = [];
  const used = new Set<number>();
  const start = edges[0]!;
  let v = start.v1;
  let e: Edge | undefined = start;
  while (e && !used.has(e.id)) {
    used.add(e.id);
    ring.push(v);
    v = e.v1 === v ? e.v2 : e.v1;
    e = at.get(v)!.find((x) => !used.has(x.id));
  }
  if (used.size !== edges.length) return { ok: false, why: 'The selection is more than one loop: declare one room at a time.' };
  const points: Point[] = [];
  for (const id of ring) {
    const p = vertexOf(id);
    if (!p) return { ok: false, why: 'The selection points at a corner that is gone.' };
    points.push({ x: p.x, y: p.y });
  }
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const p = points[i]!, q = points[(i + 1) % points.length]!;
    area += p.x * q.y - q.x * p.y;
  }
  if (Math.abs(area) < 1e-12) return { ok: false, why: 'The loop encloses no floor.' };
  if (area < 0) points.reverse();
  const layers = new Map<string, number>();
  for (const x of edges) layers.set(x.layerId, (layers.get(x.layerId) ?? 0) + 1);
  const layerId = [...layers].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))[0]![0];
  return { ok: true, points, edgeIds: edges.map((x) => x.id).sort((a, b) => a - b), layerId };
}
