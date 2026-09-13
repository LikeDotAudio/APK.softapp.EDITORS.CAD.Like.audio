// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { ReactNode } from 'react';

export interface MenuDropdownProps {
  /** Tailwind width class for the panel, e.g. "w-48". */
  width: string;
  /** Cap the height and scroll when a menu has many rows. */
  scroll?: boolean;
  /** Roomier padding for panels holding controls rather than plain rows. */
  roomy?: boolean;
  children: ReactNode;
}

/** The panel that drops below a menu bar button. */
export function MenuDropdown({ width, scroll = false, roomy = false, children }: MenuDropdownProps) {
  return (
    <div
      className={
        'absolute left-0 top-7 z-50 flex flex-col rounded border border-[#454545] bg-[#252526] shadow-xl ' +
        width +
        (roomy ? ' gap-3 p-2.5' : ' gap-0.5 p-1') +
        (scroll ? ' max-h-96 overflow-y-auto' : '')
      }
    >
      {children}
    </div>
  );
}
