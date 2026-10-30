// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { ReactNode } from 'react';

export interface PaletteGridProps {
  /** Accessible name for the group — what these buttons have in common. */
  label: string;
  children: ReactNode;
}

/**
 * Single-file column the palette buttons sit in, and the only thing that tells a
 * screen reader what they are: without a name it is an unlabelled run of icon
 * buttons.
 */
export function PaletteGrid({ label, children }: PaletteGridProps) {
  return (
    <div role="group" aria-label={label} className="grid w-full grid-cols-1 gap-0 bg-[#1e1e1e] p-0">
      {children}
    </div>
  );
}
