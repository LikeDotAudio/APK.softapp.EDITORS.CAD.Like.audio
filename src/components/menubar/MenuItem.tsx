// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { ReactNode } from 'react';

export interface MenuItemProps {
  /** Emoji or glyph shown at the left edge of the row. */
  icon?: ReactNode;
  label: string;
  /** Right-aligned shortcut or command alias, e.g. "Ctrl+C" or "RO". */
  shortcut?: string;
  disabled?: boolean;
  onSelect: () => void;
}

/** One clickable row inside a dropdown. Every menu builds its rows from this. */
export function MenuItem({ icon, label, shortcut, disabled = false, onSelect }: MenuItemProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      className={
        'flex w-full items-center justify-between rounded px-3 py-1.5 text-left text-[12px] transition-colors ' +
        (disabled ? 'cursor-not-allowed opacity-40' : 'hover:bg-[rgba(244,144,44,0.18)] hover:text-white')
      }
    >
      <span className="flex items-center gap-2">
        {icon !== undefined && <span>{icon}</span>}
        {label}
      </span>
      {shortcut !== undefined && (
        <span className="ml-4 font-mono text-[10px] opacity-60">{shortcut}</span>
      )}
    </button>
  );
}
