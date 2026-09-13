// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
/**
 * The immutable snapshot React is allowed to see.
 *
 * `EditorStore` is mutable and is written from pointer and keyboard handlers
 * at input rate. Nothing in `components/` may read it directly: it reads THIS,
 * rebuilt by `EditorStore.buildUi()` and published through
 * `useSyncExternalStore`, so a render is always a consistent picture of one
 * moment rather than a mixture of two.
 *
 * That makes this file the contract between the two halves of the app. Adding
 * a field here is a promise that `buildUi()` fills it on every rebuild; a
 * field a component needs and this interface does not carry is the signal that
 * the component is reaching into the store.
 *
 * Everything here must be cheap to construct — it is rebuilt on every emit.
 */
import type { Layer, Point, ToolId, Units, GridMode, ValidationResult } from '../core/types';

export interface DynFieldUi {
  key: string;
  label: string;
  placeholder: string;
  value: string;
}

export interface DynUi {
  /** Client-space point the box is positioned near. */
  anchor: Point;
  fields: DynFieldUi[];
  /** Current mode when the tool offers a toggle (circle radius vs diameter). */
  mode: string | null;
  modeLabel: string | null;
}

/** What the Flow panel and the status bar need to say about the schematic. */
export interface FlowUi {
  definitionId: string;
  placements: number;
  connectors: number;
  groups: number;
}

/**
 * One row of the group tree, FLATTENED with a depth on it rather than nested.
 *
 * A nested shape would make the panel render recursively, and every row it can
 * draw is one row — a name, a count, a couple of buttons. Flat with a depth is
 * the same information, renders as a `map`, and cannot blow the stack on a
 * malformed tree, which a component reading a model straight off disk can meet.
 */
export interface GroupRowUi {
  id: number;
  name: string;
  /** Levels from the root. Drives the indent, nothing else. */
  depth: number;
  /** Placements this group holds directly. */
  members: number;
  /** Placements it holds at any depth — what the box on the sheet encloses. */
  held: number;
  children: number;
  collapsed: boolean;
  /** What it stands for outside the drawing, if it was seeded from something. */
  source: { kind: string; id: string } | null;
}

/** How this window stands with 06a's filed sheet. */
export interface BigPictureUi {
  reachable: boolean;
  filed: boolean;
  dirty: boolean;
  savedAt: string | null;
  message: string | null;
}

export interface TracingUi {
  visible: boolean;
  opacity: number;
  worldWidth: number;
}

/** The immutable view of editor state that React components render from. */
export interface UiState {
  toolId: ToolId;
  units: Units;
  gridSize: number;
  gridMode: GridMode;
  snapToGrid: boolean;
  cursor: Point;
  edgeCount: number;
  validation: ValidationResult;
  shapeMode: boolean;
  canExport: boolean;
  hint: { text: string; visible: boolean };
  measurement: string | null;
  tracing: TracingUi | null;
  calibrationActive: boolean;
  /** Canvas-space anchor for the "enter real distance" dialog. */
  calibrationBox: Point | null;
  dyn: DynUi | null;
  layers: Layer[];
  activeLayerId: string;
  selectionSize: number;
  selectionProtected: boolean;
  flow: FlowUi;
  /** The group tree, roots first, each parent immediately before its children. */
  groups: GroupRowUi[];
  bigPicture: BigPictureUi;
}
