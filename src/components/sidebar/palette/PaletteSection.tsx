// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { useMemo, useState } from 'react';
import type { PaletteItem } from '../../../model/palette/PaletteItem';
import { useStore } from '../../../state/useStore';
import { useUi } from '../../../state/useUi';
import { PanelSectionTitle } from '../PanelSectionTitle';
import { PaletteSwatch } from './PaletteSwatch';

/** "0.6×1.2 m" — the host's nominal size, in the host's metres. */
function sizeLabel(item: PaletteItem): string | null {
  if (!item.size) return null;
  const n = (v: number) => String(parseFloat(v.toFixed(3)));
  return `${n(item.size[0])}×${n(item.size[1])} m`;
}

/**
 * THE HOST'S MATERIALS, TO PICK FROM
 *
 * Only there when a softapp has sent a palette over the bridge — the editor
 * has no materials of its own. Swatches grouped by the host's categories, in
 * the order the host sent them; picking one arms the Palette tool with it,
 * picking it again puts the tool down. The sidebar is a quarter of a small
 * iframe tile, so this stays a dense two-column grid in a scrolled box, and
 * folds to its title strip when the user wants the room for layers.
 */
export function PaletteSection() {
  const store = useStore();
  const { palette, activeLayerId, layers } = useUi();
  const [open, setOpen] = useState(true);

  const groups = useMemo(() => {
    const byCat = new Map<string, PaletteItem[]>();
    for (const item of palette?.items ?? []) {
      const list = byCat.get(item.category);
      if (list) list.push(item);
      else byCat.set(item.category, [item]);
    }
    return [...byCat.entries()];
  }, [palette?.items]);

  if (!palette) return null;
  const layerName = layers.find((l) => l.id === activeLayerId)?.name ?? activeLayerId;

  return (
    <div className="flex flex-shrink-0 flex-col border-b border-[#333]">
      <PanelSectionTitle label={palette.title}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="rounded px-1 text-[11px] text-[#999] hover:text-white"
          title={open ? 'Fold the palette' : 'Open the palette'}
          aria-expanded={open}
        >
          {open ? '▾' : '▸'}
        </button>
      </PanelSectionTitle>

      {open && (
        <>
          <div className="truncate bg-[#222225] px-2 py-0.5 text-[10px] text-[#888]" title="Patches land on the active layer">
            onto <span className="text-[#ccc]">{layerName}</span>
            {palette.armedId && <span className="text-[#777]"> · Esc to stop</span>}
          </div>
          <div className="max-h-56 overflow-y-auto pb-1">
            {groups.map(([category, items]) => (
              <div key={category}>
                <div className="px-2 pt-1 text-[9px] font-semibold uppercase tracking-wider text-[#777]">{category}</div>
                <div className="grid grid-cols-2 gap-0.5 px-1">
                  {items.map((item) => {
                    const armed = item.id === palette.armedId;
                    const size = sizeLabel(item);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        title={[item.name, size, item.note].filter(Boolean).join(' · ')}
                        onClick={() => store.armPaletteItem(armed ? null : item.id)}
                        className={`flex min-w-0 items-center gap-1 rounded px-1 py-0.5 text-left text-[10px] leading-tight ${
                          armed ? 'bg-[#094771] text-white' : 'text-[#cccccc] hover:bg-[#2a2d2e]'
                        }`}
                      >
                        <PaletteSwatch item={item} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate">{item.name}</span>
                          {size && <span className="block truncate font-mono text-[9px] text-[#888]">{size}</span>}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            {groups.length === 0 && <div className="py-2 text-center text-[10px] text-[#666]">The host sent no materials</div>}
          </div>
        </>
      )}
    </div>
  );
}
