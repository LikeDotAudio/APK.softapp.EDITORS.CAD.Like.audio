// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { DxfLayer } from './DxfParseResult';

export function parseLayer(
  getNextPair: () => { code: number; value: string } | null,
): { layer: DxfLayer | null; lastPair: { code: number; value: string } | null } {
  let name = '';
  let colorIndex: number | undefined;
  let isFrozen = false;
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
    else if (code === 62) colorIndex = Math.abs(parseInt(value, 10));
    else if (code === 70) isFrozen = (parseInt(value, 10) & 1) === 1;
  }

  const layer = name ? { name, colorIndex, isFrozen } : null;
  return { layer, lastPair };
}
