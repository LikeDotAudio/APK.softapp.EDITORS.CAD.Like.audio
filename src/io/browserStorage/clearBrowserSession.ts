// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { openDB } from './openDB';
import { LOCALSTORAGE_SESSION_KEY, SESSION_KEY } from './SavedSession';

/** Forget the stored session in both backends. */
export async function clearBrowserSession(): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction('store', 'readwrite');
    tx.objectStore('store').delete(SESSION_KEY);
  } catch {}

  try {
    localStorage.removeItem(LOCALSTORAGE_SESSION_KEY);
    document.cookie = `cad_active_session=0; path=/; max-age=0`;
  } catch {}
}
