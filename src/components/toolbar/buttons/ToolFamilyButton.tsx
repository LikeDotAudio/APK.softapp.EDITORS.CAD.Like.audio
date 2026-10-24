// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { useEffect, useRef, useState } from 'react';
import { useStore } from '../../../state/useStore';
import { useUi } from '../../../state/useUi';
import type { AnyTool } from '../../../tools/types';
import { PaletteButton } from '../PaletteButton';

export interface ToolFamilyButtonProps {
  /** The family's tools, in toolbar order. */
  tools: AnyTool[];
}

const HOLD_MS = 350;

/**
 * One cell standing for several tools. Click takes the member shown; hold,
 * right-click, or click it again while it is the live tool to open the
 * fly-out and pick another. The cell then shows whichever was picked last,
 * so a run of ellipses is one click each.
 */
export function ToolFamilyButton({ tools }: ToolFamilyButtonProps) {
  const store = useStore();
  const { toolId } = useUi();
  const [lastId, setLastId] = useState(tools[0].id);
  const [flyout, setFlyout] = useState<{ x: number; y: number } | null>(null);
  const cellRef = useRef<HTMLDivElement>(null);
  const flyoutRef = useRef<HTMLDivElement>(null);
  const holdTimer = useRef<number | null>(null);
  const heldOpen = useRef(false);

  const live = tools.find((t) => t.id === toolId);
  const shown = live ?? tools.find((t) => t.id === lastId) ?? tools[0];

  const openFlyout = () => {
    const r = cellRef.current?.getBoundingClientRect();
    if (r) setFlyout({ x: r.right + 2, y: r.top });
  };

  const cancelHold = () => {
    if (holdTimer.current !== null) window.clearTimeout(holdTimer.current);
    holdTimer.current = null;
  };

  const pick = (tool: AnyTool) => {
    setLastId(tool.id);
    store.setTool(tool.id);
    setFlyout(null);
  };

  useEffect(() => {
    if (!flyout) return;
    const dismiss = (e: PointerEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !flyoutRef.current?.contains(e.target as Node)) setFlyout(null);
    };
    window.addEventListener('pointerdown', dismiss, true);
    window.addEventListener('keydown', dismiss, true);
    return () => {
      window.removeEventListener('pointerdown', dismiss, true);
      window.removeEventListener('keydown', dismiss, true);
    };
  }, [flyout]);

  return (
    <div
      ref={cellRef}
      className="relative"
      onPointerDown={() => {
        heldOpen.current = false;
        holdTimer.current = window.setTimeout(() => {
          heldOpen.current = true;
          openFlyout();
        }, HOLD_MS);
      }}
      onPointerUp={cancelHold}
      onPointerLeave={cancelHold}
      onContextMenu={(e) => {
        e.preventDefault();
        cancelHold();
        openFlyout();
      }}
    >
      <PaletteButton
        title={`${shown.title} — hold for ${tools.length - 1} more`}
        active={live !== undefined}
        onSelect={() => {
          if (heldOpen.current) return;
          if (live) openFlyout();
          else pick(shown);
        }}
      >
        <div className="h-4 w-4">{shown.icon}</div>
      </PaletteButton>
      {/* Corner tick: this cell has more under it. */}
      <span className="pointer-events-none absolute bottom-0.5 right-0.5 h-0 w-0 border-b-[4px] border-l-[4px] border-b-current border-l-transparent opacity-60" />

      {flyout && (
        <div
          ref={flyoutRef}
          role="menu"
          aria-label="Shape tools"
          className="fixed z-50 flex border border-[#444] bg-[#1e1e1e] shadow-lg"
          style={{ left: flyout.x, top: flyout.y }}
        >
          {tools.map((tool) => (
            <div key={tool.id} className="w-7">
              <PaletteButton title={tool.title} active={tool.id === toolId} onSelect={() => pick(tool)}>
                <div className="h-4 w-4">{tool.icon}</div>
              </PaletteButton>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
