// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Units } from '../../../../core/types';

/** A DXF held between picking the file and confirming its units in the modal. */
export interface PendingDxfImport {
  text: string;
  filename: string;
  detectedUnit: Units;
}
