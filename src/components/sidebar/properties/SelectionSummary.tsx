// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { useUi } from '../../../state/useUi';

/** How many elements the property editor is describing. */
export function SelectionSummary() {
  const { selectionSize } = useUi();

  return (
    <div className="flex flex-col gap-1">
      <label className="text-[#888]">Selection:</label>
      <div className="flex items-center justify-between rounded border border-[#3c3c3c] bg-[#1e1e1e] px-2 py-1 text-white">
        <span>{selectionSize > 0 ? `${selectionSize} Element(s)` : 'No Selection'}</span>
        <span className="text-[#666]">▼</span>
      </div>
    </div>
  );
}
