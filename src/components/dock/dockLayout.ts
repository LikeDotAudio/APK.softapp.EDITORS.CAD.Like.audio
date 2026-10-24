// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.

/** Every panel the side rails can hold. */
export type PanelId = 'flow' | 'groups' | 'palette' | 'layers' | 'properties';
export type RailSide = 'left' | 'right';
/** Panels one under the other, or one at a time behind tabs. */
export type RailMode = 'stack' | 'tabs';

export interface PanelPlace {
  /** The rail it lives on — and the one it returns to when its window closes. */
  side: RailSide;
  collapsed: boolean;
  /** Height in a stack, px. The last open panel of a stack ignores it and takes the rest. */
  size: number;
  /** Out in its own browser window. */
  popped: boolean;
}

export interface RailState {
  mode: RailMode;
  tab: PanelId | null;
  width: number;
}

export interface DockLayout {
  order: PanelId[];
  panels: Record<PanelId, PanelPlace>;
  rails: Record<RailSide, RailState>;
}

export const RAIL_MIN_WIDTH = 180;
export const RAIL_MAX_WIDTH = 560;
export const PANEL_MIN_HEIGHT = 48;

const KEY = 'cad.dockLayout.v1';

export const DEFAULT_LAYOUT: DockLayout = {
  order: ['flow', 'groups', 'palette', 'layers', 'properties'],
  panels: {
    flow: { side: 'right', collapsed: false, size: 280, popped: false },
    groups: { side: 'right', collapsed: false, size: 180, popped: false },
    palette: { side: 'right', collapsed: false, size: 260, popped: false },
    layers: { side: 'right', collapsed: false, size: 260, popped: false },
    properties: { side: 'right', collapsed: false, size: 320, popped: false },
  },
  rails: {
    left: { mode: 'stack', tab: null, width: 256 },
    right: { mode: 'stack', tab: null, width: 256 },
  },
};

/**
 * The layout this browser last left. A popped-out window cannot be reopened
 * without a click (popup blockers), so every panel starts back in its rail.
 */
export function loadDockLayout(): DockLayout {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_LAYOUT;
    const saved = JSON.parse(raw) as Partial<DockLayout>;
    const ids = DEFAULT_LAYOUT.order;
    const order = (saved.order ?? []).filter((id) => ids.includes(id));
    const panels = { ...DEFAULT_LAYOUT.panels };
    for (const id of ids) panels[id] = { ...panels[id], ...saved.panels?.[id], popped: false };
    return {
      order: [...new Set([...order, ...ids])],
      panels,
      rails: {
        left: { ...DEFAULT_LAYOUT.rails.left, ...saved.rails?.left },
        right: { ...DEFAULT_LAYOUT.rails.right, ...saved.rails?.right },
      },
    };
  } catch {
    return DEFAULT_LAYOUT;
  }
}

export function saveDockLayout(layout: DockLayout): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(layout));
  } catch {}
}
