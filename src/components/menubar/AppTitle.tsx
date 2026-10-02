// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { useEffect } from 'react';
import { useEntrance } from '../../shell/EntranceContext';
import { useStore } from '../../state/useStore';
import { useUi } from '../../state/useUi';

/**
 * Wordmark at the left edge of the header. It says which ENTRANCE this window
 * came in by — `BIG PICTURE.LIKE.AUDIO` or `CAD.LIKE.AUDIO` — because two
 * desktop tiles run this one bundle and a person looking at a window has to be
 * able to tell which of them they opened (PLAN-60.07).
 *
 * If a drawing file is open, it also shows the file name with a one-click close
 * button and keeps document.title synced.
 */
export function AppTitle() {
  const store = useStore();
  const { title, subtitle } = useEntrance();
  const { currentFileName } = useUi();

  useEffect(() => {
    const baseTitle = `${title}${subtitle}`;
    document.title = currentFileName ? `${currentFileName} — ${baseTitle}` : baseTitle;
    return () => {
      document.title = baseTitle;
    };
  }, [title, subtitle, currentFileName]);

  return (
    <div className="flex items-center gap-2">
      <h1 className="font-mono text-[11px] uppercase tracking-[0.14em]">
        <span className="font-bold text-white">{title}</span>
        <span className="font-normal text-[#f4902c]">{subtitle}</span>
      </h1>
      {currentFileName && (
        <span className="flex items-center gap-1.5 rounded bg-[#1e1e1e] border border-[#3e3e42] px-2 py-0.5 text-[11px] text-[#e0e0e0] font-mono normal-case tracking-normal">
          <span className="text-[#888]">📄</span>
          <span className="max-w-[160px] truncate" title={currentFileName}>
            {currentFileName}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              void store.closeFile();
            }}
            title={`Close ${currentFileName}`}
            className="ml-1 text-[#888] hover:text-[#ff5555] transition-colors font-bold leading-none cursor-pointer"
          >
            ✕
          </button>
        </span>
      )}
    </div>
  );
}
