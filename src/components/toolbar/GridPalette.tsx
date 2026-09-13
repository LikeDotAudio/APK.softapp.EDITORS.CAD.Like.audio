// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { GridDotsButton } from './buttons/GridDotsButton';
import { GridLinesButton } from './buttons/GridLinesButton';
import { GridOffButton } from './buttons/GridOffButton';
import { PaletteGrid } from './PaletteGrid';
import { PaletteHeading } from './PaletteHeading';

/** Grid display mode — lines, dots, or hidden. One button per mode. */
export function GridPalette() {
  return (
    <>
      <PaletteHeading label="Grid" />
      <PaletteGrid label="Grid">
        <GridLinesButton />
        <GridDotsButton />
        <GridOffButton />
      </PaletteGrid>
    </>
  );
}
