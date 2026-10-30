// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '../EditorStore';
import { canUserSave } from '../../core/userAuth';
import { saveDxf } from '../../io/exportDxf/saveDxf';

export async function exportDxf(store: EditorStore): Promise<void> {
  if (store.currentUserAuth) {
    const authCheck = await canUserSave(store.currentUserAuth);
    if (!authCheck.allowed) {
      window.alert(`Export denied: ${authCheck.reason}`);
      return;
    }
  }

  if (store.shapeMode) {
    const result = store.validation();
    if (!result.valid) {
      window.alert(
        `Cannot export yet:\n\n${result.errs.map((e) => `  • ${e}`).join('\n')}\n\nFix the highlighted issues and try again.`,
      );
      return;
    }
  }
  await saveDxf(store.doc, store.units, store.layers.values(), store.schematic, store.currentFileName);
}
