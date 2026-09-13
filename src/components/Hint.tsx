// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { useUi } from '../state/useUi';

/** Transient instruction bubble above the bottom of the canvas. */
export function Hint() {
  const { hint } = useUi();
  return (
    <div
      className={
        'pointer-events-none absolute bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap ' +
        'rounded-md bg-ink px-4 py-2 text-[13px] font-medium text-paper ' +
        'shadow-[0_8px_24px_-8px_rgba(21,24,27,.4)] transition-opacity duration-400 ' +
        (hint.visible ? 'opacity-100' : 'opacity-0')
      }
    >
      {hint.text}
    </div>
  );
}
