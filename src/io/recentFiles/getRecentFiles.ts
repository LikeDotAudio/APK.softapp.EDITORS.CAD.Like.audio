// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { RECENT_KEY, type RecentFileEntry } from './RecentFileEntry';
import { saveRecentFileData } from './recentFileDataStore';

/** Cached entries, newest first. Migrates and strips legacy embedded data to free localStorage quota. */
export function getRecentFiles(): RecentFileEntry[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as RecentFileEntry[];
    if (!Array.isArray(list)) return [];

    let migrated = false;
    for (const item of list) {
      if (item && item.data) {
        // Asynchronously back up legacy payload into IndexedDB so it's not lost
        void saveRecentFileData(item.id, item.data);
        delete item.data;
        migrated = true;
      }
    }
    if (migrated) {
      try {
        localStorage.setItem(RECENT_KEY, JSON.stringify(list));
      } catch {}
    }

    return list;
  } catch {
    return [];
  }
}

