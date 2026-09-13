// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '../EditorStore';

export function setDynValue(store: EditorStore, key: string, raw: string): void {
  store.dynValues[key] = raw;
  const typed = store.resolveDyn();
  store.pointer = { ...store.pointer, world: typed ?? store.dynCursor };
  store.requestDraw();
  store.emit();

}
