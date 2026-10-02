// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { getRecentFiles } from './getRecentFiles';
import { RECENT_KEY } from './RecentFileEntry';
import { clearAllRecentFileData } from './recentFileDataStore';

/** Drop every cached file from localStorage and IndexedDB. */
export function clearRecentFiles(): void {
  try {
    const list = getRecentFiles();
    const ids = list.map((item) => item.id);
    localStorage.removeItem(RECENT_KEY);
    document.cookie = `cad_recent_count=0; path=/; max-age=0`;
    void clearAllRecentFileData(ids);
  } catch (err) {
    console.warn('Failed to clear recent files:', err);
  }
}

