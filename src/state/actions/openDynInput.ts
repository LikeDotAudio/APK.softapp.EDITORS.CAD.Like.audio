// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '../EditorStore';
import type { Point } from '../../core/types';

export function openDynInput(store: EditorStore, anchor: Point): void {
  if (!store.tool.dyn) return;
  store.dynAnchor = anchor;
  store.dynValues = {};
  store.dynMode = store.tool.dyn.modes?.[0] ?? '';
  store.emit();

}
