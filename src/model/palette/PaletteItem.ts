// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
/**
 * A HOST'S MATERIALS, AS THE SHEET SEES THEM
 *
 * The editor knows nothing about concrete or mineral wool: a softapp built on
 * it (the acoustic overlay) sends its catalogue over the host bridge as a
 * `palette` message, and these are its rows. The CAD only cares about two
 * shapes of thing:
 *
 *   a FINISH  (no `size`) — an area material, painted as a region (a fill)
 *   a PRODUCT (`size` in METRES) — a fixed-size object, placed as a block at
 *             true size
 *
 * Whatever the host means by an item travels back to it as `paletteId` on the
 * patch, and nothing else about the item is stored in the drawing.
 */
export interface PaletteItem {
  id: string;
  name: string;
  /** Grouping in the palette panel — 'Masonry', 'Absorber', 'Diffuser'… */
  category: string;
  /** CSS colour for the swatch and the placed patch. */
  color: string;
  /** Fill pattern name; 'SOLID' paints flat. Default 'ANSI31'. */
  hatch?: string;
  /** Nominal width × height in metres. Present ⇒ a product placed as a block. */
  size?: [number, number];
  /** Tooltip text. */
  note?: string;
  /**
   * For the palette's preview (components/sidebar/palette/PalettePreview):
   * the drafting symbol it is drawn with (an id in materialSymbols — batt,
   * rigid, concrete, qrd …), that symbol's name in the standard and its
   * acad.pat hatch, its absorption per octave 125 Hz … 4 kHz, and how thick
   * it is, metres. All optional: an item without them previews as its swatch.
   */
  symbol?: string;
  symbolName?: string;
  acad?: string;
  alpha?: number[];
  depth?: number;
}

export interface Palette {
  title: string;
  items: PaletteItem[];
}

export const DEFAULT_PALETTE_HATCH = 'ANSI31';

/** What a product does when the Palette tool clicks: one block there, the region painted with it, or the region tiled with it. */
export type PaletteFit = 'place' | 'fill' | 'tile';
