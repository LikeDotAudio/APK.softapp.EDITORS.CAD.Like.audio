// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { useStore } from '../../../state/useStore';
import { ZoomAllIcon } from '../icons/ZoomAllIcon';
import { PaletteButton } from '../PaletteButton';

/** Fit the whole drawing in the viewport. */
export function ZoomAllButton() {
  const store = useStore();

  return (
    <PaletteButton title="Zoom All — fit drawing extents" wide onSelect={() => store.zoomToFit()}>
      <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider">
        <span className="h-3.5 w-3.5">
          <ZoomAllIcon />
        </span>
        All
      </span>
    </PaletteButton>
  );
}
