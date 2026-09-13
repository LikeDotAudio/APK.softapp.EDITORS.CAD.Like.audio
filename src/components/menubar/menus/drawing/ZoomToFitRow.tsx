// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { useStore } from '../../../../state/useStore';

export interface ZoomToFitRowProps {
  onDone: () => void;
}

/** Fit the whole drawing in the viewport — same action as Zoom All in the toolbar. */
export function ZoomToFitRow({ onDone }: ZoomToFitRowProps) {
  const store = useStore();

  return (
    <button
      type="button"
      onClick={() => {
        onDone();
        store.zoomToFit();
      }}
      className="flex items-center justify-between rounded border border-[#3c3c3c] bg-[#1e1e1e] p-2 text-[11px] font-semibold text-white transition-colors hover:bg-[rgba(244,144,44,0.18)]"
    >
      <span className="flex items-center gap-2">🔍 Zoom to Fit Extent</span>
    </button>
  );
}
