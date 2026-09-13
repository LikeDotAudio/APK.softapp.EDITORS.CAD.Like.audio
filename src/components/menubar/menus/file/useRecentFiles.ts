// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { useCallback, useEffect, useState } from 'react';
import type { RecentFileEntry } from '../../../../io/recentFiles/RecentFileEntry';
import { clearRecentFiles } from '../../../../io/recentFiles/clearRecentFiles';
import { getRecentFiles } from '../../../../io/recentFiles/getRecentFiles';

export interface RecentFilesHandle {
  entries: RecentFileEntry[];
  clear: () => void;
}

/** Re-read the cached recent files each time the File menu opens. */
export function useRecentFiles(menuOpen: boolean): RecentFilesHandle {
  const [entries, setEntries] = useState<RecentFileEntry[]>([]);

  useEffect(() => {
    if (menuOpen) setEntries(getRecentFiles());
  }, [menuOpen]);

  const clear = useCallback(() => {
    clearRecentFiles();
    setEntries([]);
  }, []);

  return { entries, clear };
}
