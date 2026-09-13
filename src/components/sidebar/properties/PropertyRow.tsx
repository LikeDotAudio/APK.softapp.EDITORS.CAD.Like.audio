// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
export interface PropertyRowProps {
  label: string;
  children: React.ReactNode;
}

/**
 * Label on the left, control on the right — the property editor's grid.
 *
 * `min-w-0` on the row and a fixed, non-shrinking label are what keep the rail
 * from scrolling sideways: without it a `<select>` refuses to shrink below its
 * widest option and pushes the row past the panel width.
 */
export function PropertyRow({ label, children }: PropertyRowProps) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-2">
      <span className="w-20 shrink-0 text-[#888]">{label}</span>
      {children}
    </div>
  );
}
