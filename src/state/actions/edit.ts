import type { EditorStore } from '../EditorStore';
import { mirrorNewlyAddedEntities } from '../../model/doc/mirrorNewlyAddedEntities';

export function edit(store: EditorStore, mutate: () => boolean): void {
  const before = store.doc.snapshot();
  if (mutate()) {
    if (store.mirror.enabled) {
      mirrorNewlyAddedEntities(store.doc, before, store.mirror.x);
    }
    store.history.push(before);
    store.markDocChanged();
  }
  store.requestDraw();
  store.emit();
}
