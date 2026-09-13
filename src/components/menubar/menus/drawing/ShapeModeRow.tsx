// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { useStore } from '../../../../state/useStore';
import { useUi } from '../../../../state/useUi';

/** SHPE mode flags loose ends and crossings so a shape can actually be cut. */
export function ShapeModeRow() {
  const store = useStore();
  const { shapeMode } = useUi();

  return (
    <label className="flex cursor-pointer select-none items-center justify-between rounded border border-[#3c3c3c] bg-[#1e1e1e] p-2">
      <div className="flex flex-col">
        <span className="text-[11px] font-semibold text-white">SHPE Mode</span>
        <span className="text-[9px] text-[#888]">Closed shape validation</span>
      </div>
      <input
        type="checkbox"
        checked={shapeMode}
        onChange={(e) => store.setShapeMode(e.target.checked)}
        className="h-4 w-4 rounded border-[#3c3c3c] bg-[#1e1e1e] accent-[#f4902c]"
      />
    </label>
  );
}
