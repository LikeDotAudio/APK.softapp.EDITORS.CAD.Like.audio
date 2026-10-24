// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { ReactNode } from 'react';
import { useDock, usePanelSlot } from './DockContext';

function DockButton({ title, onClick, children }: { title: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className="rounded px-1 text-[11px] leading-none text-[#888] hover:bg-[#3c3c3c] hover:text-white"
    >
      {children}
    </button>
  );
}

/**
 * Fold, send to the other rail, pop out / dock back — on every panel's title
 * strip. Nothing outside a dock slot (a title used elsewhere) gets them.
 */
export function DockControls() {
  const dock = useDock();
  const slot = usePanelSlot();
  if (!slot) return null;
  const { id } = slot;

  if (slot.where === 'window') {
    return (
      <DockButton title="Dock back into the side rail" onClick={() => dock.dockBack(id)}>
        ⇲
      </DockButton>
    );
  }

  const side = dock.layout.panels[id].side;
  const other = side === 'left' ? 'right' : 'left';
  return (
    <span className="flex items-center">
      {slot.mode === 'stack' && (
        <DockButton title={slot.collapsed ? 'Unfold' : 'Fold'} onClick={() => dock.toggleCollapsed(id)}>
          {slot.collapsed ? '▸' : '▾'}
        </DockButton>
      )}
      <DockButton title={`Move to the ${other} rail`} onClick={() => dock.moveTo(id, other)}>
        {other === 'left' ? '⇤' : '⇥'}
      </DockButton>
      <DockButton title="Pop out into its own window — close it to dock back" onClick={() => dock.popOut(id)}>
        ⧉
      </DockButton>
    </span>
  );
}
