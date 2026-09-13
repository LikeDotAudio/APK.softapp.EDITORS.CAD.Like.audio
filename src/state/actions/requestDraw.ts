// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '../EditorStore';

export function requestDraw(store: EditorStore): void {
  if (store.frameHandle) return;
  store.frameHandle = requestAnimationFrame(() => {
    store.frameHandle = 0;
    store.render();
  });

}
