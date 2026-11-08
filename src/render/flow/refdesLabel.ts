// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
/**
 * A HOST BLOCK'S NAME, SIZED BY ITS BLOCK (ROAD-3563).
 *
 * A refdes drawn at one screen size under every block is fine for a handful of
 * symbols somebody placed. A host's sheet is a hundred BIM blocks
 * (`U92 · Chromecast-…`, the Simulation, Library Equipment): at fit the blocks
 * are a few pixels tall and their names, still 9 px each, ran over one another
 * into an unreadable band. So a host block's name scales with the block — a
 * fraction of its drawn width, never above the usual marker size — is clipped
 * to that width with an ellipsis, and is not drawn at all below a size anyone
 * could read. Pure: the measurer is passed in.
 */
export const REFDES = { maxPx: 9, minPx: 5, ofWidth: 0.12, room: 1.3, growOfWidth: 0.05 } as const;

/*
 * ZOOMING IN MAKES IT CLEARER, NOT SMALLER (the owner, 2026-11-07: "when i zoom in
 * things should become more clear not just become smaller"). Up to the marker size a
 * name follows the block as before; past it, it keeps growing with the block
 * (growOfWidth of its drawn width), so a closer look is a bigger, clearer name.
 */
const grown = (shrunk: number, grownPx: number) => Math.max(shrunk, grownPx);

/**
 * A label of `px` that must fit in `roomPx`: as it is, else clipped with an
 * ellipsis, else null — and null below REFDES.minPx, where nobody could read it.
 */
export function fitLabel(
  text: string,
  px: number,
  roomPx: number,
  measure: (text: string, px: number) => number,
): { text: string; px: number } | null {
  if (!text || px < REFDES.minPx) return null;
  if (measure(text, px) <= roomPx) return { text, px };
  let lo = 0;
  let hi = text.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (measure(`${text.slice(0, mid)}…`, px) <= roomPx) lo = mid;
    else hi = mid - 1;
  }
  return lo > 0 ? { text: `${text.slice(0, lo)}…`, px } : null;
}

/** A host group's name: GROUP_LABEL_UNITS drawing units tall (mm on a mm sheet), growing past the marker size as the view closes in, clipped to the group's width. */
export const GROUP_LABEL_UNITS = 40;

export function groupLabel(text: string, zoom: number, widthPx: number, measure: (text: string, px: number) => number) {
  return fitLabel(text, grown(Math.min(REFDES.maxPx, GROUP_LABEL_UNITS * zoom), GROUP_LABEL_UNITS * zoom * 0.3), widthPx, measure);
}

export function refdesLabel(
  text: string,
  blockWidthPx: number,
  measure: (text: string, px: number) => number,
): { text: string; px: number } | null {
  const px = grown(Math.min(REFDES.maxPx, blockWidthPx * REFDES.ofWidth), blockWidthPx * REFDES.growOfWidth);
  if (!text || px < REFDES.minPx) return null;
  const room = blockWidthPx * REFDES.room;
  if (measure(text, px) <= room) return { text, px };
  let lo = 0;
  let hi = text.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (measure(`${text.slice(0, mid)}…`, px) <= room) lo = mid;
    else hi = mid - 1;
  }
  return lo > 0 ? { text: `${text.slice(0, lo)}…`, px } : null;
}
