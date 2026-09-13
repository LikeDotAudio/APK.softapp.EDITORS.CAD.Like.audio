// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { useUi } from '../state/useUi';

const BASE =
  'inline-flex items-center gap-1.5 rounded border px-2.5 py-1 font-mono text-[11px] ' +
  'font-medium uppercase tracking-[0.06em]';

/** One-line summary of whether the drawing can be cut. */
export function ValidationPill() {
  const { edgeCount, validation, shapeMode } = useUi();

  if (!shapeMode) {
    if (edgeCount === 0) {
      return (
        <span className={`${BASE} border-[#3c3c3c] bg-[#1e1e1e] text-[#888]`}>
          · Draw to begin (SHPE Mode: OFF)
        </span>
      );
    }
    return (
      <span className={`${BASE} border-[#166534]/50 bg-[#14532d]/30 text-[#4ade80]`}>
        ✓ Ready (SHPE Mode: OFF)
      </span>
    );
  }

  if (edgeCount === 0) {
    return (
      <span className={`${BASE} border-[#3c3c3c] bg-[#1e1e1e] text-[#888]`}>· Draw to begin</span>
    );
  }
  if (validation.valid) {
    return (
      <span className={`${BASE} border-[#166534]/50 bg-[#14532d]/30 text-[#4ade80]`}>✓ Ready to cut</span>
    );
  }
  return (
    <span
      className={`${BASE} border-[#991b1b]/50 bg-[#7f1d1d]/30 text-[#f87171]`}
      title={validation.errs.join(' · ')}
    >
      ✕ {validation.errs[0]}
    </span>
  );
}
