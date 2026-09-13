// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Layer, SchematicModel, Units } from '../../core/types';
import type { Doc } from '../../model/Doc';
import { buildDxf } from './buildDxf';
import { dxfFileName } from './dxfFileName';

interface SaveFilePickerWindow {
  showSaveFilePicker?: (options: {
    suggestedName?: string;
    types?: { description: string; accept: Record<string, string[]> }[];
  }) => Promise<FileSystemFileHandle>;
}

/**
 * Save the DXF, preferring the File System Access API so the user picks a
 * location, and falling back to a plain download elsewhere.
 */
export async function saveDxf(
  doc: Doc,
  units: Units,
  layers: Iterable<Layer> = [],
  schematic?: SchematicModel,
): Promise<void> {
  const blob = new Blob([buildDxf(doc, units, layers, schematic)], { type: 'application/dxf' });
  const name = dxfFileName(units);
  const picker = (window as unknown as SaveFilePickerWindow).showSaveFilePicker;

  if (picker) {
    try {
      const handle = await picker({
        suggestedName: name,
        types: [{ description: 'DXF File', accept: { 'application/dxf': ['.dxf'] } }],
      });
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
}
