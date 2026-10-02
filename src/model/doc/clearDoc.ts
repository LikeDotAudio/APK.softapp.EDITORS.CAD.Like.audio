// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Doc } from '../Doc';
import { STANDARD_CAD_BLOCKS } from '../cadBlocks/standardCadBlocks';

/** Empty the document and reset every id counter. */
export function clearDoc(doc: Doc): void {
  doc.vertices.clear();
  doc.vertexGrid.clear();
  doc.edges.clear();
  doc.groupPrimitives.clear();
  doc.groupIntact.clear();
  doc.texts.clear();
  doc.fills.clear();
  doc.blockInstances.clear();
  doc.blocks = new Map(STANDARD_CAD_BLOCKS.map((b) => [b.name, b]));
  doc.nextVertexId = 1;
  doc.nextEdgeId = 1;
  doc.nextGroupId = 1;
  doc.nextTextId = 1;
  doc.nextFillId = 1;
  doc.nextBlockInstanceId = 1;
}

