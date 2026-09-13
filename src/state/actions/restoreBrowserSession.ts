// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '../EditorStore';
import { restoreSchematic } from '../../flow/Schematic';
import { loadSessionFromBrowser } from '../../io/browserStorage/loadSessionFromBrowser';

export async function restoreBrowserSession(store: EditorStore): Promise<void> {
  const session = await loadSessionFromBrowser();
  if (!session || !session.docSnapshot) return;
  // A sheet can hold blocks and no strokes, so "empty" has to mean both.
  const heldPlacements = session.schematic?.placements?.length ?? 0;
  if (session.docSnapshot.edges.length === 0 && heldPlacements === 0) return;

  store.doc.restore(session.docSnapshot);
  if (session.schematic) restoreSchematic(store.schematic, session.schematic);
  store.units = session.units || 'in';
  store.gridSize = session.gridSize || 0.25;
  store.gridMode = session.gridMode || 'lines';
  store.snapToGrid = session.snapToGrid ?? true;
  store.shapeMode = session.shapeMode ?? false;

  if (session.layers && session.layers.length > 0) {
    store.layers = new Map(session.layers.map((l) => [l.id, { ...l }]));
    store.activeLayerId = session.activeLayerId || session.layers[0]!.id;
  }

  if (session.tracing && session.tracing.dataUrl) {
    const img = new Image();
    img.src = session.tracing.dataUrl;
    await new Promise((res) => {
      img.onload = res;
    });
    store.tracing = {
      img,
      x: session.tracing.x,
      y: session.tracing.y,
      worldWidth: session.tracing.worldWidth,
      opacity: session.tracing.opacity,
      visible: session.tracing.visible,
    };
  }

  store.markDocChanged();
  store.view.zoomToFit(store.doc.bounds());
  store.requestDraw();
  store.emit();
  store.showHint(
    heldPlacements > 0
      ? `Restored previous session — ${heldPlacements} Flow block${heldPlacements === 1 ? '' : 's'} and their wires came back with it.`
      : 'Restored previous session from browser memory.',
    4000,
  );

}
