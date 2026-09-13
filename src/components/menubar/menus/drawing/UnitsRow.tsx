// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { useStore } from '../../../../state/useStore';
import { useUi } from '../../../../state/useUi';
import { SegmentedButton } from './SegmentedButton';

/** Inch/mm switch. Changing units rescales the whole document. */
export function UnitsRow() {
  const store = useStore();
  const { units } = useUi();

  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] text-[#aaa]">Units:</span>
      <div className="flex rounded border border-[#3c3c3c] bg-[#1e1e1e] p-0.5">
        <SegmentedButton label="inch" active={units === 'in'} onSelect={() => store.setUnits('in')} />
        <SegmentedButton label="mm" active={units === 'mm'} onSelect={() => store.setUnits('mm')} />
      </div>
    </div>
  );
}
