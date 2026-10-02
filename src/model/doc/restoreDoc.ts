// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Doc } from '../Doc';
import type { DocSnapshot } from './DocSnapshot';

/** Replace the document's contents with a snapshot. */
export function restoreDoc(doc: Doc, s: DocSnapshot): void {
  doc.vertices = new Map(s.vertices.map((v) => [v.id, { ...v }]));
  doc.edges = new Map(s.edges.map((e) => [e.id, { ...e }]));
  doc.groupPrimitives = new Map(s.groupPrimitives.map(([k, v]) => [k, { ...v }]));
  doc.groupIntact = new Set(s.groupIntact);
  doc.texts = new Map((s.texts ?? []).map((t) => [t.id, { ...t }]));
  doc.fills = new Map((s.fills ?? []).map((f) => [f.id, { ...f, points: f.points.map((p) => ({ ...p })) }]));
  doc.blocks = new Map((s.blocks ?? []).map(([k, v]) => [k, JSON.parse(JSON.stringify(v))]));
  doc.blockInstances = new Map((s.blockInstances ?? []).map((b) => [b.id, { ...b }]));
  doc.nextVertexId = s.nextVertexId;
  doc.nextEdgeId = s.nextEdgeId;
  doc.nextGroupId = s.nextGroupId;
  doc.nextTextId = s.nextTextId ?? 1;
  doc.nextFillId = s.nextFillId ?? 1;
  doc.nextBlockInstanceId = s.nextBlockInstanceId ?? 1;
}
