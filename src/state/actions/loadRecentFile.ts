// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '../EditorStore';
import type { RecentFileEntry } from '../../io/recentFiles/RecentFileEntry';
import { loadRecentFileData } from '../../io/recentFiles/recentFileDataStore';

export async function loadRecentFile(store: EditorStore, entry: RecentFileEntry): Promise<void> {
  let data = entry.data;
  if (!data) {
    await store.showLoading('Opening drawings', `Loading ${entry.name} from cache...`);
    try {
      data = (await loadRecentFileData(entry.id)) ?? undefined;
    } finally {
      store.hideLoading();
    }
  }

  if (!data) {
    window.alert(`Could not load recent file "${entry.name}". Cached file data was not found in browser storage.`);
    return;
  }

  if (entry.type === 'dxf') {
    await store.loadDxfText(data, entry.name);
  } else if (entry.type === 'image') {
    store.currentFileName = entry.name;
    await store.loadRecentImage(data);
  }
}

