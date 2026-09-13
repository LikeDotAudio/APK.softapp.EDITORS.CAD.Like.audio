// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { useStore } from '../../../state/useStore';
import { useUi } from '../../../state/useUi';
import { GridOffIcon } from '../icons/GridOffIcon';
import { PaletteButton } from '../PaletteButton';

/** Hide the grid. The axes and snapping stay as they are. */
export function GridOffButton() {
  const store = useStore();
  const { gridMode } = useUi();

  return (
    <PaletteButton
      title="Grid: Off"
      active={gridMode === 'off'}
      onSelect={() => store.setGridMode('off')}
    >
      <div className="h-4 w-4">
        <GridOffIcon />
      </div>
    </PaletteButton>
  );
}
