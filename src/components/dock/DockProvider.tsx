// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useEntrance } from '../../shell/EntranceContext';
import { useUi } from '@state/useUi';
import { DockContext, type DockApi } from './DockContext';
import {
  loadDockLayout,
  PANEL_MIN_HEIGHT,
  RAIL_MAX_WIDTH,
  RAIL_MIN_WIDTH,
  saveDockLayout,
  type DockLayout,
  type PanelId,
  type PanelPlace,
} from './dockLayout';
import { DOCK_PANELS } from './dockPanels';
import { PanelFrame } from './PanelFrame';
import { PopoutWindow } from './PopoutWindow';

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * Owns where every side panel is: which rail, folded or not, how tall, in
 * tabs or a stack, or out in a window of its own. Popped-out panels render
 * from here, so they keep working whichever rail is on screen; closing the
 * window docks the panel back where it came from.
 */
export function DockProvider({ children }: { children: ReactNode }) {
  const { showsFlowPanel } = useEntrance();
  const { palette } = useUi();
  const [layout, setLayout] = useState<DockLayout>(loadDockLayout);
  const [dragging, setDragging] = useState<PanelId | null>(null);
  const windows = useRef(new Map<PanelId, Window>());

  useEffect(() => saveDockLayout(layout), [layout]);

  // Popped-out panels are this window's DOM — they cannot outlive it.
  useEffect(() => {
    const all = windows.current;
    const closeAll = () => all.forEach((w) => w.close());
    window.addEventListener('pagehide', closeAll);
    return () => window.removeEventListener('pagehide', closeAll);
  }, []);

  const available = useMemo(() => {
    const ids = new Set<PanelId>(['layers', 'properties']);
    if (showsFlowPanel) ids.add('flow').add('groups');
    if (palette) ids.add('palette');
    return ids;
  }, [showsFlowPanel, palette]);

  const patch = useCallback((id: PanelId, change: Partial<PanelPlace>) => {
    setLayout((l) => ({ ...l, panels: { ...l.panels, [id]: { ...l.panels[id], ...change } } }));
  }, []);

  const dockBack = useCallback(
    (id: PanelId) => {
      const win = windows.current.get(id);
      windows.current.delete(id);
      if (win && !win.closed) win.close();
      patch(id, { popped: false });
    },
    [patch],
  );

  const api = useMemo<DockApi>(
    () => ({
      layout,
      available,
      dragging,
      setDragging,
      toggleCollapsed: (id) => patch(id, { collapsed: !layout.panels[id].collapsed }),
      moveTo: (id, side, before) =>
        setLayout((l) => {
          const order = l.order.filter((o) => o !== id);
          const at = before ? order.indexOf(before) : -1;
          order.splice(at < 0 ? order.length : at, 0, id);
          return {
            ...l,
            order,
            panels: { ...l.panels, [id]: { ...l.panels[id], side } },
            rails: { ...l.rails, [side]: { ...l.rails[side], tab: id } },
          };
        }),
      popOut: (id) => {
        // Opened here, inside the click, or a popup blocker eats it.
        const rail = layout.rails[layout.panels[id].side];
        const height = Math.max(420, layout.panels[id].size + 40);
        const win = window.open(
          '',
          `cad-panel-${id}`,
          `popup,width=${rail.width + 40},height=${height},left=${window.screenX + 80},top=${window.screenY + 80}`,
        );
        if (!win) return;
        windows.current.set(id, win);
        patch(id, { popped: true });
      },
      dockBack,
      setSize: (id, px) => patch(id, { size: Math.max(PANEL_MIN_HEIGHT, Math.round(px)) }),
      setRailMode: (side, mode) => setLayout((l) => ({ ...l, rails: { ...l.rails, [side]: { ...l.rails[side], mode } } })),
      setTab: (side, id) => setLayout((l) => ({ ...l, rails: { ...l.rails, [side]: { ...l.rails[side], tab: id } } })),
      setRailWidth: (side, px) =>
        setLayout((l) => ({
          ...l,
          rails: { ...l.rails, [side]: { ...l.rails[side], width: clamp(Math.round(px), RAIL_MIN_WIDTH, RAIL_MAX_WIDTH) } },
        })),
    }),
    [layout, available, dragging, patch, dockBack],
  );

  const popped = layout.order.filter((id) => layout.panels[id].popped && available.has(id));

  return (
    <DockContext.Provider value={api}>
      {children}
      {popped.map((id) => {
        const win = windows.current.get(id);
        if (!win) return null;
        const label = id === 'palette' && palette ? palette.title : DOCK_PANELS[id].label;
        return (
          <PopoutWindow key={id} win={win} title={`${label} — CAD.LIKE.AUDIO`} onClosed={() => dockBack(id)}>
            <PanelFrame slot={{ id, where: 'window', mode: 'stack', collapsed: false }} />
          </PopoutWindow>
        );
      })}
    </DockContext.Provider>
  );
}
