// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { ReactNode } from 'react';

export interface PaletteGridProps {
  /** Accessible name for the group — what these buttons have in common. */
  label: string;
  children: ReactNode;
}

/**
 * Two-column grid the palette buttons sit in, and the only thing that tells a
 * screen reader where one palette ends and the next begins: the left rail is
 * three of these stacked, and without a name each is an unlabelled run of
 * icon buttons.
 */
export function PaletteGrid({ label, children }: PaletteGridProps) {
  return (
    <div role="group" aria-label={label} className="grid w-full grid-cols-2 gap-0 bg-[#1e1e1e] p-0">
      {children}
    </div>
  );
}
