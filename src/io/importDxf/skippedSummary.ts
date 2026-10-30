// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { DxfParseResult } from './DxfParseResult';

/**
 * What an open left out, in one line for the user — `Not imported: 3DFACE ×12,
 * POLYLINE (mesh) ×1.` — most frequent first; '' when nothing was.
 */
export function skippedSummary(skipped: DxfParseResult['skipped'] | undefined): string {
  const rows = Object.entries(skipped ?? {}).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  if (rows.length === 0) return '';
  return `Not imported: ${rows.map(([type, n]) => `${type} ×${n.toLocaleString()}`).join(', ')}.`;
}
