// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { useStore } from '../state/useStore';
import { useUi } from '../state/useUi';
import { LABEL_CAPS, NUMBER_INPUT } from './styles';

export function GridControls() {
  const store = useStore();
  const { gridSize, gridMode, snapToGrid } = useUi();

  return (
    <>
      <label className={LABEL_CAPS} htmlFor="grid-size">
        Grid
      </label>
      <input
        id="grid-size"
        type="number"
        step="0.05"
        min="0.01"
        value={gridSize}
        onChange={(e) => store.setGridSize(parseFloat(e.target.value))}
        className={NUMBER_INPUT}
      />
      <div className="flex items-center rounded border border-[#454545] bg-[#1e1e1e] p-0.5 text-[10px] font-semibold text-white">
        <button
          type="button"
          onClick={() => store.setGridMode('lines')}
          className={
            'px-2 py-0.5 rounded transition-colors ' +
            (gridMode === 'lines' ? 'bg-[#f4902c] text-[#1e1e1e]' : 'text-[#888] hover:text-white')
          }
        >
          Lines
        </button>
        <button
          type="button"
          onClick={() => store.setGridMode('dots')}
          className={
            'px-2 py-0.5 rounded transition-colors ' +
            (gridMode === 'dots' ? 'bg-[#f4902c] text-[#1e1e1e]' : 'text-[#888] hover:text-white')
          }
        >
          Dots
        </button>
      </div>
      <label className={`${LABEL_CAPS} flex items-center gap-1.5`}>
        <input
          type="checkbox"
          checked={snapToGrid}
          onChange={(e) => store.setSnapToGrid(e.target.checked)}
          className="h-3.5 w-3.5 cursor-pointer accent-ink"
        />
        Snap
      </label>
    </>
  );
}
