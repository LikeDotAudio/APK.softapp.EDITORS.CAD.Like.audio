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
 * The methods are in slices/ by area (tool API and input, editing, files,
 * layers, image and the dyn box), bound onto the class at the foot of this file.
 */
import { refreshBimDefinitions } from './actions/refreshBimDefinitions';
import { installFlyClick, toggleFlyOfPicked } from './actions/flyClick';
import type { CadSpace, CadViewport, Layer, Point, SchematicModel, ToolId, Units, GridMode, ValidationResult } from '../core/types';
import { generateUuid } from '../core/generateUuid';
import { DEFAULT_VIRTUAL_MIRROR, type VirtualMirrorState } from '../core/mirror';
import type { UserAuth, UserStatus } from '../core/userAuth';
import { createUserAuth } from '../core/userAuth';
import { discoverViewports } from '../viewport/discoverViewports';
import type { ClipboardItem } from './ClipboardItem';
import { ORIGIN } from './origin';
import type { UiState, LoadingUi } from './UiState';
import type { CalibrationState } from '../image/calibration/CalibrationState';
import { idleCalibration } from '../image/calibration/idleCalibration';
import type { TracingImage } from '../image/TracingImage';
import { DEFAULT_FLOW_DEFINITION } from '../flow/concepts';
import { createSchematic } from '../flow/Schematic';
import { Doc } from '../model/Doc';
import type { Palette, PaletteFit } from '../model/palette/PaletteItem';
import { History } from '../model/history';
import { currentEntrance, resumeFromHash, type EntranceProfile } from '../shell/entrance';
import { getTool } from '../tools/registry';
import type { AnyTool, ToolApi } from '../tools/types';
import type { Snap } from '../viewport/snap/findSnap';
import { Viewport } from '../viewport/Viewport';
import { toolSlice } from './slices/toolSlice';
import { editingSlice } from './slices/editingSlice';
import { fileSlice } from './slices/fileSlice';
import { layerSlice } from './slices/layerSlice';
import { imageSlice } from './slices/imageSlice';

