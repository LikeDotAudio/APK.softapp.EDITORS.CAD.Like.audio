// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { getRecentFiles } from './getRecentFiles';
import { MAX_RECENT, RECENT_KEY, type RecentFileEntry } from './RecentFileEntry';

/** Store a file at the top of the recent list, replacing any same-named entry. */
export function addRecentFile(entry: Omit<RecentFileEntry, 'id' | 'timestamp'>): void {
  try {
    const list = getRecentFiles();
    const id = `${entry.type}_${entry.name}_${Date.now()}`;
    const filtered = list.filter((item) => item.name !== entry.name);
    const updated: RecentFileEntry[] = [{ ...entry, id, timestamp: Date.now() }, ...filtered].slice(
      0,
      MAX_RECENT,
    );

    localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
    document.cookie = `cad_recent_count=${updated.length}; path=/; max-age=31536000`;
  } catch (err) {
    console.warn('Failed to save recent file to cache/localStorage:', err);
  }
}
