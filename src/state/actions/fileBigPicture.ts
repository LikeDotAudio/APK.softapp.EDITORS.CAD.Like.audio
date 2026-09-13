// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '../EditorStore';
import { snapshotSchematic } from '../../flow/Schematic';
import { saveBigPicture } from '../../io/bigPicture/bigPictureApi';

/**
 * Write the sheet to 06a's file. Explicit, never automatic.
 *
 * The browser session autosaves on a timer because it is this browser's own
 * scratch copy. This is a repository file that other displays read, and a
 * timer that wrote it would file every half-drawn group as the bench's model
 * — including the ones drawn to see what they looked like. So the verb stays
 * on the File menu, where a person means it.
 *
 * A 409 is reported and NOTHING is retried. The server refused because
 * somebody else's drawing is on disk; retrying with force is how theirs is
 * lost, and this app cannot merge two group trees — see the route's comment.
 */
export async function fileBigPicture(store: EditorStore): Promise<void> {
  if (store.entrance.entrance !== 'big-picture') return;

  const outcome = await saveBigPicture(snapshotSchematic(store.schematic), store.bigPicture.digest);

  if (!outcome.ok) {
    store.bigPicture = {
      ...store.bigPicture,
      reachable: !outcome.message.startsWith('no APK:OS server'),
      message: outcome.message,
    };
    store.emit();
    store.showHint(outcome.message, outcome.conflict ? 12000 : 6000);
    return;
  }

  store.bigPicture = {
    reachable: true,
    digest: outcome.result.digest,
    savedAt: outcome.result.saved_at,
    filed: true,
    dirty: false,
    message: null,
  };
  store.emit();
  store.showHint(
    `Filed — ${outcome.result.placements} block${outcome.result.placements === 1 ? '' : 's'} in ${outcome.result.groups} group${outcome.result.groups === 1 ? '' : 's'} written to APK:OS/system/big-picture.json.`,
    5000,
  );
}
