// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { useStore } from '../../../state/useStore';
import { useUi } from '../../../state/useUi';
import { GridDotsIcon } from '../icons/GridDotsIcon';
import { PaletteButton } from '../PaletteButton';

/** Switch the grid to dots at each intersection. */
export function GridDotsButton() {
  const store = useStore();
  const { gridMode } = useUi();

  return (
    <PaletteButton
      title="Grid: Dots"
      active={gridMode === 'dots'}
      onSelect={() => store.setGridMode('dots')}
    >
      <div className="h-4 w-4">
        <GridDotsIcon />
      </div>
    </PaletteButton>
  );
}
