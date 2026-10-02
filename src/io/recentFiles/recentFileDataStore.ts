// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { openDB } from '../browserStorage/openDB';
import { RECENT_DATA_PREFIX } from './RecentFileEntry';

/** Save heavy file text or image dataUrl directly in IndexedDB. */
export async function saveRecentFileData(id: string, data: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction('store', 'readwrite');
    tx.objectStore('store').put(data, `${RECENT_DATA_PREFIX}${id}`);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Failed to save recent file data to IndexedDB:', err);
  }
}

/** Retrieve file text or image dataUrl from IndexedDB. */
export async function loadRecentFileData(id: string): Promise<string | null> {
  try {
    const db = await openDB();
    const tx = db.transaction('store', 'readonly');
    const req = tx.objectStore('store').get(`${RECENT_DATA_PREFIX}${id}`);
    return await new Promise<string | null>((resolve, reject) => {
      req.onsuccess = () => resolve((req.result as string) ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to load recent file data from IndexedDB:', err);
    return null;
  }
}

/** Delete a single cached file payload from IndexedDB. */
export async function deleteRecentFileData(id: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction('store', 'readwrite');
    tx.objectStore('store').delete(`${RECENT_DATA_PREFIX}${id}`);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Failed to delete recent file data from IndexedDB:', err);
  }
}

/** Clear all known recent file payloads from IndexedDB. */
export async function clearAllRecentFileData(ids: string[]): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction('store', 'readwrite');
    const store = tx.objectStore('store');
    for (const id of ids) {
      store.delete(`${RECENT_DATA_PREFIX}${id}`);
    }
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Failed to clear recent file data from IndexedDB:', err);
  }
}
