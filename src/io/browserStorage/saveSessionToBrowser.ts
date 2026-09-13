// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { openDB } from './openDB';
import { LOCALSTORAGE_SESSION_KEY, SESSION_KEY, type SavedSession } from './SavedSession';

/** IndexedDB holds the full session; localStorage keeps a lightweight backup. */
export async function saveSessionToBrowser(session: SavedSession): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction('store', 'readwrite');
    tx.objectStore('store').put(session, SESSION_KEY);
    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = reject;
    });
  } catch (err) {
    console.warn('IndexedDB save failed, falling back to localStorage:', err);
  }

  try {
    // The tracing image is dropped from the backup — it would blow the quota.
    const lightweightSession = {
      ...session,
      tracing: session.tracing ? { ...session.tracing, dataUrl: '' } : null,
    };
    localStorage.setItem(LOCALSTORAGE_SESSION_KEY, JSON.stringify(lightweightSession));
    document.cookie = `cad_active_session=1; path=/; max-age=31536000`;
  } catch (e) {
    console.warn('LocalStorage backup failed:', e);
  }
}
