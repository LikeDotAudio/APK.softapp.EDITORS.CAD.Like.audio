// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
export interface PaletteHeadingProps {
  label: string;
}

/** Small caps label above a group of palette buttons. */
export function PaletteHeading({ label }: PaletteHeadingProps) {
  return (
    <div className="w-full py-0.5 text-center font-mono text-[9px] uppercase tracking-wider text-[#777]">
      {label}
    </div>
  );
}
