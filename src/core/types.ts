// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
/** Shared domain types for the drawing board. */

export type Units = 'in' | 'mm' | 'cm' | 'm' | 'ft';
export type GridMode = 'lines' | 'dots' | 'off';


export interface Point {
  x: number;
  y: number;
}

export interface Vertex extends Point {
  id: number;
}

export interface BBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface Layer {
  id: string;
  name: string;
  color: string; // Hex color e.g. '#3b82f6'
  dxfColorIndex?: number; // AutoCAD Color Index (ACI 1-255)
  visible: boolean;
  locked?: boolean;
}

interface EdgeBase {
  id: number;
  /** Start vertex id. */
  v1: number;
  /** End vertex id. */
  v2: number;
  /** Id of the drawing operation that produced this edge (0 = none). */
  groupId: number;
  /** Layer identifier (defaults to '0'). */
  layerId: string;
  /** Whether this edge is protected (locked & read-only). */
  protected?: boolean;
}

export interface LineEdge extends EdgeBase {
  type: 'line';
}

/** An arc always runs counter-clockwise from `v1` to `v2` about (cx, cy). */
export interface ArcEdge extends EdgeBase {
  type: 'arc';
  cx: number;
  cy: number;
  r: number;
}

export type Edge = LineEdge | ArcEdge;

/**
 * A group's original construction primitive, kept so that shapes which are
 * still untouched can be exported losslessly (a circle stays a DXF CIRCLE
 * rather than two ARCs).
 */
export interface CirclePrimitive {
  type: 'circle';
  cx: number;
  cy: number;
  r: number;
}

export type GroupPrimitive = CirclePrimitive;

export type ToolId =
  | 'select'
  | 'line'
  | 'parallel'
  | 'lineAngle'
  | 'lineOrthogonal'
  | 'rotate'
  | 'polyline'
  | 'spline'
  | 'rect'
  | 'circle'
  | 'circle2p'
  | 'circle3p'
  | 'tangent'
  | 'ellipse'
  | 'break'
  | 'measure'
  | 'flow'
  | 'wire'
  | 'group';

export interface ValidationResult {
  valid: boolean;
  errs: string[];
}

/* ---------------------------------------------------------------------------
 * Flow blocks, ports and connectors - the entity model
 * (PLAN-37.02 decided it; PLAN-49.01 named the sides)
 *
 * Everything above this line is geometry. The app could draw a shape and could
 * not express a THING: no reusable symbol, no port on a symbol, no connection
 * between two ports. So a clock with an input and an output, drawn once and
 * wired to others, was not representable at any level - and PLAN-36.04's
 * pairing, PLAN-37.01's manifest and the whole 06a/06b idea (a tool and its
 * output, terminations and the map) were all waiting behind that.
 *
 * THREE DESIGN CALLS, TAKEN
 *
 * 1. A port lives on the BLOCK DEFINITION, and placements inherit it. The
 *    alternative - ports per placement - lets every instance of a clock carry
 *    different ports, at which point the symbol stops meaning anything and
 *    "a clock" is no longer a type. A placement may OVERRIDE a port's label,
 *    never its existence.
 *
 * 2. A connector is a GRAPH EDGE that is drawn, not a drawing that implies a
 *    graph. Geometry alone cannot answer "what is connected to what", which is
 *    the entire purpose here; the simulation model's crosspoints are exactly
 *    that question already. `route` is a rendering hint, and deleting it must
 *    not disconnect anything.
 *
 * 3. THE FOUR SIDES ARE SPOKEN FOR, and a port's position is DERIVED from its
 *    side rather than stored beside it (PLAN-49.01):
 *
 *        top = control | bottom = power | left = input | right = output
 *
 *    A block whose ports sit anywhere means a reader has to trace a wire to
 *    learn what it is. A block whose sides are spoken for means signal reads
 *    left to right across the sheet, and the two things that are not signal -
 *    the thing that tells it what to do and the thing that makes it run -
 *    leave the horizontal alone. Storing a coordinate and inferring the side
 *    back out of it is the version of this that goes wrong the first time
 *    somebody rotates a block; so `side` is identity and `offset` is only
 *    where along that side the port sits.
 *
 * THE IDENTIFIER SCHEME IS NOT NEW (PLAN-37.02 step 2)
 *
 * `APK:OS/Interfaces/<node>/Interfaces.json` already gives every termination a
 * stable identity in its `Terminals` table, keyed `(interface, side, terminal)`
 * and carrying the SPICE node name it maps to - `NIC_ENP12S0_INP_RX`. Measured
 * on APK-Shop: 102 `output`, 62 `input`, 45 `bus`, and nothing else. That is a
 * SIGNAL CLASSIFICATION and the four sides above are a GEOMETRIC EDGE, so they
 * are kept as two vocabularies with one function between them - collapsing
 * them either loses `control`/`power` or invents a `side` the Terminals table
 * has never heard of, and both break the join `PLAN-36.04` is waiting on.
 * ------------------------------------------------------------------------- */

