// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '../EditorStore';
import { addRecentFile } from '../../io/recentFiles/addRecentFile';
import { loadImageFile } from '../../io/loadImageFile';

export async function importImage(store: EditorStore, file: File): Promise<void> {
  const img = await loadImageFile(file);
  const dataUrl = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });

  addRecentFile({ name: file.name, type: 'image', data: dataUrl });
  store.applyLoadedImage(img);

}
