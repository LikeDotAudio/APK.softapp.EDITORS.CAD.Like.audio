// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Doc } from '../Doc';
import { findVertexNear } from './findVertexNear';

/** Returns an existing coincident vertex when there is one, otherwise creates it. */
export function addVertex(doc: Doc, x: number, y: number): number {
  const existing = findVertexNear(doc, x, y);
  if (existing !== null) return existing;
  const id = doc.nextVertexId++;
  doc.vertices.set(id, { id, x, y });
  return id;
}
