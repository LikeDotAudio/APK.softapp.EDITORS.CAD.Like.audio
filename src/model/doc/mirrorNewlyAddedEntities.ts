// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Doc } from '../Doc';
import type { DocSnapshot } from './DocSnapshot';
import { reflectAcrossMirror } from './reflectAcrossMirror';

/**
 * When Symmetrical Mode is enabled, inspect what was added by an edit
 * and immediately generate its horizontal reflection across mirrorX.
 */
export function mirrorNewlyAddedEntities(
  doc: Doc,
  before: DocSnapshot,
  mirrorX: number,
): void {
  const oldEdgeIds = new Set(before.edges.map((e) => e.id));
  const oldTextIds = new Set((before.texts || []).map((t) => t.id));
  const oldBlockIds = new Set((before.blockInstances || []).map((b) => b.id));

  const newEdgeIds: number[] = [];
  for (const e of doc.edges.values()) {
    if (!oldEdgeIds.has(e.id)) {
      newEdgeIds.push(e.id);
    }
  }

  const newTextIds: number[] = [];
  for (const t of doc.texts.values()) {
    if (!oldTextIds.has(t.id)) {
      newTextIds.push(t.id);
    }
  }

  const newBlockIds: number[] = [];
  for (const b of doc.blockInstances.values()) {
    if (!oldBlockIds.has(b.id)) {
      newBlockIds.push(b.id);
    }
  }

  const totalNew = newEdgeIds.length + newTextIds.length + newBlockIds.length;
  if (totalNew === 0) return;

  const toReflect = new Set<number>([...newEdgeIds, ...newTextIds, ...newBlockIds]);
  reflectAcrossMirror(doc, toReflect, mirrorX);
}
