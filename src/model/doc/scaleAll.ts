// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Doc } from '../Doc';

/** Multiply every coordinate by `f` (unit switches and scale calibration). */
export function scaleAll(doc: Doc, f: number): void {
  for (const v of doc.vertices.values()) {
    v.x *= f;
    v.y *= f;
  }
  for (const e of doc.edges.values()) {
    if (e.type === 'arc') {
      e.cx *= f;
      e.cy *= f;
      e.r *= f;
    }
  }
  for (const p of doc.groupPrimitives.values()) {
    p.cx *= f;
    p.cy *= f;
    p.r *= f;
  }
  /* Texts, fills and block instances live beside the vertex graph, and a unit
     switch that left them at their old numbers would slide every label and
     palette patch off the wall it was put on. A block instance scales by its
     own factor so the definition — shared by every instance — stays as made. */
  for (const t of doc.texts.values()) {
    t.x *= f;
    t.y *= f;
    t.height *= f;
  }
  for (const fill of doc.fills.values()) {
    for (const p of fill.points) {
      p.x *= f;
      p.y *= f;
    }
  }
  for (const b of doc.blockInstances.values()) {
    b.x *= f;
    b.y *= f;
    b.scale = (b.scale ?? 1) * f;
  }
  doc.rebuildVertexGrid();
}
