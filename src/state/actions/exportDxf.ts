// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '../EditorStore';
import { canUserSave } from '../../core/userAuth';
import { saveDxf } from '@io/exportDxf/saveDxf';
import { showProblem } from '../../shell/softapp';
import { DOC_UNITS } from '../../model/units/docUnits';

export async function exportDxf(store: EditorStore): Promise<void> {
  if (store.currentUserAuth) {
    const authCheck = await canUserSave(store.currentUserAuth);
    if (!authCheck.allowed) {
      showProblem('http_forbidden', { subject: 'Download DXF', detail: `Export denied: ${authCheck.reason}` });
      return;
    }
  }

  if (store.shapeMode) {
    const result = store.validation();
    if (!result.valid) {
      showProblem('bad_input', {
        subject: 'Download DXF',
        detail: `Cannot export yet: ${result.errs.join(' · ')}`,
        fix: ['Fix the highlighted issues on the drawing, then Download DXF again.'],
      });
      return;
    }
  }
  try {
    // the DXF says what its numbers are ($INSUNITS 4): the drawing's own mm (cad-1)
    await saveDxf(store.doc, DOC_UNITS, store.layers.values(), store.schematic, store.currentFileName);
  } catch (err) {
    // the save dialog or the write failed (not a cancel: saveDxf returns quietly on AbortError)
    showProblem('save_failed', {
      subject: store.currentFileName ?? 'Download DXF',
      detail: String((err as Error)?.message ?? err),
      onRetry: () => void exportDxf(store),
    });
  }
}
