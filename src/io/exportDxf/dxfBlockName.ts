// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
/**
 * A DXF block name a strict reader will accept: letters, digits, `$`, `-` and
 * `_`, upper-cased. The catalogue already names its symbols this way; this is
 * what keeps a hand-authored one from writing a name that loads nowhere.
 */
export function dxfBlockName(name: string): string {
  const cleaned = name
    .toUpperCase()
    .replace(/[^A-Z0-9$\-_]/g, '_')
    .replace(/^_+/, '');
  return cleaned || 'BLOCK';
}
