// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
/**
 * Standard AutoCAD Color Index (ACI) table mapping for common CAD colors.
 * Maps DXF color index (1-255) to CSS hex colors.
 */
export const ACI_COLOR_MAP: Record<number, string> = {
  1: '#ff0000', // Red
  2: '#ffff00', // Yellow
  3: '#00ff00', // Green
  4: '#00ffff', // Cyan
  5: '#0000ff', // Blue
  6: '#ff00ff', // Magenta
  7: '#1a1a1a', // White/Black (renders dark gray on white canvas)
  8: '#808080', // Dark Gray
  9: '#c0c0c0', // Light Gray
  10: '#ff0000',
  30: '#ff7f00', // Orange
  40: '#ffd700', // Gold
  50: '#00ff00',
  80: '#00ff7f',
  130: '#007fff',
  170: '#7f00ff',
  210: '#ff007f',
};
