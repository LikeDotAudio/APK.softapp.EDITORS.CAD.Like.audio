// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { REPO_URL } from '../../build/buildInfo';

/** Link out to the source repository for this build. */
export function RepositoryLink() {
  return (
    <a
      href={REPO_URL}
      target="_blank"
      rel="noreferrer noopener"
      className="text-[11px] text-[#f4902c] transition-colors hover:text-[#ffa552] hover:underline"
      title={REPO_URL}
    >
      Repository ↗
    </a>
  );
}
