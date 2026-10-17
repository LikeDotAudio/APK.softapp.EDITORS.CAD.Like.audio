// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '../EditorStore';

export function toggleSymmetryMode(store: EditorStore): boolean {
  store.mirror.enabled = !store.mirror.enabled;
  if (store.mirror.enabled) {
    store.mirror.selected = true; // Glow edge on enable
    const bounds = store.doc.bounds();
    if (bounds && store.mirror.x === 0) {
      store.mirror.x = (bounds.x1 + bounds.x2) / 2;
    }
    store.showHint(
      `Symmetrical Mode ON · Virtual Mirror axis at X = ${store.mirror.x.toFixed(2)} (CAD edge glowing).`,
      3500,
    );
  } else {
    store.mirror.selected = false;
    store.showHint('Symmetrical Mode OFF.', 2000);
  }
  store.requestDraw();
  store.emit();
  return store.mirror.enabled;
}
