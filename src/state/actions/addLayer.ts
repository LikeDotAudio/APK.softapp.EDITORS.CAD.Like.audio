// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '../EditorStore';
import type { Layer } from '../../core/types';

export function addLayer(store: EditorStore, name: string, color = '#3b82f6'): void {
  const cleanName = name.trim();
  if (!cleanName || store.layers.has(cleanName)) return;
  const layer: Layer = {
    id: cleanName,
    name: cleanName,
    color,
    visible: true,
  };
  store.layers.set(cleanName, layer);
  store.activeLayerId = cleanName;
  store.requestDraw();
  store.emit();

}
