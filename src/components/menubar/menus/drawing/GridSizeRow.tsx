// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { useStore } from '../../../../state/useStore';
import { useUi } from '../../../../state/useUi';

/** Numeric grid spacing, in the current document units. */
export function GridSizeRow() {
  const store = useStore();
  const { gridSize } = useUi();

  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] text-[#aaa]">Grid Size:</span>
      <input
        type="number"
        step="0.05"
        min="0.01"
        value={gridSize}
        onChange={(e) => store.setGridSize(parseFloat(e.target.value))}
        className="w-20 rounded border border-[#3c3c3c] bg-[#1e1e1e] px-2 py-0.5 text-center text-[11px] text-white focus:border-[#f4902c] focus:outline-none"
      />
    </div>
  );
}
