// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
/** toolSlice.ts — The tool API the store hands tools (cable editor, palette, hints), canvas attachment, pointer input, tool and units.
 *  Bound onto EditorStore's prototype in EditorStore.ts; each method keeps the signature and body it had
 *  in the class (`this` is the store). */
import type { EditorStore } from '../EditorStore';
import type { ConnectorCable, Point, ToolId, Units, GridMode } from '../../core/types';
import type { Palette, PaletteFit, PaletteItem } from '../../model/palette/PaletteItem';
import type { PointerInput } from '../../tools/types';
import { armPaletteItem } from '../actions/armPaletteItem';
import { attach } from '../actions/attach';
import { canvasPoint } from '../actions/canvasPoint';
import { setConnectorCable } from '../../flow/cables';
import { handleDoubleClick } from '../actions/handleDoubleClick';
import { handleKeyDown } from '../actions/handleKeyDown';
import { handlePointerDown } from '../actions/handlePointerDown';
import { handlePointerMove } from '../actions/handlePointerMove';
import { handlePointerUp } from '../actions/handlePointerUp';
import { handleWheel } from '../actions/handleWheel';
import { input } from '../actions/input';
import { resize } from '../actions/resize';
import { setCursor } from '../actions/setCursor';
import { setFlowDefinition } from '../actions/setFlowDefinition';
import { setGridMode } from '../actions/setGridMode';
import { setGridSize } from '../actions/setGridSize';
import { setHoverEdge } from '../actions/setHoverEdge';
import { setMeasurement } from '../actions/setMeasurement';
import { setPalette } from '../actions/setPalette';
import { setShapeMode } from '../actions/setShapeMode';
import { setSnapToGrid } from '../actions/setSnapToGrid';
import { setTool } from '../actions/setTool';
import { setUnits } from '../actions/setUnits';
import { showHint } from '../actions/showHint';
import { toggleShapeMode } from '../actions/toggleShapeMode';
import { updatePointer } from '../actions/updatePointer';

export const toolSlice = {
  /** Open the cable editor on a wire (the Wire tool, clicking a wire). */
  openCableEditor(this: EditorStore, connectorId: number): void {
    this.cableEditId = this.schematic.connectors.some((c) => c.id === connectorId) ? connectorId : null;
    this.requestDraw();
    this.emit();
  },

  closeCableEditor(this: EditorStore): void {
    if (this.cableEditId === null) return;
    this.cableEditId = null;
    this.requestDraw();
    this.emit();
  },

  /** Make the open wire a cable (`cable`), or only a line again (null) — flow/cables.ts setConnectorCable. */
  setCable(this: EditorStore, connectorId: number, cable: ConnectorCable | null): boolean {
    return this.editFlow(() => setConnectorCable(this.schematic, connectorId, cable));
  },

  setFlowDefinition(this: EditorStore, id: string): void {
    setFlowDefinition(this, id);
  },

  setHoverEdge(this: EditorStore, id: number | null): void {
    setHoverEdge(this, id);
  },

  /** Replace the host's palette (a `palette` message over the bridge). */
  setPalette(this: EditorStore, palette: Palette | null): void {
    setPalette(this, palette);
  },

  /** Arm a palette item and switch to the Palette tool; null disarms. */
  armPaletteItem(this: EditorStore, id: string | null): void {
    armPaletteItem(this, id);
  },

  setPaletteFit(this: EditorStore, fit: PaletteFit): void {
    this.paletteFit = fit;
    this.emit();
  },

  paletteItem(this: EditorStore): PaletteItem | null {
    if (!this.palette || this.paletteItemId === null) return null;
    return this.palette.items.find((i) => i.id === this.paletteItemId) ?? null;
  },

  setMeasurement(this: EditorStore, text: string | null): void {
    setMeasurement(this, text);
  },

  setCursor(this: EditorStore, cursor: string): void {
    setCursor(this, cursor);
  },

  showHint(this: EditorStore, message: string, durationMs = 5000): void {
    showHint(this, message, durationMs);
  },

  // --------------------------------------------------------------- attachment

  attach(this: EditorStore, canvas: HTMLCanvasElement): () => void {
    return attach(this, canvas);
  },

  resize(this: EditorStore, width: number, height: number): void {
    resize(this, width, height);
  },

  // ------------------------------------------------------------------- input

  canvasPoint(this: EditorStore, e: MouseEvent): Point {
    return canvasPoint(this, e);
  },

  /** Recompute snapped/raw cursor positions and any typed-dimension override. */
  updatePointer(this: EditorStore, e: MouseEvent, screen: Point): void {
    updatePointer(this, e, screen);
  },

  input(this: EditorStore, e: MouseEvent): PointerInput {
    return input(this, e);
  },

  handlePointerMove(this: EditorStore, e: MouseEvent): void {
    handlePointerMove(this, e);
  },

  handlePointerDown(this: EditorStore, e: MouseEvent): void {
    handlePointerDown(this, e);
  },

  handlePointerUp(this: EditorStore, e: MouseEvent): void {
    handlePointerUp(this, e);
  },

  handleDoubleClick(this: EditorStore, e: MouseEvent): void {
    handleDoubleClick(this, e);
  },

  handleWheel(this: EditorStore, e: WheelEvent): void {
    handleWheel(this, e);
  },

  handleKeyDown(this: EditorStore, e: KeyboardEvent): void {
    handleKeyDown(this, e);
  },

  // -------------------------------------------------------------- tool/units

  setTool(this: EditorStore, id: ToolId): void {
    setTool(this, id);
  },

  setUnits(this: EditorStore, units: Units): void {
    setUnits(this, units);
  },

  setGridSize(this: EditorStore, size: number): void {
    setGridSize(this, size);
  },

  setGridMode(this: EditorStore, mode: GridMode): void {
    setGridMode(this, mode);
  },

  setSnapToGrid(this: EditorStore, enabled: boolean): void {
    setSnapToGrid(this, enabled);
  },

  setShapeMode(this: EditorStore, enabled: boolean): void {
    setShapeMode(this, enabled);
  },

  toggleShapeMode(this: EditorStore): void {
    toggleShapeMode(this);
  },
};
