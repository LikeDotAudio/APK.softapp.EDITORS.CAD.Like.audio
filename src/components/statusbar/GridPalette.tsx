// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { GridDotsButton } from '../toolbar/buttons/GridDotsButton';
import { GridLinesButton } from '../toolbar/buttons/GridLinesButton';
import { GridOffButton } from '../toolbar/buttons/GridOffButton';
import { StatusPalette } from './StatusPalette';

/** Grid display mode — lines, dots, or hidden. One button per mode. */
export function GridPalette() {
  return (
    <StatusPalette label="Grid">
      <GridLinesButton />
      <GridDotsButton />
      <GridOffButton />
    </StatusPalette>
  );
}
