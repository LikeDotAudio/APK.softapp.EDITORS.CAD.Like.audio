// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { ZoomAllButton } from '../toolbar/buttons/ZoomAllButton';
import { ZoomInButton } from '../toolbar/buttons/ZoomInButton';
import { ZoomOutButton } from '../toolbar/buttons/ZoomOutButton';
import { StatusPalette } from './StatusPalette';
import { ZoomFader } from './ZoomFader';

/** Zoom out, the zoom fader, zoom in, and zoom all. */
export function ZoomPalette() {
  return (
    <StatusPalette label="Zoom">
      <ZoomOutButton />
      <ZoomFader />
      <ZoomInButton />
      <ZoomAllButton />
    </StatusPalette>
  );
}
