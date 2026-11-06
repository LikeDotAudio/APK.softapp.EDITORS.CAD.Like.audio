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
export const REFDES = { maxPx: 9, minPx: 5, ofWidth: 0.12, room: 1.3 } as const;

export function refdesLabel(
  text: string,
  blockWidthPx: number,
  measure: (text: string, px: number) => number,
): { text: string; px: number } | null {
  const px = Math.min(REFDES.maxPx, blockWidthPx * REFDES.ofWidth);
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
