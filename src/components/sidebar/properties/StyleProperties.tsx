// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { useUi } from '../../../state/useUi';
import { PropertyRow } from './PropertyRow';

/** Lineweight, linetype and scale. Display-only for now — nothing reads them yet. */
export function StyleProperties() {
  const { selectionProtected } = useUi();
  const selectClass =
    'min-w-0 flex-1 rounded border border-[#3c3c3c] bg-[#2d2d2d] px-2 py-0.5 text-[#aaa] disabled:cursor-not-allowed disabled:opacity-50';

  return (
    <>
      <PropertyRow label="Lineweight:">
        <select disabled={selectionProtected} className={selectClass}>
          <option>— By Layer</option>
          <option>0.15 mm</option>
          <option>0.25 mm</option>
          <option>0.50 mm</option>
        </select>
      </PropertyRow>

      <PropertyRow label="Linetype:">
        <select disabled={selectionProtected} className={selectClass}>
          <option>Continuous</option>
          <option>Dashed</option>
          <option>Dotted</option>
        </select>
      </PropertyRow>

      <PropertyRow label="Linetype Scale:">
        <input
          type="text"
          readOnly
          value="1.0"
          className="min-w-0 flex-1 rounded border border-[#3c3c3c] bg-[#252526] px-2 py-0.5 text-[#777]"
        />
      </PropertyRow>
    </>
  );
}
