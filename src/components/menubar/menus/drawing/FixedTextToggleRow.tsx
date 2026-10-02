// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { useStore } from '../../../../state/useStore';
import { useUi } from '../../../../state/useUi';

/** Toggle fixed text screen size (no zoom scaling) vs true world scale. */
export function FixedTextToggleRow() {
  const store = useStore();
  const { fixedTextSize } = useUi();

  return (
    <label className="flex cursor-pointer select-none items-center justify-between" title="Keep text at a fixed readable size without scaling when zooming in or out">
      <span className="text-[11px] text-[#aaa]">Fixed Text Size:</span>
      <input
        type="checkbox"
        checked={fixedTextSize}
        onChange={() => store.toggleFixedTextSize()}
        className="h-4 w-4 rounded border-[#3c3c3c] bg-[#1e1e1e] accent-[#f4902c]"
      />
    </label>
  );
}
