// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { useState } from 'react';
import type { RecentFileEntry } from '../../../../io/recentFiles/RecentFileEntry';
import { RecentFileRow } from './RecentFileRow';

export interface RecentFilesSubmenuProps {
  entries: RecentFileEntry[];
  onOpen: (entry: RecentFileEntry) => void;
  onClearAll: () => void;
}

/** Hover-expanding submenu listing the browser-cached files. */
export function RecentFilesSubmenu({ entries, onOpen, onClearAll }: RecentFilesSubmenuProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      <button
        type="button"
        className="flex w-full items-center justify-between rounded px-3 py-1.5 text-left text-[12px] transition-colors hover:bg-[rgba(244,144,44,0.18)] hover:text-white"
      >
        <span className="flex items-center gap-2">
          <span>🕒</span> Recent Files
        </span>
        <span>▶</span>
      </button>

      {expanded && (
        <div className="absolute left-full top-0 ml-1 flex max-h-64 w-56 flex-col gap-0.5 overflow-y-auto rounded border border-[#454545] bg-[#252526] p-1 shadow-2xl">
          {entries.length === 0 ? (
            <div className="px-3 py-2 text-[11px] italic text-[#777]">No recent files cached</div>
          ) : (
            <>
              {entries.map((entry) => (
                <RecentFileRow key={entry.id} entry={entry} onOpen={onOpen} />
              ))}
              <div className="my-0.5 border-t border-[#3c3c3c]" />
              <button
                type="button"
                onClick={onClearAll}
                className="flex items-center gap-2 rounded px-2.5 py-1 text-left text-[10px] text-[#f87171] transition-colors hover:bg-[#991b1b] hover:text-white"
              >
                <span>🗑️</span> Clear Recent Files
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
