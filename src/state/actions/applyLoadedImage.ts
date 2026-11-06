// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '../EditorStore';

export function applyLoadedImage(store: EditorStore, img: HTMLImageElement): void {
  store.tracing = {
    img,
    x: 0,
    y: 0,
    worldWidth: 254, // mm (ten inches), whatever units the lengths are shown in
    opacity: 0.4,
    visible: true,
  };
  store.startCalibration();
  store.showHint(
    'Image loaded — click two points on it whose real distance you know, then enter that distance.',
    0,
  );

}
