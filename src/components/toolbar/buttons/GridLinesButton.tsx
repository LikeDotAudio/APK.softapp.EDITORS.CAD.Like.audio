// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { useStore } from '../../../state/useStore';
import { useUi } from '../../../state/useUi';
import { GridLinesIcon } from '../icons/GridLinesIcon';
import { PaletteButton } from '../PaletteButton';

/** Switch the grid to ruled lines. */
export function GridLinesButton() {
  const store = useStore();
  const { gridMode } = useUi();

  return (
    <PaletteButton
      title="Grid: Lines"
      active={gridMode === 'lines'}
      onSelect={() => store.setGridMode('lines')}
    >
      <div className="h-4 w-4">
        <GridLinesIcon />
      </div>
    </PaletteButton>
  );
}
