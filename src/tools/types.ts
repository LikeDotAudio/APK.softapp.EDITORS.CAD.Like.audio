// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { ReactNode } from 'react';
import type { Point, SchematicModel, ToolId, Units } from '../core/types';
import type { Doc } from '../model/Doc';
import type { Scene } from '../render/Scene';
import type { Viewport } from '../viewport/Viewport';

/** A pointer event, resolved into every coordinate space a tool might want. */
export interface PointerInput {
  /** Snapped world position — already overridden by typed dimensions if any. */
  world: Point;
  /** Raw, unsnapped world position. */
  rawWorld: Point;
  /** Canvas-relative pixel position. */
  screen: Point;
  /** Browser client pixel position, for anchoring DOM overlays. */
  client: Point;
  shiftKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
}

/** The slice of the editor a tool is allowed to touch. */
export interface ToolApi {
  readonly doc: Doc;
  readonly view: Viewport;
  readonly units: Units;
  readonly gridSize: number;
  readonly activeLayerId: string;
  /** Live selection set — tools may mutate it directly. */
  readonly selection: Set<number>;
  /**
   * Run a geometry mutation. A snapshot is taken first and pushed onto the
   * undo stack only when `mutate` reports that it changed something.
   */
  edit(mutate: () => boolean): void;
  /**
   * The things on the sheet. Live, and mutated through `editFlow` for the same
   * reason geometry is mutated through `edit`: one place redraws and notifies.
   */
  readonly schematic: SchematicModel;
  /** Which catalogue symbol the Flow tool places. Set from the sidebar. */
  readonly flowDefinitionId: string;
  /**
   * Run a schematic mutation and repaint if it changed something. Deliberately
   * NOT on the undo stack yet: `History` snapshots `Doc`, and putting the
   * schematic in that snapshot is a change to the session format as well.
   */
  editFlow(mutate: () => boolean): boolean;
  showHint(message: string, durationMs?: number): void;
  setHoverEdge(id: number | null): void;
  /** Status-bar measurement readout; null hides it. */
  setMeasurement(text: string | null): void;
  setCursor(cursor: string): void;
  /** Show the type-to-size box anchored at a client-space point. */
  openDynInput(anchor: Point): void;
  closeDynInput(): void;
  redraw(): void;
}

export type DynValues = Record<string, number | null>;

export interface DynField {
  key: string;
  label: string;
}

/**
 * Type-to-size support. While a shape is being dragged out, the tool can offer
 * numeric fields; whatever is typed overrides the cursor position, so the
 * normal preview and commit paths keep working untouched.
 */
export interface DynDescriptor<S> {
  fields(state: S): DynField[];
  /** Optional cycling toggle, e.g. radius vs diameter. First entry is the default. */
  modes?: readonly string[];
  modeLabel?(mode: string): string;
  placeholder(state: S, key: string, mode: string, cursor: Point, units: Units): string;
  /** Effective end point implied by the typed values, or null if none is usable. */
  resolve(state: S, values: DynValues, mode: string, cursor: Point): Point | null;
  /** Finish the shape at the resolved point. */
  commit(state: S, point: Point, api: ToolApi): void;
}

export interface Tool<S extends object = object> {
  id: ToolId;
  label: string;
  /** Single-key shortcut. */
  shortcut: string;
  /** Tooltip text for the toolbar button. */
  title: string;
  /** Message shown in the hint bubble when the tool is selected. */
  hint: string;
  icon: ReactNode;
  cursor: string;
  /** Drawing tools snap the cursor; select and break work on raw coordinates. */
  snaps: boolean;
  /** Whether to draw the snap marker. Defaults to `snaps`. */
  showsSnapIndicator?: boolean;

  createState(): S;
  /** True while a shape is mid-construction — drives the type-to-size box. */
  isDrawing?(state: S): boolean;
  /** Reference point for Shift-constrained (ortho) movement, if the tool has one. */
  orthoRef?(state: S): Point | null;
  /**
   * Convert any in-progress coordinates when the drawing is rescaled (a unit
   * switch), so a half-drawn shape survives the change.
   */
  scaleState?(state: S, factor: number): void;

  onPointerDown?(state: S, input: PointerInput, api: ToolApi): void;
  onPointerMove?(state: S, input: PointerInput, api: ToolApi): void;
  onPointerUp?(state: S, input: PointerInput, api: ToolApi): void;
  onDoubleClick?(state: S, input: PointerInput, api: ToolApi): void;
  onEscape?(state: S, api: ToolApi): void;
  onDelete?(state: S, api: ToolApi): void;

  drawPreview?(state: S, scene: Scene): void;
  dyn?: DynDescriptor<S>;
}

/** Registry entries erase the state type; only the owning tool ever reads it. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyTool = Tool<any>;
