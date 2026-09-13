// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '../EditorStore';

export function setMeasurement(store: EditorStore, text: string | null): void {
  if (store.measurement === text) return;
  store.measurement = text;
  store.emit();

}
