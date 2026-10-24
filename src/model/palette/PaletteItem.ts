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
}

export interface Palette {
  title: string;
  items: PaletteItem[];
}

export const DEFAULT_PALETTE_HATCH = 'ANSI31';
