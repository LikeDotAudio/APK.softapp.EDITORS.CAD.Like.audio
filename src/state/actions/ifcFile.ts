// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '../EditorStore';
import { canUserSave } from '../../core/userAuth';
import { importIfc } from '@io/ifc/importIfc';
import { ifcFileName, sessionIfc } from '@io/ifc/sessionIfc';
import { showProblem } from '../../shell/softapp';
import { buildSavedSession } from './autoSaveSession';
import { applySavedSession } from './restoreBrowserSession';

interface SaveFilePickerWindow {
  showSaveFilePicker?: (options: {
    suggestedName?: string;
    types?: { description: string; accept: Record<string, string[]> }[];
  }) => Promise<FileSystemFileHandle>;
}

/**
 * File → Save .ifc: the drawing as IFC4X3_ADD2 (src/io/ifc), the same file the
 * browser keeps as the session's twin. DXF stays the 2D drawing export; this is
 * the model.
 */
export async function saveIfcFile(store: EditorStore): Promise<void> {
  if (store.currentUserAuth) {
    const authCheck = await canUserSave(store.currentUserAuth);
    if (!authCheck.allowed) {
      showProblem('http_forbidden', { subject: 'Save .ifc', detail: `Export denied: ${authCheck.reason}` });
      return;
    }
  }
  const name = ifcFileName(store.currentFileName);
  try {
    const blob = new Blob([await sessionIfc(buildSavedSession(store))], { type: 'application/x-step' });
    const picker = (window as unknown as SaveFilePickerWindow).showSaveFilePicker;
    if (picker) {
      try {
        const handle = await picker({ suggestedName: name, types: [{ description: 'IFC model', accept: { 'application/x-step': ['.ifc'] } }] });
        const stream = await handle.createWritable();
        await stream.write(blob);
        await stream.close();
        return;
      } catch (err) {
        if ((err as DOMException).name === 'AbortError') return;
        throw err;
      }
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  } catch (err) {
    showProblem('save_failed', { subject: name, detail: String((err as Error)?.message ?? err), onRetry: () => void saveIfcFile(store) });
  }
}

/** File → Open .ifc (and a host's `open { ifc }` / an .ifc `floorplan`): the file replaces the drawing, one undo step. */
export async function openIfcText(store: EditorStore, text: string, fileName: string): Promise<boolean> {
  let session;
  try {
    session = importIfc(text);
  } catch (err) {
    showProblem('file_unreadable', { subject: fileName, detail: String((err as Error)?.message ?? err), fix: ['Open an IFC (ISO 10303-21 .ifc) file, or a .dxf with File ▸ Open...'] });
    return false;
  }
  store.history.push(store.doc.snapshot());
  await applySavedSession(store, { ...session, currentFileName: session.currentFileName ?? fileName, userAuth: undefined });
  await store.autoSaveSession(false);
  store.showHint(`Opened ${fileName} — ${session.docSnapshot.edges.length} edges, ${session.schematic?.placements.length ?? 0} blocks.`, 4000);
  return true;
}
