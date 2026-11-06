// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '../EditorStore';
import type { SavedSession } from '@io/browserStorage/SavedSession';
import { snapshotSchematic } from '../../flow/Schematic';
import { saveSessionToBrowser } from '@io/browserStorage/saveSessionToBrowser';
import { sessionIfc } from '@io/ifc/sessionIfc';

export async function autoSaveSession(store: EditorStore, forceLoadingScreen = false): Promise<void> {
  const showLoading = forceLoadingScreen && !store.loading;

  if (showLoading) {
    await store.showLoading('Opening drawings', 'Caching drawing session to browser storage...');
  }
  try {
    // Owner decision 1: the native session AND its .ifc twin, in one IndexedDB transaction.
    // A twin that cannot be built is dropped in that same transaction, never left stale.
    const session = buildSavedSession(store);
    let ifc: string | null = null;
    try {
      ifc = await sessionIfc(session);
    } catch (err) {
      console.warn('autoSaveSession: the .ifc twin could not be built:', err);
    }
    await saveSessionToBrowser(session, ifc);
  } finally {
    if (showLoading) {
      store.hideLoading();
    }
  }
}

/** The whole drawing session as one plain object — what the browser keeps, and what a host saves to a file. */
export function buildSavedSession(store: EditorStore): SavedSession {
  return {
    version: 1,
    timestamp: Date.now(),
    userAuth: store.currentUserAuth ?? undefined,
    docSnapshot: store.doc.snapshot(),
    currentFileName: store.currentFileName,
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
    docKey: store.docKey,
    mirror: { ...store.mirror, mirrors: store.mirror.mirrors.map((m) => ({ ...m })) },
    spaces: store.spaces.map((s) => ({ ...s, points: s.points.map((p) => ({ ...p })) })),
  };
}
