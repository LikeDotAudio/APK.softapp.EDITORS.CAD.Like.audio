// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { ReactNode } from 'react';

export interface StatusPaletteProps {
  label: string;
  children: ReactNode;
}

/**
 * A run of palette buttons laid out along the status bar, with its small caps
 * label in front. The buttons are the left rail's own PaletteButtons, sized
 * down to square cells.
 */
export function StatusPalette({ label, children }: StatusPaletteProps) {
  return (
    <div role="group" aria-label={label} className="flex items-center gap-px">
      <span className="mr-1.5 font-mono text-[9px] uppercase tracking-wider text-[#777]">{label}</span>
      <div className="flex items-center gap-px [&>button]:h-5 [&>button]:w-6 [&>button]:rounded-sm">{children}</div>
    </div>
  );
}
