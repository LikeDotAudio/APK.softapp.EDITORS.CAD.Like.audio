// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '../EditorStore';
import type { RecentFileEntry } from '@io/recentFiles/RecentFileEntry';
import { loadRecentFileData } from '@io/recentFiles/recentFileDataStore';
import { showProblem } from '../../shell/softapp';

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
    showProblem('file_unreadable', {
      subject: entry.name,
      detail: 'Cached file data was not found in browser storage.',
      fix: ['Open it again from disk with File ▸ Open... (Ctrl+O): this browser no longer holds its cached copy.'],
    });
    return;
  }

  if (entry.type === 'dxf') {
    await store.loadDxfText(data, entry.name);
  } else if (entry.type === 'image') {
    store.currentFileName = entry.name;
    await store.loadRecentImage(data);
  }
}

