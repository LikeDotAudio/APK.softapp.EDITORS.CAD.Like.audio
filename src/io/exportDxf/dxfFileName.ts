// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Units } from '../../core/types';

/** Suggested download name, tagged with the drawing's units. */
export function dxfFileName(units: Units): string {
  return `my-part-${units}.dxf`;
}
