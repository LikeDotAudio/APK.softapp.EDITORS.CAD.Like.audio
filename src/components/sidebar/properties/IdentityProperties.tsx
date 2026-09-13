// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { useUi } from '../../../state/useUi';
import { PropertyRow } from './PropertyRow';

/** Draw order and DXF handle. Display-only. */
export function IdentityProperties() {
  const { selectionSize } = useUi();

  return (
    <>
      <PropertyRow label="Draw Order:">
        <input
          type="text"
          readOnly
          value="0"
          className="min-w-0 flex-1 rounded border border-[#3c3c3c] bg-[#252526] px-2 py-0.5 text-[#777]"
        />
      </PropertyRow>

      <PropertyRow label="Handle:">
        <input
          type="text"
          readOnly
          value={selectionSize > 0 ? '0x1A' : ''}
          className="min-w-0 flex-1 rounded border border-[#3c3c3c] bg-[#252526] px-2 py-0.5 font-mono text-[#777]"
        />
      </PropertyRow>
    </>
  );
}
