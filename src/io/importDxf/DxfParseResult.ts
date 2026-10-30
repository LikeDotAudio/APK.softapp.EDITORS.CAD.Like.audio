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

export interface DxfParseResult {
  units?: 'in' | 'mm';
  layers: DxfLayer[];
  linetypes: DxfLinetypeDef[];
  entities: DxfEntity[];
}
