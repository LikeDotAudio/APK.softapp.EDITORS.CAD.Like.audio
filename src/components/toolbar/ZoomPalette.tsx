// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { ZoomAllButton } from './buttons/ZoomAllButton';
import { ZoomInButton } from './buttons/ZoomInButton';
import { ZoomOutButton } from './buttons/ZoomOutButton';
import { PaletteGrid } from './PaletteGrid';
import { PaletteHeading } from './PaletteHeading';

/** Zoom in, zoom out, and zoom all. */
export function ZoomPalette() {
  return (
    <>
      <PaletteHeading label="Zoom" />
      <PaletteGrid label="Zoom">
        <ZoomInButton />
        <ZoomOutButton />
        <ZoomAllButton />
      </PaletteGrid>
    </>
  );
}