/**
 * Which edge of a block a port sits on. Four edges, each spoken for; the side
 * IS the port's meaning, and `portLocalPoint` derives the position from it.
 */
export type PortSide = 'control' | 'power' | 'input' | 'output';

/** Declaration order, and the order the sidebar and the exporter walk them in. */
export const PORT_SIDES: readonly PortSide[] = ['input', 'output', 'control', 'power'];

/**
 * The Terminals table's own `side` column - a signal classification, not an
 * edge. Kept distinct from `PortSide` on purpose; see the header above.
 */
export type TerminalSide = 'input' | 'output' | 'bus';

/**
 * The one place the two vocabularies meet. `control` and `power` are not
 * signal directions, so they join the Terminals table as `bus` - which is
 * exactly what that column already means there: what the thing sits on rather
 * than what passes through it.
 */
export function terminalSideOf(side: PortSide): TerminalSide {
  return side === 'input' || side === 'output' ? side : 'bus';
}

/** A port on a block DEFINITION. Every placement of that block has it. */
export interface Port {
  /** Unique within the definition. Matches the Terminals table's `terminal`. */
  id: string;
  /** The edge it sits on. Identity, not a hint about position. */
  side: PortSide;
  /** Shown on the symbol. `id` is the identity; this is the caption. */
  label?: string;
  /**
   * Where along its side the port sits, 0..1, running top-to-bottom on the
   * left and right edges and left-to-right on the top and bottom ones. Omit it
   * and the ports on that side are spread evenly, which is what a symbol with
   * one port per side wants and is the reason this is optional.
   */
  offset?: number;
  /** `network`, `audio`, `clock`, `usb` - matches the Terminals `domain` column. */
  domain?: string;
}

/** A block's outline, in block-local units. The origin is its centre. */
export interface BlockSize {
  w: number;
  h: number;
}

/**
 * A reusable symbol: an outline, the strokes drawn inside it, and the ports
 * that make it a thing rather than a picture. Exports as a DXF `BLOCK` placed
 * by one `INSERT` - the convention `.apk.scripts/dxf_writer.py` already writes,
 * matched rather than reinvented.
 *
 * The glyph is polylines in block-local coordinates rather than a `Doc`-style
 * vertex graph: a definition is authored, not drawn edge by edge, and the
 * vertex graph exists to be cut and welded, which a symbol never is.
 */
export interface BlockDefinition {
  id: string;
  /** The DXF BLOCK name. Must satisfy the DXF name rules on export. */
  name: string;
  description?: string;
  size: BlockSize;
  /** Strokes inside the outline. Each entry is one open polyline. */
  glyph: Point[][];
  ports: Port[];
}

/** One placement of a definition - a DXF `INSERT`. */
export interface BlockPlacement {
  id: number;
  definitionId: string;
  /** Where the definition's origin - its centre - lands on the sheet. */
  at: Point;
  /** Degrees, counter-clockwise. The GEOMETRY turns; the sides keep their names. */
  rotation?: number;
  scale?: number;
  layerId: string;
  /**
   * This instance's name on the sheet - `CLK1`, `enp12s0`. Joins to the
   * Terminals table's `interface` column, which is why it is not optional in
   * practice even though the type allows a placement before it is named.
   */
  refdes?: string;
  /** Per-instance CAPTION overrides, by port id. Never adds or removes a port. */
  portLabels?: Record<string, string>;
}

