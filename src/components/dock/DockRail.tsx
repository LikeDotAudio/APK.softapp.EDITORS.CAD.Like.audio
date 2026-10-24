// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { Fragment, useRef } from 'react';
import { useUi } from '../../state/useUi';
import { useDock } from './DockContext';
import type { PanelId, RailSide } from './dockLayout';
import { DOCK_PANELS } from './dockPanels';
import { PanelFrame } from './PanelFrame';

/** Drag along one axis; `onDrag` gets the distance from where the press began. */
function useDragAxis(axis: 'x' | 'y', onDrag: (delta: number, start: number) => void, startValue: () => number) {
  const from = useRef<{ at: number; value: number } | null>(null);
  return {
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      from.current = { at: axis === 'x' ? e.clientX : e.clientY, value: startValue() };
    },
    onPointerMove: (e: React.PointerEvent<HTMLElement>) => {
      if (!from.current) return;
      onDrag((axis === 'x' ? e.clientX : e.clientY) - from.current.at, from.current.value);
    },
    onPointerUp: () => {
      from.current = null;
    },
  };
}

/** The bar between two stacked panels; dragging it sets the height of the one above. */
function HeightGrip({ id }: { id: PanelId }) {
  const dock = useDock();
  const ref = useRef<HTMLDivElement>(null);
  const drag = useDragAxis(
    'y',
    (dy, start) => dock.setSize(id, start + dy),
    () => ref.current?.previousElementSibling?.getBoundingClientRect().height ?? dock.layout.panels[id].size,
  );
  return (
    <div
      ref={ref}
      {...drag}
      title="Drag to resize"
      className="h-1 flex-shrink-0 cursor-row-resize border-b border-[#333] bg-[#1e1e1e] hover:bg-[#007acc]"
    />
  );
}

/**
 * One side rail: the panels docked on that side, stacked or tabbed. Empty, it
 * is not there at all — except while a panel is being dragged, when it opens
 * as a drop zone.
 */
export function DockRail({ side }: { side: RailSide }) {
  const dock = useDock();
  const { palette } = useUi();
  const { layout, available } = dock;
  const rail = layout.rails[side];
  const widthDrag = useDragAxis(
    'x',
    (dx, start) => dock.setRailWidth(side, side === 'left' ? start + dx : start - dx),
    () => rail.width,
  );

  const ids = layout.order.filter((id) => available.has(id) && !layout.panels[id].popped && layout.panels[id].side === side);
  if (ids.length === 0 && !dock.dragging) return null;

  const tab = rail.tab && ids.includes(rail.tab) ? rail.tab : ids[0];
  const shown = rail.mode === 'tabs' ? ids.filter((id) => id === tab) : ids;
  const open = shown.filter((id) => rail.mode === 'tabs' || !layout.panels[id].collapsed);
  const fillId = open[open.length - 1];
  const label = (id: PanelId) => (id === 'palette' && palette ? palette.title : DOCK_PANELS[id].label);

  const grip = (
    <div
      {...widthDrag}
      title="Drag to widen"
      className="w-1 flex-shrink-0 cursor-col-resize bg-[#1e1e1e] hover:bg-[#007acc]"
    />
  );

  return (
    <div className="flex h-full flex-shrink-0" style={{ width: rail.width }}>
      {side === 'right' && grip}
      <div
        className={
          'flex min-w-0 flex-1 select-none flex-col bg-[#252526] font-sans text-[12px] text-[#cccccc] ' +
          (side === 'right' ? 'border-l' : 'border-r') +
          ' border-[#333]'
        }
        onDragOver={(e) => {
          if (dock.dragging) e.preventDefault();
        }}
        onDrop={(e) => {
          if (!dock.dragging) return;
          e.preventDefault();
          dock.moveTo(dock.dragging, side);
          dock.setDragging(null);
        }}
      >
        <div className="flex flex-shrink-0 items-stretch border-b border-[#333] bg-[#1e1e1e] text-[10px]">
          <div className="flex min-w-0 flex-1 overflow-x-auto [scrollbar-width:none]">
            {rail.mode === 'tabs' &&
              ids.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => dock.setTab(side, id)}
                  className={
                    'truncate px-2 py-1 ' +
                    (id === tab ? 'bg-[#252526] text-white' : 'text-[#888] hover:text-white')
                  }
                  title={label(id)}
                >
                  {label(id)}
                </button>
              ))}
          </div>
          <button
            type="button"
            onClick={() => dock.setRailMode(side, rail.mode === 'tabs' ? 'stack' : 'tabs')}
            className="flex-shrink-0 px-1.5 text-[#888] hover:text-white"
            title={rail.mode === 'tabs' ? 'Stack the panels' : 'One panel at a time, in tabs'}
          >
            {rail.mode === 'tabs' ? '☰' : '▭'}
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          {shown.map((id, i) => (
            <Fragment key={id}>
              <PanelFrame
                slot={{ id, where: 'rail', mode: rail.mode, collapsed: rail.mode === 'stack' && layout.panels[id].collapsed }}
                fill={id === fillId}
              />
              {rail.mode === 'stack' && i < shown.length - 1 && open.includes(id) && id !== fillId ? (
                <HeightGrip id={id} />
              ) : (
                i < shown.length - 1 && <div className="h-px flex-shrink-0 bg-[#333]" />
              )}
            </Fragment>
          ))}
          {ids.length === 0 && (
            <div className="m-2 flex flex-1 items-center justify-center rounded border border-dashed border-[#555] text-[11px] text-[#777]">
              Drop a panel here
            </div>
          )}
        </div>
      </div>
      {side === 'left' && grip}
    </div>
  );
}
