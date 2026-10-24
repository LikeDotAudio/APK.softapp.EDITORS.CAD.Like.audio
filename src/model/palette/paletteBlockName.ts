// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
/** The block a product item is placed as. Prefixed so it never meets a user's own block. */
export function paletteBlockName(itemId: string): string {
  return `PAL:${itemId}`;
}
