// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { CSSProperties } from 'react';
import { useDock, PanelSlotContext, type PanelSlot } from './DockContext';
import { PANEL_MIN_HEIGHT } from './dockLayout';
import { DOCK_PANELS } from './dockPanels';

export interface PanelFrameProps {
  slot: PanelSlot;
  /** Take whatever height the rail has left. */
  fill?: boolean;
}

/**
 * One panel's box. The panel body fills it; the frame owns the size. Folded,
 * only the body's title strip shows — the first child of the body's root.
 */
export function PanelFrame({ slot, fill = false }: PanelFrameProps) {
  const dock = useDock();
  const { Body } = DOCK_PANELS[slot.id];
  const place = dock.layout.panels[slot.id];

  let style: CSSProperties;
  if (slot.where === 'window') style = { height: '100%' };
  else if (slot.collapsed) style = { flex: '0 0 auto' };
  else if (fill) style = { flex: '1 1 0', minHeight: PANEL_MIN_HEIGHT * 2 };
  else style = { flex: `0 1 ${place.size}px`, minHeight: PANEL_MIN_HEIGHT };

  return (
    <div
      className={
        // The rail's type and colour, carried here so a popped-out window has them too.
        'flex min-h-0 select-none flex-col overflow-hidden bg-[#252526] font-sans text-[12px] text-[#cccccc] ' +
        (slot.collapsed ? '[&>*>*:not(:first-child)]:hidden' : '')}
      style={style}
      onDragOver={(e) => {
        if (dock.dragging && dock.dragging !== slot.id) e.preventDefault();
      }}
      onDrop={(e) => {
        if (!dock.dragging || slot.where !== 'rail') return;
        e.preventDefault();
        e.stopPropagation();
        dock.moveTo(dock.dragging, place.side, slot.id);
        dock.setDragging(null);
      }}
    >
      <PanelSlotContext.Provider value={slot}>
        <Body />
      </PanelSlotContext.Provider>
    </div>
  );
}
