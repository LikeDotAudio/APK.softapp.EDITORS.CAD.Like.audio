// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
/**
 * The editor's single source of truth: the document, the schematic, the
 * viewport, the selection, the undo history and every transient scrap of
 * pointer state the tools read between one event and the next.
 *
 * WHAT IT OWNS
 *   `doc`        the strokes — the vertex graph a DXF is written from
 *   `schematic`  the parts — Flow placements and the connectors between them.
 *                Side by side with `doc` on purpose: a sheet is a sketch that
 *                may also hold parts, and a part is never made of vertices.
 *   `view`       pan and zoom; `selection`; `history`; the live layer table
 *   `api`        the narrow `ToolApi` handed to tools, so a tool never sees
 *                this class
 *
 * WHAT IT MUST NOT DO
 *   Never render inside a React render. The canvas is painted imperatively —
 *   `requestDraw()` schedules a frame — so pointer motion never waits on a
 *   React commit. React reads only `uiSnapshot`, a derived immutable `UiState`
 *   rebuilt by `buildUi()` and published through `useSyncExternalStore`.
 *   Mutating a field without going through `edit()` skips the undo entry and
 *   the version bump the validation cache keys on.
 *
 * THE INVARIANT THE UNDO STACK DEPENDS ON
 *   Every mutation that changes the document goes through `edit(mutate)`,
 *   which snapshots into `history` BEFORE applying and bumps `docVersion`
 *   after. `editFlow()` is the same contract for the schematic. A direct write
 *   to `doc` is invisible to undo and leaves `validationCache` claiming a
 *   result for a version that no longer exists.
 *
 * The body is 94 one-action modules under `actions/`, bound as methods here:
 * a 664-line class is easier to read as a table of contents than as a wall.
 */
import type { Layer, Point, SchematicModel, ToolId, Units, GridMode, ValidationResult } from '../core/types';
import type { ClipboardItem } from './ClipboardItem';
import { ORIGIN } from './origin';
import type { DynUi, UiState } from './UiState';
import type { CalibrationState } from '../image/calibration/CalibrationState';
import { idleCalibration } from '../image/calibration/idleCalibration';
import type { TracingImage } from '../image/TracingImage';
import type { RecentFileEntry } from '../io/recentFiles/RecentFileEntry';
import { DEFAULT_FLOW_DEFINITION } from '../flow/catalog';
import { createSchematic } from '../flow/Schematic';
import { Doc } from '../model/Doc';
import { History } from '../model/history';
import { currentEntrance, type EntranceProfile } from '../shell/entrance';
import { getTool } from '../tools/registry';
import type { AnyTool, PointerInput, ToolApi } from '../tools/types';
import type { Snap } from '../viewport/snap/findSnap';
import { Viewport } from '../viewport/Viewport';




