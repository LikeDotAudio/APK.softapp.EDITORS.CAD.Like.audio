// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { useStore } from '@state/useStore';
import { useUi } from '@state/useUi';
import { formatField } from '../../../../model/units/formatField';
import { fromDisplay } from '../../../../model/units/docUnits';

/** Numeric grid spacing, shown and typed in the display units (the grid itself is in mm, cad-1). */
export function GridSizeRow() {
  const store = useStore();
  const { gridSize, units } = useUi();

  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] text-[#aaa]">Grid Size:</span>
      <input
        type="number"
        step="0.05"
        min="0.01"
        value={parseFloat(formatField(gridSize, units))}
        onChange={(e) => store.setGridSize(fromDisplay(parseFloat(e.target.value), units))}
        className="w-20 rounded border border-[#3c3c3c] bg-[#1e1e1e] px-2 py-0.5 text-center text-[11px] text-white focus:border-accent focus:outline-none"
      />
    </div>
  );
}
