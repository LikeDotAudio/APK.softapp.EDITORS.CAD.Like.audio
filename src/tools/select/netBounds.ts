// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { BBox } from '../../core/types';
import { paddedBounds } from '../../render/selectionBox/paddedBounds';
import type { ToolApi } from '../types';

/** Padded selection net bounds, or null when fewer than two elements are selected. */
export function netBounds(api: ToolApi): BBox | null {
  if (api.selection.size < 2) return null;
  const b = api.doc.boundsOf(api.selection);
  return b ? paddedBounds(api.view, b) : null;
}
