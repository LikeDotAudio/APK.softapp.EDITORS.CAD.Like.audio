// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Point, SchematicModel, Units, GridMode } from '../core/types';
import type { Doc } from '../model/Doc';
import type { PaletteFit, PaletteItem } from '../model/palette/PaletteItem';
import type { Viewport } from '../viewport/Viewport';

/** Everything a render module needs. Passed to each drawing function. */
export interface Scene {
  ctx: CanvasRenderingContext2D;
  view: Viewport;
  doc: Doc;
  units: Units;
  gridSize: number;
  gridMode?: GridMode;
  pointer: {
    /** Snapped world position (equal to `rawWorld` for non-snapping tools). */
    world: Point;
    /** Unsnapped world position. */
    rawWorld: Point;
    /** Canvas-relative pixel position. */
    screen: Point;
  };
  selection?: ReadonlySet<number>;
  /** The things on the sheet, as opposed to the strokes. Absent for a pure sketch. */
  schematic?: SchematicModel;
  /** Which catalogue symbol the Flow tool would place next. */
  flowDefinitionId?: string;
  /** The host palette item the Palette tool would paint or place next. */
  paletteItem?: PaletteItem | null;
  /** What a product does on a click: only `place` previews the block under the cursor. */
  paletteFit?: PaletteFit;
  /** Whether text annotations and block text render at fixed readable screen size (no zoom scaling). */
  fixedTextSize?: boolean;
}
