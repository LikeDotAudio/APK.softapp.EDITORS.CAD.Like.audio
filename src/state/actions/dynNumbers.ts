// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '../EditorStore';
import { parseMathExpression } from '../../core/parseMathExpression';
import { fromDisplay } from '../../model/units/docUnits';

/** What is typed in the dyn box, as numbers: lengths typed in the display units come back in mm (cad-1), angles as typed. */
export function dynNumbers(store: EditorStore): Record<string, number | null> {
  const out: Record<string, number | null> = {};
  const angles = new Set((store.tool.dyn?.fields(store.toolState) ?? []).filter((f) => f.angle).map((f) => f.key));
  for (const [key, raw] of Object.entries(store.dynValues)) {
    const n = parseMathExpression(raw);
    out[key] = n === null || angles.has(key) ? n : fromDisplay(n, store.units);
  }
  return out;

}