import { addLayer } from './actions/addLayer';
import { applyCalibration } from './actions/applyCalibration';
import { applyLoadedImage } from './actions/applyLoadedImage';
import { attach } from './actions/attach';
import { autoSaveSession } from './actions/autoSaveSession';
import { buildDynUi } from './actions/buildDynUi';
import { buildUi } from './actions/buildUi';
import { cancelBasePointPick } from './actions/cancelBasePointPick';
import { cancelCalibration } from './actions/cancelCalibration';
import { cancelDyn } from './actions/cancelDyn';
import { canvasPoint } from './actions/canvasPoint';
import { captureClipboard } from './actions/captureClipboard';
import { clearAll } from './actions/clearAll';
import { closeDynInput } from './actions/closeDynInput';
import { commitDyn } from './actions/commitDyn';
import { copySelection } from './actions/copySelection';
import { copySelectionWithReference } from './actions/copySelectionWithReference';
import { cutSelection } from './actions/cutSelection';
import { cycleDynMode } from './actions/cycleDynMode';
import { deleteLayer } from './actions/deleteLayer';
import { deleteSelection } from './actions/deleteSelection';
import { deselectAll } from './actions/deselectAll';
import { deselectLayerEntities } from './actions/deselectLayerEntities';
import { dynNumbers } from './actions/dynNumbers';
import { edit } from './actions/edit';
import { editFlow } from './actions/editFlow';
import { emit } from './actions/emit';
import { explodeSelection } from './actions/explodeSelection';
import { fileBigPicture } from './actions/fileBigPicture';
import { exportDxf } from './actions/exportDxf';
import { finishBasePointPick } from './actions/finishBasePointPick';
import { flipHorizontalSelection } from './actions/flipHorizontalSelection';
import { flipVerticalSelection } from './actions/flipVerticalSelection';
import { groupSelection } from './actions/groupSelection';
import { handleCalibrationClick } from './actions/handleCalibrationClick';
import { handleDoubleClick } from './actions/handleDoubleClick';
import { handleKeyDown } from './actions/handleKeyDown';
import { handlePointerDown } from './actions/handlePointerDown';
import { handlePointerMove } from './actions/handlePointerMove';
import { handlePointerUp } from './actions/handlePointerUp';
import { handleWheel } from './actions/handleWheel';
import { hideAllLayers } from './actions/hideAllLayers';
import { importDxf } from './actions/importDxf';
import { importImage } from './actions/importImage';
import { input } from './actions/input';
import { loadDxfText } from './actions/loadDxfText';
import { loadRecentFile } from './actions/loadRecentFile';
import { loadRecentImage } from './actions/loadRecentImage';
import { lockAllLayers } from './actions/lockAllLayers';
import { markDocChanged } from './actions/markDocChanged';
import { openBigPicture } from './actions/openBigPicture';
import { openDynInput } from './actions/openDynInput';
import { pasteClipboard } from './actions/pasteClipboard';
import { removeImage } from './actions/removeImage';
import { renameLayer } from './actions/renameLayer';
import { render } from './actions/render';
import { requestDraw } from './actions/requestDraw';
import { resize } from './actions/resize';
import { resolveDyn } from './actions/resolveDyn';
import { restoreBrowserSession } from './actions/restoreBrowserSession';
import { rotateSelectionPrompt } from './actions/rotateSelectionPrompt';
import { scaleSelectionPrompt } from './actions/scaleSelectionPrompt';
import { selectAll } from './actions/selectAll';
import { selectLayerEntities } from './actions/selectLayerEntities';
import { setActiveLayer } from './actions/setActiveLayer';
import { setCursor } from './actions/setCursor';
import { setDynValue } from './actions/setDynValue';
import { setFlowDefinition } from './actions/setFlowDefinition';
import { setGridMode } from './actions/setGridMode';
import { setGridSize } from './actions/setGridSize';
import { setHoverEdge } from './actions/setHoverEdge';
import { setImageOpacity } from './actions/setImageOpacity';
import { setImageWorldWidth } from './actions/setImageWorldWidth';
import { setLayerColor } from './actions/setLayerColor';
import { setMeasurement } from './actions/setMeasurement';
import { setSelectionLayer } from './actions/setSelectionLayer';
import { setSelectionProtected } from './actions/setSelectionProtected';
import { setShapeMode } from './actions/setShapeMode';
import { setSnapToGrid } from './actions/setSnapToGrid';
import { setTool } from './actions/setTool';
import { setUnits } from './actions/setUnits';
import { showAllLayers } from './actions/showAllLayers';
import { showHint } from './actions/showHint';
import { showOnlyActiveLayer } from './actions/showOnlyActiveLayer';
import { startCalibration } from './actions/startCalibration';
import { toggleImageVisible } from './actions/toggleImageVisible';
import { toggleLayerLock } from './actions/toggleLayerLock';
import { toggleLayerVisibility } from './actions/toggleLayerVisibility';
import { toggleShapeMode } from './actions/toggleShapeMode';
import { undo } from './actions/undo';
import { unlockAllLayers } from './actions/unlockAllLayers';
import { updatePointer } from './actions/updatePointer';
import { validation } from './actions/validation';
import { zoomIn } from './actions/zoomIn';
import { zoomOut } from './actions/zoomOut';
import { zoomToFit } from './actions/zoomToFit';

export type { ClipboardItem } from './ClipboardItem';
export type { DynFieldUi, DynUi, FlowUi, TracingUi, UiState } from './UiState';

