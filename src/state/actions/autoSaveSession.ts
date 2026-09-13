// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '../EditorStore';
import type { SavedSession } from '../../io/browserStorage/SavedSession';
import { snapshotSchematic } from '../../flow/Schematic';
import { saveSessionToBrowser } from '../../io/browserStorage/saveSessionToBrowser';

export async function autoSaveSession(store: EditorStore): Promise<void> {
  const session: SavedSession = {
    version: 1,
    timestamp: Date.now(),
    docSnapshot: store.doc.snapshot(),
    schematic: snapshotSchematic(store.schematic),
    units: store.units,
    gridSize: store.gridSize,
    gridMode: store.gridMode,
    snapToGrid: store.snapToGrid,
    shapeMode: store.shapeMode,
    activeLayerId: store.activeLayerId,
    layers: Array.from(store.layers.values()),
    tracing: store.tracing
      ? {
          dataUrl: store.tracing.img.src,
          x: store.tracing.x,
          y: store.tracing.y,
          worldWidth: store.tracing.worldWidth,
          opacity: store.tracing.opacity,
          visible: store.tracing.visible,
        }
      : null,
  };
  await saveSessionToBrowser(session);

}
