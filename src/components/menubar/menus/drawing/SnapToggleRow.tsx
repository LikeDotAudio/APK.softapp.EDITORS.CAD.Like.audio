// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { useStore } from '../../../../state/useStore';
import { useUi } from '../../../../state/useUi';

/** Grid snapping. Endpoint and midpoint snapping stay on regardless. */
export function SnapToggleRow() {
  const store = useStore();
  const { snapToGrid } = useUi();

  return (
    <label className="flex cursor-pointer select-none items-center justify-between">
      <span className="text-[11px] text-[#aaa]">Snap Function:</span>
      <input
        type="checkbox"
        checked={snapToGrid}
        onChange={(e) => store.setSnapToGrid(e.target.checked)}
        className="h-4 w-4 rounded border-[#3c3c3c] bg-[#1e1e1e] accent-[#f4902c]"
      />
    </label>
  );
}
