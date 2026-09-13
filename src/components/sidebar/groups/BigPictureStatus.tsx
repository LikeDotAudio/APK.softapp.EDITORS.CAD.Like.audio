// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { useStore } from '../../../state/useStore';
import { useUi } from '../../../state/useUi';

/**
 * Where this sheet stands with `APK:OS/system/big-picture.json`, and the one
 * button that writes it there.
 *
 * FOUR STATES, AND EACH SAYS WHICH ONE IT IS. `unreachable` is not a failure —
 * this bundle is also served from apk.audio, where there is no `server.py` and
 * a sheet is a browser-local drawing. Saying "no APK:OS here" is the honest
 * answer; a red error would be a claim that something is broken.
 *
 * There is no autosave button and there must not be one. See `fileBigPicture`.
 */
export function BigPictureStatus() {
  const store = useStore();
  const { bigPicture } = useUi();

  const state = !bigPicture.reachable
    ? { text: 'no APK:OS here — browser only', tone: 'text-[#777]' }
    : bigPicture.dirty
      ? { text: 'not filed since your last change', tone: 'text-[#facc15]' }
      : bigPicture.filed
        ? { text: `filed ${bigPicture.savedAt ?? ''}`.trim(), tone: 'text-[#22c55e]' }
        : { text: 'never filed', tone: 'text-[#facc15]' };

  return (
    <div className="flex flex-col gap-1 border-b border-[#333] px-2.5 py-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className={`truncate font-mono text-[10px] ${state.tone}`} title={state.text}>
          {state.text}
        </span>
        <button
          type="button"
          disabled={!bigPicture.reachable}
          onClick={() => void store.fileBigPicture()}
          title="Write this sheet to APK:OS/system/big-picture.json — 06a's document of record"
          className="flex-shrink-0 rounded-sm border border-[#4a4a4a] px-1.5 py-0.5 font-mono text-[10px] text-[#cccccc] hover:border-[#f4902c] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          file
        </button>
      </div>
      {bigPicture.message && (
        <p className="text-[10px] leading-snug text-[#ef4444]">{bigPicture.message}</p>
      )}
    </div>
  );
}
