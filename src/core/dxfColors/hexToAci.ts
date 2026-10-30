// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { ACI_COLOR_MAP } from './aciColorMap';
import { STANDARD_DXF_COLORS } from './standardDxfColors';

/**
 * The DXF colour index nearest a CSS colour, for a layer that has a colour but
 * no index — one added in the app, or recoloured from a host. The layer
 * palette's own swatches answer with their own index; anything else lands on
 * the nearest entry of the ACI table by RGB distance. A colour that is not
 * `#rgb`/`#rrggbb` answers 7, the index every reader draws as foreground.
 */
export function hexToAci(color: string): number {
  const swatch = STANDARD_DXF_COLORS.find((c) => c.hex.toLowerCase() === color.toLowerCase());
  if (swatch) return swatch.aci;
  const rgb = parseHex(color);
  if (!rgb) return 7;

  let best = 7;
  let bestDistance = Infinity;
  for (const [aci, hex] of Object.entries(ACI_COLOR_MAP)) {
    const other = parseHex(hex);
    if (!other) continue;
    const d = (rgb[0] - other[0]) ** 2 + (rgb[1] - other[1]) ** 2 + (rgb[2] - other[2]) ** 2;
    // `<` keeps the lowest index on a tie: 1 (red), not 10 (also red)
    if (d < bestDistance) {
      bestDistance = d;
      best = Number(aci);
    }
  }
  return best;
}

function parseHex(color: string): [number, number, number] | null {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color.trim());
  if (!m) return null;
  const h = m[1].length === 3 ? [...m[1]].map((c) => c + c).join('') : m[1];
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