/** One end of a connector: a port on a particular placement. */
export interface PortRef {
  placementId: number;
  portId: string;
}

/**
 * A connection between two ports. An EDGE first: `from` and `to` are the
 * connection, and `route` is only how it is drawn.
 */
export interface Connector {
  id: number;
  from: PortRef;
  to: PortRef;
  layerId: string;
  /**
   * Optional drawn path, in sheet coordinates, excluding the endpoints - those
   * are derived from the ports so a moved block keeps its wires. An empty or
   * absent route means "draw it directly"; it never means "not connected".
   */
  route?: Point[];
  label?: string;
}

/**
 * The join key for `Interfaces.json`'s `Terminals` table: `(interface, side,
 * terminal)`. Built here so both sides of PLAN-36.04's pairing spell it the
 * same way, rather than each spelling it its own way and nearly agreeing.
 */
export function terminalKey(refdes: string, side: PortSide, portId: string): string {
  return `${refdes} ${terminalSideOf(side)} ${portId}`;
}

/* ---------------------------------------------------------------------------
 * Groups - the boxes around the boxes (PLAN-61.01)
 *
 * A placement is a THING. A group is a thing made of things, and a group whose
 * children are groups is the only way a sheet of ninety-four boxes says
 * anything: nobody reads ninety-four, they read four racks in two rooms.
 *
 * THE BOX IS DERIVED, NEVER STORED. A group has no `at`, no `size` and no
 * corners - `groupBounds()` computes them from what the group holds, exactly
 * as `portLocalPoint()` computes a port's position from its side. Store the
 * rectangle and the first block anybody drags leaves its own group behind, and
 * the drawing starts lying about the model. This is the same call taken twice
 * in this file, and it is taken the same way both times.
 *
 * TWO INVARIANTS, AND EVERY OPERATION IN `flow/groups.ts` MAINTAINS THEM:
 *
 *   1. A placement is in AT MOST ONE group, and a group has AT MOST ONE
 *      parent. Membership is a tree, so `groupBounds` terminates and a box is
 *      drawn once.
 *   2. No cycles. `nestGroup` refuses a parent that is already a descendant,
 *      because a group inside itself has no bounds and no bottom.
 *
 * `members` holds placements this group owns DIRECTLY. A placement inside a
 * child group is not repeated here - the child owns it - which is what makes
 * "the groups of groups" a tree rather than a pile of overlapping sets.
 * ------------------------------------------------------------------------- */

/** A named container: some placements, some child groups, and nothing else. */
export interface Group {
  id: number;
  /** What it is called on the sheet. The identity is `id`; this is the caption. */
  name: string;
  /** Child group ids. This field is what makes it a group OF GROUPS. */
  children: number[];
  /** Placement ids owned directly by this group - never a child's. */
  members: number[];
  layerId: string;
  /**
   * Drawing units of clearance between the contents and the drawn box. Omitted
   * means the default; a group nested inside another is drawn with its parent
   * padded further out, so depth is visible without a colour per level.
   */
  pad?: number;
  /**
   * Folded shut - drawn as one box with its name and a count, contents hidden.
   * A rendering state, and deliberately part of the model: which groups are
   * folded is how a person left the sheet, and it survives a reload.
   */
  collapsed?: boolean;
  /**
   * What this group STANDS FOR outside this drawing, if anything - a display
   * id, a rack, an NMOS device. Free-form on purpose: the join is declared by
   * whoever seeds the sheet, and a drawing that invented its own key for the
   * thing it is drawing is the fork this field exists to prevent.
   */
  source?: { kind: string; id: string };
}

/** Everything on the sheet that is a thing rather than a stroke. */
export interface SchematicModel {
  definitions: BlockDefinition[];
  placements: BlockPlacement[];
  connectors: Connector[];
  /** The containers, flat. The nesting is in each group's `children`. */
  groups: Group[];
  /** @internal - id counters, bumped by the operations under `src/flow/`. */
  nextPlacementId: number;
  /** @internal */
  nextConnectorId: number;
  /** @internal */
  nextGroupId: number;
}
