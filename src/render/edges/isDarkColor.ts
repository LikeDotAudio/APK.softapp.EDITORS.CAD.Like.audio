// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
/**
 * A layer colour this dark is invisible on the dark canvas, so the renderer
 * falls back to the default edge colour instead.
 */
export function isDarkColor(color?: string): boolean {
  if (!color) return true;
  const hex = color.toLowerCase().replace('#', '');
  if (hex === '000000' || hex === '000' || hex === '1a1a1a' || hex === '1e293b' || hex === '15181b') {
    return true;
  }
  if (hex.length === 6) {
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    if (r + g + b < 60) return true;
  }
  return false;
}
