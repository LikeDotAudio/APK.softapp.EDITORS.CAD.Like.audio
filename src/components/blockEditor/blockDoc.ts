// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { CadBlockDefinition } from '../../core/types';

/**
 * A SOFTAPP'S BLOCK, KEPT WHOLE (IFC-CORE-DELTAS cad-8 / cad-9, the CAD side)
 *
 * A block editor (FloorPlan, DrawingSheet, …) saves its own document into the
 * CAD with toCad.blockSave. The CAD draws only the symbol geometry it knows —
 * lines, arcs, circles, texts, fills — but it keeps the editor's whole block
 * under `doc`, so 'Save into CAD' never drops the floors, rooms and drops of a
 * plan or the revisions of a sheet, and the next toEditor.load hands the
 * editor back the very document it saved.
 */

/** The CAD block for what an editor saved under `name`. */
export function blockFromEditor(name: string, returned: Record<string, unknown>): CadBlockDefinition {
  const list = <T,>(k: string): T[] => (Array.isArray(returned[k]) ? (returned[k] as T[]) : []);
  const description = returned.description ?? returned.name;
  return {
    name,
    ...(typeof description === 'string' ? { description } : {}),
    basePoint: (returned.basePoint as CadBlockDefinition['basePoint']) || { x: 0, y: 0 },
    lines: list('lines'),
    arcs: list('arcs'),
    circles: list('circles'),
    texts: list('texts'),
    fills: list('fills'),
    doc: JSON.parse(JSON.stringify(returned)) as Record<string, unknown>,
  };
}

/** The block toEditor.load carries: the editor's own document when the CAD kept it, else the CAD block. */
export function blockForEditor(def: CadBlockDefinition | undefined, name: string, type: string, now: number = Date.now()): Record<string, unknown> {
  if (!def) return { name, type, timestamp: now };
  return JSON.parse(JSON.stringify(def.doc ?? def)) as Record<string, unknown>;
}
