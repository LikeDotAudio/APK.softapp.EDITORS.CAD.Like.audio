// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/*
 * src/vendor/kicad/{kicadLibrary,klcRules}.js are BYTE copies of DATATYPE.KiCad js/ — the one KiCad
 * symbol / sheet writer and the KLC rule index (DATA.KICAD SRC/Reference/KLC), vendored so this repo
 * builds on its own. Inside an APK.audio checkout this fails on any difference and prints the cp that
 * fixes it; a standalone checkout has nothing to compare against and skips.
 */
let source: string | null = null;
for (let dir = resolve(__dirname, '../../..'); ; dir = dirname(dir)) {
  const js = join(dir, 'PODS/POD.THIN/Softapps/DATATYPE/DATATYPE.KiCad/js');
  if (existsSync(join(js, 'kicadLibrary.js'))) { source = js; break; }
  const sibling = join(dir, 'DATATYPE/DATATYPE.KiCad/js');
  if (existsSync(join(sibling, 'kicadLibrary.js'))) { source = sibling; break; }
  if (dirname(dir) === dir) break;
}

describe.skipIf(!source)('the vendored KiCad library is DATATYPE.KiCad\'s', () => {
  for (const name of ['kicadLibrary.js', 'klcRules.js']) {
    it(name, () => {
      const mine = readFileSync(join(__dirname, name), 'utf8');
      const theirs = readFileSync(join(source!, name), 'utf8');
      expect(mine === theirs, `fix: cp '${join(source!, name)}' '${join(__dirname, name)}'`).toBe(true);
    });
  }
});