import { autoSaveSession } from './actions/autoSaveSession';
import { buildUi } from './actions/buildUi';
import { edit } from './actions/edit';
import { editFlow } from './actions/editFlow';
import { emit } from './actions/emit';
import { fileBigPicture } from './actions/fileBigPicture';
import { markDocChanged } from './actions/markDocChanged';
import { openBigPicture } from './actions/openBigPicture';
import { render } from './actions/render';
import { requestDraw } from './actions/requestDraw';
import { restoreBrowserSession } from './actions/restoreBrowserSession';
import { resumeFromHost } from '../shell/hostBridge/hostBridge';
import { MM_PER_INCH } from '../model/units/mmPerUnit';
import { validation } from './actions/validation';
import { zoomIn } from './actions/zoomIn';
import { zoomOut } from './actions/zoomOut';
import { setZoom } from './actions/setZoom';
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
   * The host's material palette (model/palette) — null until a softapp sends
   * one over the bridge. Not part of the drawing: it is the host's catalogue,
   * resent whenever the host likes, and only what was placed from it is saved.
   */
  palette: Palette | null = null;
  /** Which palette item the Palette tool paints or places next. */
  paletteItemId: string | null = null;
  /**
   * What a product does when it is clicked: `place` one block at true size
   * where the click is; `fill` paint the region the click is in with it;
   * `tile` lay blocks at true size across that region, as many as fit whole.
   */
  paletteFit: PaletteFit = 'place';
  /** The wire the cable editor is open on (components/CableEditor.tsx), else null. */
  cableEditId: number | null = null;
  /**
   * How this window stands with 06a's filed sheet — `big-picture.ifc` on APK:OS (big-picture@2).
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

  /**
   * How lengths are shown and typed: mm unless a session or the person says
   * otherwise (ROAD-3598 answer 13 — mm is the site's unit, as host@1 already
   * states). The drawing itself is in mm, always (cad-1, docUnits.ts).
   */
  units: Units = 'mm';
  /** Grid spacing, mm. */
  gridSize = 10;
  gridMode: GridMode = 'lines';
  snapToGrid = true;
  /** Text rendered at a fixed screen size when true, or true CAD world scale when false (default). */
  fixedTextSize = false;
  /** Name of the currently loaded file, or null if untitled / closed. */
  /** Name of the currently loaded file, or null if untitled / closed. */
  currentFileName: string | null = null;
  /** Current user identity, authorization status, and cryptographic signature. */
  currentUserAuth: UserAuth | null = null;

  async setUserAuth(username: string, status: UserStatus = 'allowed'): Promise<UserAuth> {
    const auth = await createUserAuth(username, status);
    this.currentUserAuth = auth;
    this.emit();
    return auth;
  }

  layers: Map<string, Layer> = new Map([
    ['0', { id: '0', name: '0', color: '#ffffff', dxfColorIndex: 7, visible: true }],
  ]);
  activeLayerId = '0';
  viewports: CadViewport[] = [];
  /** The sheets found in the drawing (discoverViewports) and the spaces a host named (setHostSpaces); `viewports` is both, the host's first. */
  private discovered: CadViewport[] = [];
  private hostSpaces: CadViewport[] = [];
  activeViewportId = 'ALL';

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

  /** Virtual Mirror for Symmetrical CAD Mode. */
  mirror: VirtualMirrorState = { ...DEFAULT_VIRTUAL_MIRROR };

  /** The drawing's persistent key: every GlobalId of its .ifc twin derives from it (src/io/ifc, cad-3). */
  docKey: string = generateUuid();
  /** Rooms the user declared (cad-4), saved with the session: each one IfcSpace. */
  spaces: CadSpace[] = [];

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

  /** Hook registered by the UI to open the native DXF file picker. */
  openFilePicker: (() => void) | null = null;
  /** Hook registered by the UI to open the Block Editor modal. */
  openBlockEditorModal: ((blockName?: string) => void) | null = null;
  /** Hook registered by the UI to open the Softapp Block Bridge modal. */
  openSoftappBridgeModal: ((blockName?: string, defaultAppId?: string) => void) | null = null;
  /** Hook registered by the UI to open the Part & Concept Library modal. */
  openLibrarySash: (() => void) | null = null;
  /** Hook registered by the UI to open the Startup / Welcome modal. */
  openStartupModal: (() => void) | null = null;
  /** Active loading / caching state for modal loading screen. */
  loading: LoadingUi | null = null;

  readonly api: ToolApi;

  constructor(entrance: EntranceProfile = currentEntrance()) {
    this.entrance = entrance;
    // read live: `layers` is replaced when a session or a DXF is opened
    this.doc.layerHidden = (layerId) => this.layers.get(layerId)?.visible === false;
    this.toolId = entrance.initialTool;
    this.tool = getTool(this.toolId);
    this.toolState = this.tool.createState();
    // the view's zoom is px per mm: the opening sheet shows an inch as 80 px, as it always has
    this.view.zoom = 80 / MM_PER_INCH;

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
      get paletteItem() {
        return store.paletteItem();
      },
      get paletteFit() {
        return store.paletteFit;
      },
      showHint: (msg, dur) => this.showHint(msg, dur),
      setHoverEdge: (id) => this.setHoverEdge(id),
      setMeasurement: (text) => this.setMeasurement(text),
      setCursor: (cursor) => this.setCursor(cursor),
      openDynInput: (anchor) => this.openDynInput(anchor),
      closeDynInput: () => this.closeDynInput(),
      openCableEditor: (id) => this.openCableEditor(id),
      redraw: () => {
        this.requestDraw();
        this.emit();
      },
      get mirror() {
        return store.mirror;
      },
      setVirtualMirror: (x, enabled, selected) => this.setVirtualMirror(x, enabled, selected),
      selectVirtualMirror: (selected) => this.selectVirtualMirror(selected),
      toggleSymmetryMode: () => this.toggleSymmetryMode(),
      reflectSelectionAcrossMirror: () => this.reflectSelectionAcrossMirror(),
      mirrorAnotherMirror: () => this.mirrorAnotherMirror(),
    };
    this.uiSnapshot = this.buildUi();
    /* The browser's working copy first, then the filed sheet on top of it.
       For Big Picture (the bench model), restore automatically.
       For CAD / Drawing, the StartupModal prompts the user on startup —
       unless a host moved us between its iframe and a window (`&resume`). */
    if (this.entrance.entrance === 'big-picture') {
      void this.restoreBrowserSession().then(() => this.openBigPicture()).then(() => refreshBimDefinitions(this));
    }
    if (typeof window !== 'undefined' && resumeFromHash(window.location.hash)) void resumeFromHost(this, window.location.hash);
    installFlyClick(this);   // a click on a fly-off / fly-on capsule goes to its far end (flow/fly.ts)
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

  async autoSaveSession(forceLoadingScreen = false): Promise<void> {
    return await autoSaveSession(this, forceLoadingScreen);
  }

  async restoreBrowserSession(): Promise<void> {
    await restoreBrowserSession(this);
    void refreshBimDefinitions(this);   // BIM blocks saved before connectors + top hats catch up
  }

  /** Read 06a's filed sheet onto this canvas. */
  async openBigPicture(): Promise<void> {
    return await openBigPicture(this);
  }

  /** Modify › the picked blocks' wires as fly-off / fly-on pairs, or lines again (flow/fly.ts). */
  toggleFlyOfPicked(): void {
    toggleFlyOfPicked(this);
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

  zoomToFit(): void {
    zoomToFit(this);
  }

  setActiveViewport(id: string): void {
    this.activeViewportId = id;
    if (id === 'ALL') {
      this.zoomToFit();
    } else {
      const vp = this.viewports.find((v) => v.id === id);
      if (vp) {
        this.view.zoomToFit(vp.bounds);
        // a host's spaces share one scale — the one that fits the largest — so a metre is the same size in each
        if (vp.host && !vp.fitOwn) {
          const z = this.hostScale();
          if (z) {
            const cx = (vp.bounds.x1 + vp.bounds.x2) / 2;
            const cy = (vp.bounds.y1 + vp.bounds.y2) / 2;
            this.view.zoom = z;
            this.view.panX = this.view.width / 2 - cx * z;
            this.view.panY = this.view.height / 2 + cy * z;
          }
        }
        this.requestDraw();
        this.emit();
      }
    }
  }

  /** The zoom every host space opens at: the largest fitted, so all of them fit. Null with none or no size yet. */
  hostScale(): number | null {
    const w = this.view.width;
    const h = this.view.height;
    const shared = this.hostSpaces.filter((v) => !v.fitOwn);
    if (!w || !h || !shared.length) return null;
    return Math.min(...shared.map((v) => Math.min((w * 0.8) / Math.max(1e-9, v.bounds.x2 - v.bounds.x1), (h * 0.8) / Math.max(1e-9, v.bounds.y2 - v.bounds.y1))));
  }

  discoverViewports(): void {
    this.discovered = discoverViewports(this.doc);
    this.viewports = [...this.hostSpaces, ...this.discovered];
    this.emit();
  }

  /** The drawing is gone (cleared, closed): its sheets go, the host's spaces stay until it names others. */
  forgetSheets(): void {
    this.discovered = [];
    this.viewports = [...this.hostSpaces];
  }

  /** A host's drawings as model spaces of their own, in front of the sheets found in the drawing. */
  setHostSpaces(spaces: CadViewport[]): void {
    this.hostSpaces = spaces.map((v) => ({ ...v, host: true }));
    this.viewports = [...this.hostSpaces, ...this.discovered];
    if (this.activeViewportId !== 'ALL' && !this.viewports.some((v) => v.id === this.activeViewportId)) this.activeViewportId = 'ALL';
    this.emit();
  }

  zoomIn(): void {
    zoomIn(this);
  }

  zoomOut(): void {
    zoomOut(this);
  }

  setZoom(zoom: number): void {
    setZoom(this, zoom);
  }
}

/* The rest of the store's methods live in slices/ (one object of methods per area, `this` = the store) and are
   bound onto the prototype here, as the class's own methods would be: same names, non-enumerable. The interface
   below merges them into the class's type, so `store.setTool(…)` reads exactly as it did. */
type Bound<T> = { [K in keyof T]: OmitThisParameter<T[K]> };
const SLICES = [toolSlice, editingSlice, fileSlice, layerSlice, imageSlice] as const;
export interface EditorStore
  extends Bound<typeof toolSlice>, Bound<typeof editingSlice>, Bound<typeof fileSlice>, Bound<typeof layerSlice>, Bound<typeof imageSlice> {}
for (const slice of SLICES) {
  for (const [key, d] of Object.entries(Object.getOwnPropertyDescriptors(slice))) {
    Object.defineProperty(EditorStore.prototype, key, { ...d, enumerable: false });
  }
}
