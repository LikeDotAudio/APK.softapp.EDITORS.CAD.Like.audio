// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { getRecentFiles } from './getRecentFiles';
import { MAX_RECENT, RECENT_KEY, type RecentFileEntry } from './RecentFileEntry';
import { deleteRecentFileData, saveRecentFileData } from './recentFileDataStore';

/** Store a file at the top of the recent list, replacing any same-named entry. */
export async function addRecentFile(entry: Omit<RecentFileEntry, 'id' | 'timestamp'>): Promise<void> {
  const timestamp = Date.now();
  const sanitized = entry.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const id = `${entry.type}_${sanitized}_${timestamp}`;

  // 1. Store the full payload in IndexedDB (gigabytes headroom, no 5MB quota limit)
  if (entry.data) {
    try {
      await saveRecentFileData(id, entry.data);
    } catch (err) {
      console.warn('Failed to save recent file data to IndexedDB:', err);
    }
  }

  // 2. Store lightweight metadata ONLY in localStorage (no large payload strings)
  try {
    const list = getRecentFiles();
    const filtered = list.filter((item) => item.name !== entry.name);

    const metadataEntry: RecentFileEntry = {
      id,
      name: entry.name,
      type: entry.type,
      timestamp,
    };

    const updated: RecentFileEntry[] = [metadataEntry, ...filtered].slice(0, MAX_RECENT);

    // Clean up payloads for entries that dropped off the list
    const dropped = filtered.slice(MAX_RECENT - 1);
    for (const old of dropped) {
      void deleteRecentFileData(old.id);
    }

    localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
    document.cookie = `cad_recent_count=${updated.length}; path=/; max-age=31536000`;
  } catch (err) {
    console.warn('Failed to save recent file to cache/localStorage:', err);
  }
}

