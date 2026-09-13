// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { RECENT_KEY } from './RecentFileEntry';

/** Drop every cached file. */
export function clearRecentFiles(): void {
  try {
    localStorage.removeItem(RECENT_KEY);
    document.cookie = `cad_recent_count=0; path=/; max-age=0`;
  } catch (err) {
    console.warn('Failed to clear recent files:', err);
  }
}
