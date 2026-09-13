// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '../EditorStore';
import type { GridMode } from '../../core/types';

export function setGridMode(store: EditorStore, mode: GridMode): void {
  store.gridMode = mode;
  store.requestDraw();
  store.emit();

}
