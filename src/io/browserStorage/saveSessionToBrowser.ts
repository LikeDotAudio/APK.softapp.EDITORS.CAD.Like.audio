// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { canUserSave } from '../../core/userAuth';
import { openDB } from './openDB';
import { LOCALSTORAGE_SESSION_KEY, SESSION_IFC_KEY, SESSION_KEY, type SavedSession } from './SavedSession';

/**
 * IndexedDB holds the full session; localStorage keeps an optional lightweight backup if small.
 * `ifc` is the session's .ifc twin (src/io/ifc): written under SESSION_IFC_KEY in the SAME
 * transaction, so the two land together or not at all; null removes a twin that could not be
 * rebuilt (never a stale one left beside a newer session); undefined leaves it alone.
 */
export async function saveSessionToBrowser(session: SavedSession, ifc?: string | null): Promise<void> {
  if (session.userAuth) {
    const authCheck = await canUserSave(session.userAuth);
    if (!authCheck.allowed) {
      console.warn(`saveSessionToBrowser: save rejected — ${authCheck.reason}`);
      return;
    }
  }

  let idbOk = false;
  try {
    const db = await openDB();
    const tx = db.transaction('store', 'readwrite');
    tx.objectStore('store').put(session, SESSION_KEY);
    if (typeof ifc === 'string') tx.objectStore('store').put(ifc, SESSION_IFC_KEY);
    else if (ifc === null) tx.objectStore('store').delete(SESSION_IFC_KEY);
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

