// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '../EditorStore';
import { canUserSave } from '../../core/userAuth';
import { kicadProject } from '@io/kicad/kicadSheet';
import { showProblem } from '../../shell/softapp';

interface DirectoryPickerWindow {
  showDirectoryPicker?: (o?: { id?: string; mode?: 'read' | 'readwrite' }) => Promise<FileSystemDirectoryHandle>;
}

/**
 * File › Export KiCad: the sheet as a KiCad project (io/kicad/kicadSheet.ts) — written into a folder you pick,
 * or, where the page cannot write a folder (a browser without it, a frame that may not), downloaded file by file.
 */
export async function exportKicad(store: EditorStore): Promise<void> {
  if (store.currentUserAuth) {
    const authCheck = await canUserSave(store.currentUserAuth);
    if (!authCheck.allowed) {
      showProblem('http_forbidden', { subject: 'Export KiCad', detail: `Export denied: ${authCheck.reason}` });
      return;
    }
  }
  const name = (store.currentFileName ?? 'drawing').replace(/\.(dxf|ifc|json)$/i, '');
  const project = kicadProject(store.schematic, name);
  if (!project.placed) {
    showProblem('bad_input', {
      subject: 'Export KiCad',
      detail: 'The sheet has no blocks with ports: there is nothing for KiCad to draw.',
      fix: ['Place parts from the BIM library (📚 Library) or the catalogue, wire them, then Export KiCad again.'],
    });
    return;
  }
  const said = `${project.placed} symbols · ${project.nets} nets${project.skipped.length ? ` · ${project.skipped.length} skipped` : ''}`;
  const picker = (window as unknown as DirectoryPickerWindow).showDirectoryPicker;
  if (picker) {
    try {
      const dir = await picker({ id: 'kicad-export', mode: 'readwrite' });
      for (const [file, text] of Object.entries(project.files)) {
        const w = await (await dir.getFileHandle(file, { create: true })).createWritable();
        await w.write(text);
        await w.close();
      }
      store.showHint(`KiCad project ${project.name} written into ${dir.name}/ — ${said}`, 5000);
      return;
    } catch (err) {
      if ((err as DOMException).name === 'AbortError') return;
      // a frame that may not open a folder picker (SecurityError): fall through to downloads
    }
  }
  try {
    for (const [file, text] of Object.entries(project.files)) {
      const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = file;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    }
    store.showHint(`KiCad project ${project.name}: ${Object.keys(project.files).length} files downloaded — keep them in one folder · ${said}`, 6000);
  } catch (err) {
    showProblem('save_failed', { subject: `${project.name}.kicad_sch`, detail: String((err as Error)?.message ?? err), onRetry: () => void exportKicad(store) });
  }
}
