// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { DockControls } from '../dock/DockControls';
import { useDock, usePanelSlot } from '../dock/DockContext';

export interface PanelSectionTitleProps {
  label: string;
  children?: React.ReactNode;
}

/**
 * Grey title strip at the top of a sidebar section. Docked, it is also the
 * handle: drag it to another rail or between panels, double-click to fold,
 * and it carries the dock buttons.
 */
export function PanelSectionTitle({ label, children }: PanelSectionTitleProps) {
  const dock = useDock();
  const slot = usePanelSlot();
  const inRail = slot?.where === 'rail';

  return (
    <div
      draggable={inRail}
      onDragStart={(e) => {
        if (!slot) return;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', slot.id);
        dock.setDragging(slot.id);
      }}
      onDragEnd={() => dock.setDragging(null)}
      onDoubleClick={(e) => {
        if (slot && inRail && slot.mode === 'stack' && e.target === e.currentTarget) dock.toggleCollapsed(slot.id);
      }}
      className={
        'flex flex-shrink-0 items-center justify-between gap-1 border-b border-[#3b3b3b] bg-[#2d2d2d] px-2.5 py-1.5 ' +
        (inRail ? 'cursor-grab' : '')
      }
    >
      <span className="min-w-0 truncate text-[11px] font-semibold uppercase tracking-wider text-[#999]">{label}</span>
      <span className="flex flex-shrink-0 items-center gap-1">
        {children}
        <DockControls />
      </span>
    </div>
  );
}
