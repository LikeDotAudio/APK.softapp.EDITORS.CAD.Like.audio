// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '../EditorStore';
import type { Scene } from '../../render/Scene';
import { renderScene } from '../../render/renderScene';

export function render(store: EditorStore): void {
  if (!store.ctx) return;
  const scene: Scene = {
    ctx: store.ctx,
    view: store.view,
    doc: store.doc,
    units: store.units,
    gridSize: store.gridSize,
    gridMode: store.gridMode,
    pointer: store.pointer,
    selection: store.selection,
    schematic: store.schematic,
    flowDefinitionId: store.flowDefinitionId,
  };
  renderScene(scene, {
    tool: store.tool,
    toolState: store.toolState,
    selection: store.selection,
    hoverId: store.hoverId,
    snap: store.snap,
    tracing: store.tracing,
    calibration: store.calibration,
    validation: store.validation(),
    shapeMode: store.shapeMode,
    layers: store.layers,
    pickingBasePoint: store.pickingBasePoint,
  });

}
