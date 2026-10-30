// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
export interface DxfEntity {
  type: string;
  layer?: string;
  colorIndex?: number;
  // LINE
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  // CIRCLE / ARC
  cx?: number;
  cy?: number;
  r?: number;
  // ARC angles in degrees
  startAngle?: number;
  endAngle?: number;
  // POLYLINE / LWPOLYLINE
  points?: { x: number; y: number; bulge?: number }[];
  isClosed?: boolean;
  // Old-style POLYLINE header flags (70): 1 closed, 16 polygon mesh, 64 polyface mesh
  polylineFlags?: number;
  // VERTEX (of an old-style POLYLINE): position in x1/y1, bulge (42), flags (70):
  // 16 spline frame control point, 128 polyface face record
  bulge?: number;
  vertexFlags?: number;
  // TEXT / MTEXT
  text?: string;
  textHeight?: number;
  rotation?: number;
  hAlign?: number;
  vAlign?: number;
  // SOLID quad points (x1,y1, x2,y2, x3,y3, x4,y4)
  x3?: number;
  y3?: number;
  x4?: number;
  y4?: number;
  // INSERT (Block reference)
  blockName?: string;
  scaleX?: number;
  scaleY?: number;
  // HATCH pattern name (SOLID for a solid fill)
  hatchPattern?: string;
  // A fill colour as #rrggbb: only on a HATCH made from a session block's fill
  // (`dxfBlockFromDef`), which holds a colour, not an ACI index
  hexColor?: string;
  // ELLIPSE: centre is cx/cy; major axis end relative to the centre (11/21),
  // minor/major ratio (40), start and end parameter in radians (41/42)
  majorX?: number;
  majorY?: number;
  ratio?: number;
  startParam?: number;
  endParam?: number;
  // SPLINE: degree (71), knot vector (40), weights (41), control points
  // (10/20), fit points (11/21); isClosed from flag bit 1 (70)
  degree?: number;
  knots?: number[];
  weights?: number[];
  controlPoints?: { x: number; y: number }[];
  fitPoints?: { x: number; y: number }[];
  // DIMENSION: blockName (2) names the anonymous block holding its drawn
  // geometry (lines, arrows, text) in world coordinates
}

export interface DxfLayer {
  name: string;
  colorIndex?: number;
  isFrozen?: boolean;
  /** Switched off — DXF writes that as a negative colour. */
  isOff?: boolean;
  isLocked?: boolean;
  /** Linetype name (group 6). */
  linetype?: string;
  /** Lineweight in hundredths of a mm (group 370); negative = default/by-block/by-layer. */
  lineweight?: number;
}

/** One LTYPE record: a name and its dash pattern (group 49 lengths, file units). */
export interface DxfLinetypeDef {
  name: string;
  description?: string;
  pattern: number[];
}

/**
 * One BLOCK from the BLOCKS section: its name, its base point (group 10/20 of
 * the BLOCK record) and the entities between BLOCK and ENDBLK, in block
 * coordinates. *Model_Space and *Paper_Space are not blocks in this sense and
 * are not listed.
 */
export interface DxfBlock {
  name: string;
  baseX: number;
  baseY: number;
  entities: DxfEntity[];
}

export interface DxfParseResult {
  units?: 'in' | 'mm';
  layers: DxfLayer[];
  linetypes: DxfLinetypeDef[];
  /** User-defined block definitions the file carries; an INSERT names one of these. */
  blocks: DxfBlock[];
  entities: DxfEntity[];
  /**
   * What the file holds that the importer reads past, by entity type, counted
   * in ENTITIES and BLOCKS alike: `3DFACE`, `LEADER`, `IMAGE`, … and
   * `POLYLINE (mesh)` for a polygon or polyface mesh. Empty when nothing was.
   */
  skipped: Record<string, number>;
}
