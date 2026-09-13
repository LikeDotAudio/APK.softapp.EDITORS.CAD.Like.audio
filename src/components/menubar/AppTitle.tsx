// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { useEntrance } from '../../shell/EntranceContext';

/**
 * Wordmark at the left edge of the header. It says which ENTRANCE this window
 * came in by — `BIG PICTURE.LIKE.AUDIO` or `CAD.LIKE.AUDIO` — because two
 * desktop tiles run this one bundle and a person looking at a window has to be
 * able to tell which of them they opened (PLAN-60.07).
 */
export function AppTitle() {
  const { title, subtitle } = useEntrance();
  return (
    <h1 className="font-mono text-[11px] uppercase tracking-[0.14em]">
      <span className="font-bold text-white">{title}</span>
      <span className="font-normal text-[#f4902c]">{subtitle}</span>
    </h1>
  );
}
