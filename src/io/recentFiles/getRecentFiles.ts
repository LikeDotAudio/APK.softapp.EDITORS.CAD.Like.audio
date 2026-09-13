// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { RECENT_KEY, type RecentFileEntry } from './RecentFileEntry';

/** Cached entries, newest first. Returns empty on any storage or parse failure. */
export function getRecentFiles(): RecentFileEntry[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as RecentFileEntry[];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}
