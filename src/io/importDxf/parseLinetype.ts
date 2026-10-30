// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { DxfLinetypeDef } from './DxfParseResult';

/** One LTYPE table record: its name, description and dash pattern (group 49s). */
export function parseLinetype(
  getNextPair: () => { code: number; value: string } | null,
): { linetype: DxfLinetypeDef | null; lastPair: { code: number; value: string } | null } {
  let name = '';
  let description: string | undefined;
  const pattern: number[] = [];
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
    else if (code === 3) description = value;
    else if (code === 49) {
      const v = parseFloat(value);
      if (Number.isFinite(v)) pattern.push(v);
    }
  }

  return { linetype: name ? { name, description, pattern } : null, lastPair };
}
