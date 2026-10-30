// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Units } from '../../core/types';

/**
 * Suggested download name. The drawing's own name wins: an opened `bracket.dxf`
 * saves back as `bracket.dxf`, a `Clipboard.json` or `photo.png` session as
 * `Clipboard.dxf` / `photo.dxf`. Only an unnamed drawing falls back to
 * `my-part-<units>.dxf`.
 */
export function dxfFileName(units: Units, currentFileName?: string | null): string {
  const base = (currentFileName ?? '')
    .split(/[\\/]/)
    .pop()!
    .replace(/\.[^.]*$/, '')
    .replace(/[<>:"|?*\x00-\x1f]/g, '_')
    .trim();
  return base ? `${base}.dxf` : `my-part-${units}.dxf`;
}
