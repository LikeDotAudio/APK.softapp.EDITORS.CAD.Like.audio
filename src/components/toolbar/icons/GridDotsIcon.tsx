// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
/** Dotted grid — the dots grid mode. */
export function GridDotsIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" stroke="none">
      {[3, 8, 13].map((y) =>
        [3, 8, 13].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.2" />),
      )}
    </svg>
  );
}
