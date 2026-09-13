// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
export interface PanelSectionTitleProps {
  label: string;
  children?: React.ReactNode;
}

/** Grey title strip at the top of a sidebar section. */
export function PanelSectionTitle({ label, children }: PanelSectionTitleProps) {
  return (
    <div className="flex items-center justify-between border-b border-[#3b3b3b] bg-[#2d2d2d] px-2.5 py-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-[#999]">{label}</span>
      {children}
    </div>
  );
}
