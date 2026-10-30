// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Units } from '../../core/types';

/** One LTYPE record: its description and its dash pattern (group 49 lengths). */
export interface DxfLinetype {
  description: string;
  /** Dash positive, gap negative, dot 0 — in drawing units. */
  pattern: number[];
}

/**
 * The linetypes this app knows by name, as `acad.lin` defines them in inches.
 * A millimetre drawing gets them ×25.4, which is `acadiso.lin` — so a DASHED
 * line on a mm sheet is a 12.7 mm dash, not a 0.5 mm one nobody can see.
 */
const STANDARD_INCH: Record<string, DxfLinetype> = {
  CONTINUOUS: { description: 'Solid line', pattern: [] },
  DASHED: { description: 'Dashed __ __ __ __', pattern: [0.5, -0.25] },
  HIDDEN: { description: 'Hidden __ __ __ __', pattern: [0.25, -0.125] },
  CENTER: { description: 'Center ____ _ ____ _', pattern: [1.25, -0.25, 0.25, -0.25] },
  DASHDOT: { description: 'Dash dot __ . __ .', pattern: [0.5, -0.25, 0, -0.25] },
  PHANTOM: {
    description: 'Phantom ____ _ _ ____',
    pattern: [1.25, -0.25, 0.25, -0.25, 0.25, -0.25],
  },
  DOT: { description: 'Dot . . . . . .', pattern: [0, -0.25] },
  DIVIDE: { description: 'Divide __ . . __ . .', pattern: [0.5, -0.25, 0, -0.25, 0, -0.25] },
  BORDER: { description: 'Border __ __ . __ __ .', pattern: [0.5, -0.25, 0.5, -0.25, 0, -0.25] },
};

/** The names a layer can pick without bringing its own pattern. */
export const STANDARD_LINETYPES = Object.keys(STANDARD_INCH);

/** A standard linetype scaled to the drawing's units, or null for a name this app does not know. */
export function standardLinetype(name: string, units: Units): DxfLinetype | null {
  const lt = STANDARD_INCH[name.toUpperCase()];
  if (!lt) return null;
  const k = units === 'mm' ? 25.4 : 1;
  return { description: lt.description, pattern: lt.pattern.map((v) => v * k) };
}

/**
 * The lineweights DXF allows (group 370), in hundredths of a millimetre. A
 * reader refuses anything between the steps, so a layer's weight is snapped
 * to the nearest one on the way out.
 */
export const DXF_LINEWEIGHTS = [
  0, 5, 9, 13, 15, 18, 20, 25, 30, 35, 40, 50, 53, 60, 70, 80, 90, 100, 106, 120, 140, 158, 200,
  211,
];

/** -3 ("Default") for no weight, else the nearest DXF step. */
export function dxfLineweight(weight: number | undefined): number {
  if (weight === undefined || !Number.isFinite(weight) || weight < 0) return -3;
  let best = DXF_LINEWEIGHTS[0]!;
  for (const w of DXF_LINEWEIGHTS) if (Math.abs(w - weight) < Math.abs(best - weight)) best = w;
  return best;
}

/**
 * A layer name a strict reader accepts. DXF forbids `< > / \ " : ; ? * | = '`
 * and the backquote in a symbol-table name; each becomes `_`. Empty becomes `0`.
 */
export function dxfLayerName(name: string): string {
  const cleaned = name.trim().replace(/[<>/\\":;?*|=`']/g, '_');
  return cleaned || '0';
}
