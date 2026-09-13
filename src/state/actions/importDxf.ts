// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '../EditorStore';

export async function importDxf(store: EditorStore, file: File): Promise<void> {
  const text = await file.text();
  await store.loadDxfText(text, file.name);

}
