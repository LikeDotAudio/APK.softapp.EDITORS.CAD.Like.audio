// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '../EditorStore';
import { restoreSchematic } from '../../flow/Schematic';
import { fetchBigPicture } from '../../io/bigPicture/bigPictureApi';

/**
 * Read 06a's filed sheet and make it the one on screen.
 *
 * WHEN THIS RUNS BY ITSELF: once, at start-up, and only at the Big Picture
 * entrance — 07b · Drawing is a sketch board and has no business being handed
 * a bench model. It runs AFTER `restoreBrowserSession`, and it wins when the
 * file has anything in it, because the file is the record and IndexedDB is one
 * browser's working copy of it.
 *
 * The exception is deliberate and it is the only one: a file that exists but is
 * EMPTY does not clear a session that has something in it. Somebody who drew a
 * sheet, never saved it and reloaded gets their sheet back rather than a blank
 * canvas, and the panel tells them it has not been filed.
 */
export async function openBigPicture(store: EditorStore): Promise<void> {
  if (store.entrance.entrance !== 'big-picture') return;

  const read = await fetchBigPicture();
  if (!read) {
    store.bigPicture = { ...store.bigPicture, reachable: false };
    store.emit();
    return;
  }

  const held = read.sheet.placements?.length ?? 0;
  const groups = read.sheet.groups?.length ?? 0;
  const localHeld = store.schematic.placements.length;

  store.bigPicture = {
    reachable: true,
    digest: read.digest,
    savedAt: read.sheet.saved_at ?? null,
    filed: Boolean(read.sheet.exists),
    dirty: false,
    message: null,
  };

  if (held === 0 && groups === 0) {
    // Nothing filed. Keep whatever the browser had; say so rather than wiping.
    store.bigPicture.dirty = localHeld > 0;
    store.emit();
    if (localHeld > 0) {
      store.showHint(
        'This sheet has never been filed. File ▸ Save to Big Picture writes it to APK:OS/system/big-picture.json.',
        6000,
      );
    }
    return;
  }

  store.editFlow(() => {
    restoreSchematic(store.schematic, read.sheet);
    return true;
  });
  store.view.zoomToFit(store.doc.bounds());
  store.requestDraw();
  store.emit();
  store.showHint(
    `Opened the filed Big Picture — ${held} block${held === 1 ? '' : 's'} in ${groups} group${groups === 1 ? '' : 's'}.`,
    5000,
  );
}
