// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { DxfLayer } from './DxfParseResult';

export function parseLayer(
  getNextPair: () => { code: number; value: string } | null,
): { layer: DxfLayer | null; lastPair: { code: number; value: string } | null } {
  let name = '';
  let colorIndex: number | undefined;
  let isFrozen = false;
  let isOff = false;
  let isLocked = false;
  let linetype: string | undefined;
  let lineweight: number | undefined;
  let lastPair: { code: number; value: string } | null = null;

  while (true) {
    const pair = getNextPair();
    if (!pair) break;
    const { code, value } = pair;
    if (code === 0) {
      lastPair = pair;
      break;
    }
    if (code === 2) name = value;
    else if (code === 62) {
      // a negative colour is DXF's way of saying the layer is off
      const aci = parseInt(value, 10);
      colorIndex = Math.abs(aci);
      isOff = aci < 0;
    } else if (code === 70) {
      const flags = parseInt(value, 10);
      isFrozen = (flags & 1) === 1;
      isLocked = (flags & 4) === 4;
    } else if (code === 6) linetype = value;
    else if (code === 370) lineweight = parseInt(value, 10);
  }

  const layer = name ? { name, colorIndex, isFrozen, isOff, isLocked, linetype, lineweight } : null;
  return { layer, lastPair };
}