export class EditorStore {
  readonly doc = new Doc();
  /**
   * The things on the sheet, as opposed to the strokes: Flow block placements
   * and the connectors between them. Geometry and schematic sit side by side
   * on purpose - a sheet is a sketch that may also hold parts, and a part is
   * never made of the vertex graph.
   */
  readonly schematic: SchematicModel = createSchematic();
  /** Which catalogue symbol the Flow tool places next. */
  flowDefinitionId: string = DEFAULT_FLOW_DEFINITION;
  /**
   * How this window stands with 06a's filed sheet — `APK:OS/system/big-picture.json`.
   * `digest` is what the last read or write saw on disk and is what the next
   * save has to quote back; a save that cannot quote it is refused rather than
   * landing on somebody else's drawing.
   */
  bigPicture: {
    /** Whether an APK:OS server answered at all. False on apk.audio. */
    reachable: boolean;
    digest: string | null;
    savedAt: string | null;
    /** Whether a file exists yet. A sheet nobody has ever saved is not filed. */
    filed: boolean;
    /** Changed since the last read or write. */
    dirty: boolean;
    /** The last refusal, kept so the panel can show it after the hint fades. */
    message: string | null;
  } = { reachable: false, digest: null, savedAt: null, filed: false, dirty: false, message: null };
  readonly view = new Viewport();
  readonly selection = new Set<number>();
  readonly history = new History();

  canvas: HTMLCanvasElement | null = null;
  ctx: CanvasRenderingContext2D | null = null;

  /** Which desktop tile opened this window; it decides the opening tool and hint. */
  readonly entrance: EntranceProfile;
  toolId: ToolId;
  tool: AnyTool;
  toolState: object;

  units: Units = 'in';
  gridSize = 0.25;
  gridMode: GridMode = 'lines';
  snapToGrid = true;

  layers: Map<string, Layer> = new Map([
    ['0', { id: '0', name: '0', color: '#ffffff', dxfColorIndex: 7, visible: true }],
  ]);
  activeLayerId = '0';

  hoverId: number | null = null;
  snap: Snap | null = null;
  pointer = { world: ORIGIN, rawWorld: ORIGIN, screen: ORIGIN };

  panning = false;
  panStart = ORIGIN;
  panOrigin = ORIGIN;
  spaceDown = false;

  tracing: TracingImage | null = null;
  imageDrag: { startScreen: Point; startPos: Point } | null = null;

  calibration: CalibrationState = idleCalibration();
  calibrationBox: Point | null = null;

  hintText = '';
  hintVisible = false;
  hintTimer: ReturnType<typeof setTimeout> | null = null;
  measurement: string | null = null;

  /** Snapped cursor before any typed dimension override — the dyn box's reference. */
  dynCursor: Point = ORIGIN;
  dynAnchor: Point | null = null;
  dynValues: Record<string, string> = {};
  dynMode = '';

  docVersion = 0;
  validationCache: { version: number; result: ValidationResult } | null = null;
  shapeMode = false;
  clipboard: ClipboardItem[] = [];
  /** Set between Ctrl+Shift+C and the click that names the reference point. */
  pickingBasePoint = false;

  frameHandle = 0;
  listeners = new Set<() => void>();
  uiSnapshot: UiState;

  readonly api: ToolApi;

  constructor(entrance: EntranceProfile = currentEntrance()) {
    this.entrance = entrance;
    this.toolId = entrance.initialTool;
    this.tool = getTool(this.toolId);
    this.toolState = this.tool.createState();

    // `units` and `gridSize` are getters so tools always read live values.
    const store = this;
    this.api = {
      doc: this.doc,
      view: this.view,
      selection: this.selection,
      get units() {
        return store.units;
      },
      get gridSize() {
        return store.gridSize;
      },
      get activeLayerId() {
        return store.activeLayerId;
      },
      edit: (mutate) => this.edit(mutate),
      schematic: this.schematic,
      get flowDefinitionId() {
        return store.flowDefinitionId;
      },
      editFlow: (mutate) => this.editFlow(mutate),
      showHint: (msg, dur) => this.showHint(msg, dur),
      setHoverEdge: (id) => this.setHoverEdge(id),
      setMeasurement: (text) => this.setMeasurement(text),
      setCursor: (cursor) => this.setCursor(cursor),
      openDynInput: (anchor) => this.openDynInput(anchor),
      closeDynInput: () => this.closeDynInput(),
      redraw: () => {
        this.requestDraw();
        this.emit();
      },
    };
    this.uiSnapshot = this.buildUi();
    /* The browser's working copy first, then the filed sheet on top of it. In
       that order deliberately: the file is the record, and `openBigPicture`
       declines to overwrite a session with an empty one. */
    void this.restoreBrowserSession().then(() => this.openBigPicture());
    this.showHint(entrance.hint, 8000);
  }

  // ------------------------------------------------------------- subscription

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = (): UiState => this.uiSnapshot;

  emit(): void {
    emit(this);
  }

  buildUi(): UiState {
    return buildUi(this);
  }

  // --------------------------------------------------------------- validation

  autoSaveTimer: ReturnType<typeof setTimeout> | null = null;

