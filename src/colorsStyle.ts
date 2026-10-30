// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
/**
 * The CANVAS palette. Not the chrome's.
 *
 * This file used to claim to be the "single central source of truth for all
 * window, panel, sidebar, menu, button, and canvas colors". Measured:
 * exactly ONE file imports it — `src/render/palette.ts`, the
 * canvas renderer. 46 files in `components/` carry a Tailwind arbitrary value
 * instead (`bg-[#1e1e1e]`, `text-[#cccccc]`, `bg-[#f4902c]`), 74 distinct
 * hexes across `src/`, `#f4902c` alone in 28 places.
 *
 * So there are two palettes in this app and they govern different regions:
 *
 *   this file        the DARK workspace the canvas is painted in
 *   `index.css`      `@theme` — the PAPER surface the chrome sits on, mirrored
 *                    from the drawing-board CSS this UI was ported from
 *                    (`reference/can-cut.ca/drawing board.html`)
 *
 * Neither is wrong; the claim of totality was. Correcting the docblock rather
 * than the code is deliberate: making this genuinely single-source means
 * rewriting 46 components' inline values, which is a bigger change than the
 * sentence that was false. PLAN-111.02 step 3.
 *
 * THE ACCENT IS NO LONGER SPELLED IN THIS FILE, and that part is closed.
 * `accent`, `accentHover`, `accentTint`, `onAccent` and the three canvas greys
 * below all read `src/tokens/brand.json` — a vendored, byte-identical copy of the
 * APK.audio monorepo's `contracts/tokens/brand.json`, where the value is stated
 * once. It is copied, not imported across the repo boundary, because this app is
 * its own git repository and builds standalone (CI checks out only this repo).
 * When the monorepo's brand.json changes, copy it here again:
 *   cp <APK.audio>/contracts/tokens/brand.json src/tokens/brand.json
 * PLAN-162.01.
 *
 * The 46 components carrying Tailwind arbitrary values are still the backlog
 * that ratchet counts.
 */

import brand from './tokens/brand.json';

export const COLORS = {
  // Window & Panel Backgrounds
  windowBg: '#1e1e1e',          // Main canvas / dark workspace background
  panelBg: '#252526',           // Header, sidebars, status bar & panel container background
  cardBg: '#1e1e1e',            // Inner cards, layer list container, input backgrounds
  headerBg: '#2d2d2d',          // Section title bars & menu dropdown headers

  // Borders & Dividers
  borderDark: '#333333',        // Outer panel dividers & main section borders
  borderMedium: '#3c3c3c',      // Input & button borders
  borderLight: '#454545',       // Dropdown menu borders & popover outlines

  // Interactive States & Accents — the whole UI is built around this orange.
  // NOT SPELLED HERE. These four are the ecosystem's brand, stated once in the
  // monorepo's `contracts/tokens/brand.json`; this app reads its vendored copy at
  // `src/tokens/brand.json` (see the docblock above). Vite and tsc read JSON
  // natively, so there is no build step — but there IS a copied file to keep in step.
  accent: brand.accent.hex,
  accentHover: brand.accentHover.hex,
  accentTint: brand.accentTint.rgba,
  onAccent: brand.onAccent.hex,
  hoverBg: '#383838',           // General button hover background
  buttonBg: '#2d2d2d',          // Default tool & control button background

  // Typography / Text Colors
  textPrimary: '#ffffff',       // Primary white headings & active text
  textSecondary: '#cccccc',     // Standard UI text & labels
  textMuted: '#888888',         // Subtle hints, coordinates & unit labels
  textDisabled: '#666666',      // Disabled text & buttons

  // Status & Validation Indicators
  okGreenBg: 'rgba(20, 83, 45, 0.3)',
  okGreenBorder: 'rgba(22, 101, 52, 0.5)',
  okGreenText: '#4ade80',

  dangerRedBg: 'rgba(127, 29, 29, 0.3)',
  dangerRedBorder: 'rgba(153, 27, 27, 0.5)',
  dangerRedText: '#f87171',

  // Canvas Viewport Colors
  canvasBg: '#1e1e1e',
  canvasGrid: '#2d2d2d',
  canvasAxis: '#454545',
  canvasEdgeDefault: '#ffffff',
  canvasEdgeSelected: '#38bdf8',
  canvasEdgeHover: '#7dd3fc',
  canvasPreview: brand.accent.hex,
  canvasHandle: brand.accent.hex,   // Endpoint / midpoint / corner grips
  canvasBounds: brand.accent.hex,   // Drawing extents box
} as const;

export default COLORS;
