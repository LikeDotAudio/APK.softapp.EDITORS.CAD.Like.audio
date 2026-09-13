// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { useState } from 'react';
import { useStore } from '../../state/useStore';
import { useUi } from '../../state/useUi';

export interface SendToLayerSubmenuProps {
  onDone: () => void;
}

/** Hover-expanding submenu that moves the selection onto another layer. */
export function SendToLayerSubmenu({ onDone }: SendToLayerSubmenuProps) {
  const store = useStore();
  const { selectionSize, layers, activeLayerId } = useUi();
  const [expanded, setExpanded] = useState(false);
  const enabled = selectionSize > 0;

  return (
    <div className="relative" onMouseEnter={() => setExpanded(true)} onMouseLeave={() => setExpanded(false)}>
      <button
        type="button"
        disabled={!enabled}
        className={
          'flex w-full items-center justify-between rounded px-3 py-1.5 text-left transition-colors ' +
          (enabled ? 'text-[#ddd] hover:bg-[rgba(244,144,44,0.18)] hover:text-white' : 'cursor-not-allowed opacity-40')
        }
      >
        <span className="flex items-center gap-2">
          <span>🥞</span> Send to Layer
        </span>
        <span>▶</span>
      </button>

      {expanded && enabled && (
        <div className="absolute left-full top-0 ml-1 flex max-h-56 w-44 flex-col gap-0.5 overflow-y-auto rounded border border-[#454545] bg-[#252526] p-1 shadow-2xl">
          {layers.map((layer) => (
            <button
              key={layer.id}
              type="button"
              onClick={() => {
                store.setSelectionLayer(layer.id);
                store.setActiveLayer(layer.id);
                onDone();
              }}
              className={
                'flex items-center justify-between rounded px-2.5 py-1.5 text-left text-[11px] transition-colors ' +
                (layer.id === activeLayerId
                  ? 'bg-[#f4902c] font-semibold text-[#1e1e1e]'
                  : 'text-[#ddd] hover:bg-[#383838]')
              }
            >
              <span className="truncate">{layer.name}</span>
              <span
                className="h-3 w-3 flex-shrink-0 rounded-sm border border-[#555]"
                style={{ backgroundColor: layer.color }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
