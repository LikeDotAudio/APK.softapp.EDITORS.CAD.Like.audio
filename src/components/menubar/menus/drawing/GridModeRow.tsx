// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { useStore } from '../../../../state/useStore';
import { useUi } from '../../../../state/useUi';
import { SegmentedButton } from './SegmentedButton';

/** Lines / dots / off — mirrors the three grid buttons in the vertical toolbar. */
export function GridModeRow() {
  const store = useStore();
  const { gridMode } = useUi();

  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] text-[#aaa]">Grid Mode:</span>
      <div className="flex items-center rounded border border-[#3c3c3c] bg-[#1e1e1e] p-0.5">
        <SegmentedButton label="Lines" active={gridMode === 'lines'} onSelect={() => store.setGridMode('lines')} />
        <SegmentedButton label="Dots" active={gridMode === 'dots'} onSelect={() => store.setGridMode('dots')} />
        <SegmentedButton label="Off" active={gridMode === 'off'} onSelect={() => store.setGridMode('off')} />
      </div>
    </div>
  );
}