  markDocChanged(): void {
    markDocChanged(this);
  }

  async autoSaveSession(): Promise<void> {
    return await autoSaveSession(this);
  }

  async restoreBrowserSession(): Promise<void> {
    return await restoreBrowserSession(this);
  }

  /** Read 06a's filed sheet onto this canvas. */
  async openBigPicture(): Promise<void> {
    return await openBigPicture(this);
  }

  /** Write this canvas to 06a's filed sheet. Explicit; never on a timer. */
  async fileBigPicture(): Promise<void> {
    return await fileBigPicture(this);
  }

  validation(): ValidationResult {
    return validation(this);
  }

  // ------------------------------------------------------------------ drawing

  requestDraw(): void {
    requestDraw(this);
  }

  render(): void {
    render(this);
  }

  // ------------------------------------------------------------------ tool api

  edit(mutate: () => boolean): void {
    edit(this, mutate);
  }

  editFlow(mutate: () => boolean): boolean {
    return editFlow(this, mutate);
  }

  setFlowDefinition(id: string): void {
    setFlowDefinition(this, id);
  }

  setHoverEdge(id: number | null): void {
    setHoverEdge(this, id);
  }

  setMeasurement(text: string | null): void {
    setMeasurement(this, text);
  }

  setCursor(cursor: string): void {
    setCursor(this, cursor);
  }

  showHint(message: string, durationMs = 5000): void {
    showHint(this, message, durationMs);
  }

  // --------------------------------------------------------------- attachment

  attach(canvas: HTMLCanvasElement): () => void {
    return attach(this, canvas);
  }

  resize(width: number, height: number): void {
    resize(this, width, height);
  }

  // ------------------------------------------------------------------- input

  canvasPoint(e: MouseEvent): Point {
    return canvasPoint(this, e);
  }

  /** Recompute snapped/raw cursor positions and any typed-dimension override. */
  updatePointer(e: MouseEvent, screen: Point): void {
    updatePointer(this, e, screen);
  }

  input(e: MouseEvent): PointerInput {
    return input(this, e);
  }

  handlePointerMove(e: MouseEvent): void {
    handlePointerMove(this, e);
  }

  handlePointerDown(e: MouseEvent): void {
    handlePointerDown(this, e);
  }

  handlePointerUp(e: MouseEvent): void {
    handlePointerUp(this, e);
  }

  handleDoubleClick(e: MouseEvent): void {
    handleDoubleClick(this, e);
  }

  handleWheel(e: WheelEvent): void {
    handleWheel(this, e);
  }

  handleKeyDown(e: KeyboardEvent): void {
    handleKeyDown(this, e);
  }

  // -------------------------------------------------------------- tool/units

  setTool(id: ToolId): void {
    setTool(this, id);
  }

  setUnits(units: Units): void {
    setUnits(this, units);
  }

  setGridSize(size: number): void {
    setGridSize(this, size);
  }

  setGridMode(mode: GridMode): void {
    setGridMode(this, mode);
  }

  setSnapToGrid(enabled: boolean): void {
    setSnapToGrid(this, enabled);
  }

  setShapeMode(enabled: boolean): void {
    setShapeMode(this, enabled);
  }

  toggleShapeMode(): void {
    toggleShapeMode(this);
  }

  // ----------------------------------------------------------------- editing

  selectAll(): void {
    selectAll(this);
  }

  deselectAll(): void {
    deselectAll(this);
  }

  copySelection(): void {
    copySelection(this);
  }

  /**
   * AutoCAD-style copy with base point: the next click names the reference point,
   * and paste puts that exact point under the cursor instead of the bbox centre.
   */
  copySelectionWithReference(): void {
    copySelectionWithReference(this);
  }

  cancelBasePointPick(): void {
    cancelBasePointPick(this);
  }

  finishBasePointPick(): void {
    finishBasePointPick(this);
  }

  /** Store the selection in the clipboard, relative to the given world origin. */
  captureClipboard(cx: number, cy: number): number {
    return captureClipboard(this, cx, cy);
  }

  cutSelection(): void {
    cutSelection(this);
  }

  pasteClipboard(): void {
    pasteClipboard(this);
  }

  deleteSelection(): void {
    deleteSelection(this);
  }

  undo(): void {
    undo(this);
  }

  clearAll(): void {
    clearAll(this);
  }

  rotateSelectionPrompt(): void {
    rotateSelectionPrompt(this);
  }

  scaleSelectionPrompt(): void {
    scaleSelectionPrompt(this);
  }

