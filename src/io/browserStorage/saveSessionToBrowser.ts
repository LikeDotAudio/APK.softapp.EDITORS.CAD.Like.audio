// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { openDB } from './openDB';
import { LOCALSTORAGE_SESSION_KEY, SESSION_KEY, type SavedSession } from './SavedSession';

/** IndexedDB holds the full session; localStorage keeps an optional lightweight backup if small. */
export async function saveSessionToBrowser(session: SavedSession): Promise<void> {
  let idbOk = false;
  try {
    const db = await openDB();
    const tx = db.transaction('store', 'readwrite');
    tx.objectStore('store').put(session, SESSION_KEY);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    idbOk = true;
  } catch (err) {
    console.warn('IndexedDB save failed, falling back to localStorage:', err);
  }

  try {
    const vertCount = session.docSnapshot.vertices?.length ?? 0;
    const edgeCount = session.docSnapshot.edges?.length ?? 0;
    const textCount = session.docSnapshot.texts?.length ?? 0;
    const isSmall = vertCount < 2000 && edgeCount < 2000 && textCount < 500;

    if (isSmall) {
      // Tracing image is dropped from localStorage backup — it would blow the quota.
      const lightweightSession = {
        ...session,
        tracing: session.tracing ? { ...session.tracing, dataUrl: '' } : null,
      };
      const json = JSON.stringify(lightweightSession);

      // LocalStorage has a strict ~5MB origin limit.
      // If session JSON is small (< 256 KB), keep as fallback.
      if (json.length < 256 * 1024) {
        localStorage.setItem(LOCALSTORAGE_SESSION_KEY, json);
      } else if (idbOk) {
        localStorage.removeItem(LOCALSTORAGE_SESSION_KEY);
      }
    } else if (idbOk) {
      // IndexedDB handles large sessions; keep localStorage clean
      localStorage.removeItem(LOCALSTORAGE_SESSION_KEY);
    }
    document.cookie = `cad_active_session=1; path=/; max-age=31536000`;
  } catch {
    // QuotaExceededError or private browsing restrictions:
    // Evict localStorage session backup so it does not block other storage operations.
    try {
      localStorage.removeItem(LOCALSTORAGE_SESSION_KEY);
    } catch {}
  }
}

