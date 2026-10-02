// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
export interface DxfEntity {
  type: string;
  layer?: string;
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
}

export interface DxfLayer {
  name: string;
  colorIndex?: number;
  isFrozen?: boolean;
}

export interface DxfParseResult {
  units?: 'in' | 'mm';
  layers: DxfLayer[];
  entities: DxfEntity[];
}
