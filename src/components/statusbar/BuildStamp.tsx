// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { BUILD_STAMP } from '../../build/buildInfo';

/** Revision of the running build, stamped at compile time. */
export function BuildStamp() {
  return (
    <span className="text-[11px] text-[#777]" title="Build revision — a fingerprint of the sources this bundle was compiled from">
      {BUILD_STAMP}
    </span>
  );
}
