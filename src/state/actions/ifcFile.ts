// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '../EditorStore';
import { canUserSave } from '../../core/userAuth';
import { importIfc } from '@io/ifc/importIfc';
import { ifcFileName, sessionIfc } from '@io/ifc/sessionIfc';
import { showProblem } from '../../shell/softapp';
import { buildSavedSession } from './autoSaveSession';
import { applySavedSession } from './restoreBrowserSession';
import type { SavedSession } from '../../io/browserStorage/SavedSession';

/** The shared Save Model / Open Model (public/vendor/apk-softapp/apk-softapp.js, ROAD-3583), when the page has it. */
export interface ModelClient {
  saveModel(model: unknown, opts: { name: string; toIfc: (m: unknown) => string | Promise<string> }):
    Promise<{ ok: boolean; via?: string; files?: string[]; cancelled?: boolean; problem?: unknown }>;
  openModel?(opts: { file?: Blob; fromJson?: (data: unknown, name: string) => unknown }):
    Promise<{ ok: boolean; kind?: string; name?: string; text?: string; model?: unknown; cancelled?: boolean; problem?: unknown }>;
}

function modelClient(): ModelClient | undefined {
  const S = (globalThis as unknown as { APKSoftapp?: Partial<ModelClient> }).APKSoftapp;
  return S && typeof S.saveModel === 'function' ? (S as ModelClient) : undefined;
}

/**
 * Save Model: the drawing's native session (.json, the browser's own SavedSession) AND its .ifc twin, both
 * or neither, through the one picker every softapp shares. `ifcOf` makes the twin (sessionIfc).
 */
export async function saveDrawingModel(
  S: ModelClient, session: SavedSession, fileName: string, ifcOf: (s: SavedSession) => Promise<string>,
): Promise<{ ok: boolean; files: string[]; cancelled: boolean; problem?: unknown }> {
  const name = fileName.replace(/\.ifc$/i, '');
  const r = await S.saveModel(session, { name, toIfc: (m) => ifcOf(m as SavedSession) });
  return { ok: !!r.ok, files: r.files ?? [], cancelled: !!r.cancelled, problem: r.problem };
}

/** A drawing's native .json (Save Model's twin of the .ifc), as SavedSession; throws a sentence when it is not one. */
export function sessionFromJson(data: unknown): SavedSession {
  const s = data as Partial<SavedSession> | null;
  if (!s || typeof s !== 'object' || !s.docSnapshot || !Array.isArray((s.docSnapshot as { edges?: unknown }).edges)) {
    throw new TypeError('not a CAD drawing: a drawing\'s .json (Save Model) has a docSnapshot with its edges');
  }
  return s as SavedSession;
}

interface SaveFilePickerWindow {
  showSaveFilePicker?: (options: {
    suggestedName?: string;
    types?: { description: string; accept: Record<string, string[]> }[];
  }) => Promise<FileSystemFileHandle>;
}

/**
 * File → Save Model (.ifc + .json): the drawing as IFC4X3_ADD2 (src/io/ifc), the same file the
 * browser keeps as the session's twin, beside the session's native .json — APKSoftapp.saveModel, one
 * folder picked once a session, else two downloads. Without the shared client: the .ifc alone. DXF
 * stays the 2D drawing export; this is the model.
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
  const S = modelClient();
  if (S) {
    const r = await saveDrawingModel(S, buildSavedSession(store), name, (s) => sessionIfc(s, undefined, store.viewports));
    if (r.ok) store.showHint(`Saved ${r.files.join(' + ')}`, 3000);
    else if (!r.cancelled) showProblem(r.problem ?? 'save_failed', { subject: name, onRetry: () => void saveIfcFile(store) });
    return;
  }
  try {
    const blob = new Blob([await sessionIfc(buildSavedSession(store), undefined, store.viewports)], { type: 'application/x-step' });
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

/** File → Open Model: a drawing's .ifc, or the native .json Save Model wrote beside it. */
export async function openModelFile(store: EditorStore, file: File): Promise<boolean> {
  const S = modelClient();
  if (!S?.openModel || !/\.json$/i.test(file.name)) return await openIfcText(store, await file.text(), file.name);
  const r = await S.openModel({ file, fromJson: (data) => sessionFromJson(data) });
  if (!r.ok) {
    if (!r.cancelled) showProblem(r.problem ?? 'file_unreadable', { subject: file.name, fix: ['Open a drawing\'s .ifc, or the .json Save Model wrote beside it.'] });
    return false;
  }
  if (r.kind === 'ifc') return await openIfcText(store, r.text ?? '', file.name);
  const session = r.model as SavedSession;
  store.history.push(store.doc.snapshot());
  await applySavedSession(store, { ...session, currentFileName: session.currentFileName ?? file.name.replace(/\.json$/i, ''), userAuth: undefined });
  await store.autoSaveSession(false);
  store.showHint(`Opened ${file.name} — ${session.docSnapshot.edges.length} edges.`, 4000);
  return true;
}
