// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Layer, ValidationResult } from '../core/types';
import type { CalibrationState } from '../image/calibration/CalibrationState';
import type { TracingImage } from '../image/TracingImage';
import type { AnyTool } from '../tools/types';
import type { Snap } from '../viewport/snap/findSnap';
import { drawCalibration } from './drawCalibration';
import { drawBadVertexMarkers } from './edges/drawBadVertexMarkers';
import { drawEdges } from './edges/drawEdges';
import { drawGroups } from './flow/drawGroups';
import { drawSchematic } from './flow/drawSchematic';
import { drawGrid } from './grid/drawGrid';
import { drawImageLayer } from './imageLayer';
import { drawBoundsOverlay } from './overlays/drawBoundsOverlay';
import { drawErrorBanner } from './overlays/drawErrorBanner';
import type { Scene } from './Scene';
import { drawSnapIndicator } from './snapIndicator';

export interface FrameState {
  tool: AnyTool;
  toolState: object;
  selection: ReadonlySet<number>;
  hoverId: number | null;
  snap: Snap | null;
  tracing: TracingImage | null;
  calibration: CalibrationState;
  validation: ValidationResult;
  shapeMode?: boolean;
  layers?: ReadonlyMap<string, Layer>;
  /** True while Ctrl+Shift+C waits for the reference point click. */
  pickingBasePoint?: boolean;
}

/** Paint one frame, back to front. */
export function renderScene(scene: Scene, frame: FrameState): void {
  drawGrid(scene);
  drawBoundsOverlay(scene);
  drawImageLayer(scene, frame.tracing);
  drawCalibration(scene, frame.calibration);

  drawEdges(scene, {
    selected: frame.selection,
    hoverId: frame.hoverId,
    hoverEnabled: frame.tool.id === 'select',
    layers: frame.layers,
  });

  // Containers behind their contents: a group is the ground a block sits on.
  drawGroups(scene, scene.schematic);
  drawSchematic(scene, scene.schematic);

  if (frame.shapeMode) {
    drawBadVertexMarkers(scene);
  }

  if (!frame.calibration.active) {
    if (!frame.pickingBasePoint) frame.tool.drawPreview?.(frame.toolState, scene);
    const showSnap = frame.pickingBasePoint || (frame.tool.showsSnapIndicator ?? frame.tool.snaps);
    if (showSnap) drawSnapIndicator(scene, frame.snap);
  }

  if (frame.shapeMode) {
    drawErrorBanner(scene, frame.validation);
  }
}
