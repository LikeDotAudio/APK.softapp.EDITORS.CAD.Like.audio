// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '../EditorStore';
import type { Point } from '../../core/types';
import type { Snap } from '../../viewport/snap/findSnap';
import { applyOrtho } from '../../viewport/snap/applyOrtho';
import { findSnap } from '../../viewport/snap/findSnap';

/** Recompute snapped/raw cursor positions and any typed-dimension override. */
export function updatePointer(store: EditorStore, e: MouseEvent, screen: Point): void {
  const rawWorld = store.view.toWorld(screen.x, screen.y);
  let world = rawWorld;
  let snap: Snap | null = null;

  // Picking a reference point always snaps, even under tools that normally don't.
  if (!store.calibration.active && (store.tool.snaps || store.pickingBasePoint)) {
    snap = findSnap(store.doc, store.view, rawWorld.x, rawWorld.y, {
      gridSize: store.gridSize,
      snapToGrid: store.snapToGrid,
    });
    world = { x: snap.x, y: snap.y };
    if (e.shiftKey) {
      const ref = store.tool.orthoRef?.(store.toolState);
      if (ref) world = applyOrtho(world, ref);
    }
  }

  store.snap = snap;
  store.dynCursor = world;
  const typed = store.resolveDyn();
  store.pointer = { world: typed ?? world, rawWorld, screen };

}
