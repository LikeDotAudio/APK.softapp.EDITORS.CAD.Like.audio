// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { useUi } from '../../state/useUi';

/** How many edges the drawing holds. */
export function EdgeCountReadout() {
  const { edgeCount } = useUi();

  return (
    <span className="tracking-[0.04em] text-[#aaa]">
      {edgeCount} edge{edgeCount === 1 ? '' : 's'}
    </span>
  );
}
