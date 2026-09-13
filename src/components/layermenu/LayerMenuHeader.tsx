// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Layer } from '../../core/types';

export interface LayerMenuHeaderProps {
  layer: Layer;
}

/** Names the layer the menu is acting on, with its colour swatch. */
export function LayerMenuHeader({ layer }: LayerMenuHeaderProps) {
  return (
    <div className="mb-0.5 flex items-center justify-between border-b border-[#3c3c3c] px-3 py-1 font-mono text-[10px] font-bold uppercase text-[#888]">
      <span className="truncate">Layer: {layer.name}</span>
      <span
        className="h-2.5 w-2.5 rounded-sm border border-[#555]"
        style={{ backgroundColor: layer.color }}
      />
    </div>
  );
}
