// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { openDB } from './openDB';
import { LOCALSTORAGE_SESSION_KEY, SESSION_KEY, type SavedSession } from './SavedSession';

/** Restore the last session, preferring IndexedDB over the localStorage backup. */
export async function loadSessionFromBrowser(): Promise<SavedSession | null> {
  try {
    const db = await openDB();
    const tx = db.transaction('store', 'readonly');
    const req = tx.objectStore('store').get(SESSION_KEY);
    const result = await new Promise<SavedSession | undefined>((resolve, reject) => {
      req.onsuccess = () => resolve(req.result);
      req.onerror = reject;
    });
    if (result && result.docSnapshot) return result;
  } catch (err) {
    console.warn('IndexedDB load failed:', err);
  }

  try {
    const raw = localStorage.getItem(LOCALSTORAGE_SESSION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as SavedSession;
      if (parsed && parsed.docSnapshot) return parsed;
    }
  } catch {}

  return null;
}
