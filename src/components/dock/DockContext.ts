// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { createContext, useContext } from 'react';
import type { DockLayout, PanelId, RailMode, RailSide } from './dockLayout';

export interface DockApi {
  layout: DockLayout;
  /** Panels this editor has content for right now (Flow only in Big Picture, palette only when a host sent one). */
  available: ReadonlySet<PanelId>;
  /** The panel being dragged by its title, so an empty rail can show where to drop. */
  dragging: PanelId | null;
  setDragging(id: PanelId | null): void;
  toggleCollapsed(id: PanelId): void;
  /** Onto `side`, ahead of `before` (or at the end). */
  moveTo(id: PanelId, side: RailSide, before?: PanelId): void;
  popOut(id: PanelId): void;
  dockBack(id: PanelId): void;
  setSize(id: PanelId, px: number): void;
  setRailMode(side: RailSide, mode: RailMode): void;
  setTab(side: RailSide, id: PanelId): void;
  setRailWidth(side: RailSide, px: number): void;
}

export const DockContext = createContext<DockApi | null>(null);

export function useDock(): DockApi {
  const dock = useContext(DockContext);
  if (!dock) throw new Error('useDock outside DockProvider');
  return dock;
}

/** Where the panel being rendered sits — read by its title strip for the dock buttons. */
export interface PanelSlot {
  id: PanelId;
  where: 'rail' | 'window';
  mode: RailMode;
  collapsed: boolean;
}

export const PanelSlotContext = createContext<PanelSlot | null>(null);

export function usePanelSlot(): PanelSlot | null {
  return useContext(PanelSlotContext);
}
