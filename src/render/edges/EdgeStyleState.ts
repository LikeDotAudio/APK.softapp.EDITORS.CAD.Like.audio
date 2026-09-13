// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Layer } from '../../core/types';

/** What `drawEdges` needs to know about selection, hover and layer visibility. */
export interface EdgeStyleState {
  selected: ReadonlySet<number>;
  hoverId: number | null;
  hoverEnabled: boolean;
  layers?: ReadonlyMap<string, Layer>;
}
