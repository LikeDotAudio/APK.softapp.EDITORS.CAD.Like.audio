// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Doc } from '../Doc';
import type { DocSnapshot } from './DocSnapshot';
import { reflectAcrossMirror } from './reflectAcrossMirror';

/**
 * When Symmetrical Mode is enabled, inspect what was added by an edit
 * and immediately generate its horizontal reflection across mirrorX.
 *
 * The new ids are handed over sorted by kind: each table numbers from 1, and
 * a flat set would also reflect whatever OLD edge or text shares a new
 * block's or fill's id.
 */
export function mirrorNewlyAddedEntities(
  doc: Doc,
  before: DocSnapshot,
  mirrorX: number,
): void {
  const fresh = <T extends { id: number }>(now: Iterable<T>, was: { id: number }[] | undefined): number[] => {
    const old = new Set((was ?? []).map((x) => x.id));
    const out: number[] = [];
    for (const x of now) if (!old.has(x.id)) out.push(x.id);
    return out;
  };

  const edges = fresh(doc.edges.values(), before.edges);
  const texts = fresh(doc.texts.values(), before.texts);
  const blocks = fresh(doc.blockInstances.values(), before.blockInstances);
  const fills = fresh(doc.fills.values(), before.fills);

  if (edges.length + texts.length + blocks.length + fills.length === 0) return;
  reflectAcrossMirror(doc, { edges, texts, blocks, fills }, mirrorX);
}
