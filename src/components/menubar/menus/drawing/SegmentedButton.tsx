// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
export interface SegmentedButtonProps {
  label: string;
  active: boolean;
  onSelect: () => void;
}

/** One segment of a small pill-style toggle group inside the Drawing menu. */
export function SegmentedButton({ label, active, onSelect }: SegmentedButtonProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={
        'rounded px-2 py-0.5 text-[11px] font-semibold transition-colors ' +
        (active ? 'bg-[#f4902c] text-[#1e1e1e]' : 'text-[#888] hover:text-white')
      }
    >
      {label}
    </button>
  );
}
