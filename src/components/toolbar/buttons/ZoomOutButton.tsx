// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { useStore } from '../../../state/useStore';
import { ZoomOutIcon } from '../icons/ZoomOutIcon';
import { PaletteButton } from '../PaletteButton';

/** Step the zoom out about the canvas centre. */
export function ZoomOutButton() {
  const store = useStore();

  return (
    <PaletteButton title="Zoom Out" onSelect={() => store.zoomOut()}>
      <div className="h-4 w-4">
        <ZoomOutIcon />
      </div>
    </PaletteButton>
  );
}