  flipHorizontalSelection(): void {
    flipHorizontalSelection(this);
  }

  flipVerticalSelection(): void {
    flipVerticalSelection(this);
  }

  groupSelection(): void {
    groupSelection(this);
  }

  explodeSelection(): void {
    explodeSelection(this);
  }

  async exportDxf(): Promise<void> {
    return await exportDxf(this);
  }

  async importDxf(file: File): Promise<void> {
    return await importDxf(this, file);
  }

  async loadDxfText(text: string,
    filename = 'drawing.dxf',
    sourceUnit?: Units,
    targetUnit?: Units,): Promise<void> {
    return await loadDxfText(this, text, filename, sourceUnit, targetUnit);
  }

  zoomToFit(): void {
    zoomToFit(this);
  }

  zoomIn(): void {
    zoomIn(this);
  }

  zoomOut(): void {
    zoomOut(this);
  }

  // ------------------------------------------------------------------- layers

  setActiveLayer(id: string): void {
    setActiveLayer(this, id);
  }

  addLayer(name: string, color = '#3b82f6'): void {
    addLayer(this, name, color);
  }

  toggleLayerVisibility(id: string): void {
    toggleLayerVisibility(this, id);
  }

  toggleLayerLock(id: string): void {
    toggleLayerLock(this, id);
  }

  showOnlyActiveLayer(): void {
    showOnlyActiveLayer(this);
  }

  showAllLayers(): void {
    showAllLayers(this);
  }

  hideAllLayers(): void {
    hideAllLayers(this);
  }

  lockAllLayers(): void {
    lockAllLayers(this);
  }

  unlockAllLayers(): void {
    unlockAllLayers(this);
  }

  deleteLayer(id: string): void {
    deleteLayer(this, id);
  }

  selectLayerEntities(id: string): void {
    selectLayerEntities(this, id);
  }

  deselectLayerEntities(id: string): void {
    deselectLayerEntities(this, id);
  }

  setLayerColor(id: string, color: string): void {
    setLayerColor(this, id, color);
  }

  renameLayer(id: string, newName: string): void {
    renameLayer(this, id, newName);
  }

  setSelectionLayer(layerId: string): void {
    setSelectionLayer(this, layerId);
  }

  setSelectionProtected(isProtected: boolean): void {
    setSelectionProtected(this, isProtected);
  }

  // ------------------------------------------------------------------- image

  async importImage(file: File): Promise<void> {
    return await importImage(this, file);
  }

  async loadRecentImage(dataUrl: string): Promise<void> {
    return await loadRecentImage(this, dataUrl);
  }

  applyLoadedImage(img: HTMLImageElement): void {
    applyLoadedImage(this, img);
  }

  async loadRecentFile(entry: RecentFileEntry): Promise<void> {
    return await loadRecentFile(this, entry);
  }

  removeImage(): void {
    removeImage(this);
  }

  toggleImageVisible(): void {
    toggleImageVisible(this);
  }

  setImageOpacity(opacity: number): void {
    setImageOpacity(this, opacity);
  }

  setImageWorldWidth(width: number): void {
    setImageWorldWidth(this, width);
  }

  // ------------------------------------------------------------- calibration

  startCalibration(): void {
    startCalibration(this);
  }

  cancelCalibration(): void {
    cancelCalibration(this);
  }

  handleCalibrationClick(screen: Point): void {
    handleCalibrationClick(this, screen);
  }

  /** Rescale everything so the two picked points are `distance` units apart. */
  applyCalibration(distance: number): boolean {
    return applyCalibration(this, distance);
  }

  // --------------------------------------------------------- type-to-size box

  openDynInput(anchor: Point): void {
    openDynInput(this, anchor);
  }

  closeDynInput(): void {
    closeDynInput(this);
  }

  dynNumbers(): Record<string, number | null> {
    return dynNumbers(this);
  }

  /** The end point implied by whatever is typed, or null when nothing usable is. */
  resolveDyn(): Point | null {
    return resolveDyn(this);
  }

  buildDynUi(): DynUi | null {
    return buildDynUi(this);
  }

  setDynValue(key: string, raw: string): void {
    setDynValue(this, key, raw);
  }

  cycleDynMode(): void {
    cycleDynMode(this);
  }

  /** Enter in the dyn box: finish the shape at the typed size. */
  commitDyn(): void {
    commitDyn(this);
  }

  cancelDyn(): void {
    cancelDyn(this);
  }
}
