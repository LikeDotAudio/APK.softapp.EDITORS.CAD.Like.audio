// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
/** DXF group code + value, one per line. */
export function pair(code: string, value: string | number): string {
  return `${code}\n${value}\n`;
}
