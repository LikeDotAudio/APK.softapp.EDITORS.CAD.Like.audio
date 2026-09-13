// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import COLORS from '../colorsStyle';

export const CANVAS = {
  background: COLORS.canvasBg,
  grid: COLORS.canvasGrid,
  axis: COLORS.canvasAxis,

  edge: COLORS.canvasEdgeDefault,
  edgeSelected: COLORS.canvasEdgeSelected,
  edgeHover: COLORS.canvasEdgeHover,
  preview: COLORS.canvasPreview,

  dimLine: '#38bdf8',
  dimText: '#60a5fa',
  labelBackdrop: 'rgba(30,30,30,.9)',

  snapEndpoint: '#22c55e',
  snapEndpointFill: 'rgba(34,197,94,.25)',
  snapMidpoint: '#f59e0b',
  snapMidpointFill: 'rgba(217,119,6,.15)',
  cursorDot: '#38bdf8',

  danger: COLORS.dangerRedText,
  dangerFill: 'rgba(239,68,68,.95)',
  warning: '#f59e0b',
  measure: '#22c55e',
  measureFill: 'rgba(34,197,94,.95)',
  calibrate: '#a855f7',
  bounds: COLORS.canvasBounds,
  /** Orange grab squares on selected endpoints, midpoints and net corners. */
  handle: COLORS.canvasHandle,
  /** Dashed net drawn around a multi-element selection. */
  selectionNet: '#38bdf8',
  imageOutline: 'rgba(129,140,248,0.6)',
  white: '#ffffff',
} as const;

const UI_FONT = "'Inter', -apple-system, system-ui, sans-serif";

export const FONT = {
  marker: `bold 9px ${UI_FONT}`,
  dimension: `bold 11px ${UI_FONT}`,
  measure: `bold 12px ${UI_FONT}`,
  banner: `bold 13px ${UI_FONT}`,
} as const;
