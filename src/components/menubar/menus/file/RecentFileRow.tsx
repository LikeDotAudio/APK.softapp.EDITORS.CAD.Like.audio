// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { RecentFileEntry } from '../../../../io/recentFiles/RecentFileEntry';

export interface RecentFileRowProps {
  entry: RecentFileEntry;
  onOpen: (entry: RecentFileEntry) => void;
}

/** One cached file in the Recent Files submenu. */
export function RecentFileRow({ entry, onOpen }: RecentFileRowProps) {
  return (
    <button
      type="button"
      onClick={() => onOpen(entry)}
      className="flex items-center justify-between rounded px-2.5 py-1.5 text-left text-[11px] transition-colors hover:bg-[rgba(244,144,44,0.18)] hover:text-white"
    >
      <span className="flex min-w-0 items-center gap-1.5 truncate">
        <span>{entry.type === 'dxf' ? '📂' : '🖼️'}</span>
        <span className="truncate">{entry.name}</span>
      </span>
      <span className="ml-2 flex-shrink-0 text-[9px] text-[#777]">
        {new Date(entry.timestamp).toLocaleDateString()}
      </span>
    </button>
  );
}
