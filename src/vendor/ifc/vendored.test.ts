// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/*
 * src/vendor/ifc/{connectors,signal-formats}.json are BYTE copies of contracts/ifc/ — the closed
 * connector vocabulary and the signal-format vocabulary the connector palette reads (ROAD-3588).
 * src/vendor/ifc/{step,guid}.ts are BYTE copies of the monorepo's
 * contracts/src/ifc/{step,guid}.ts — the one STEP codec and the one GlobalId
 * rule, vendored (no runtime fetch) so this repo builds on its own, as
 * src/tokens/brand.json is. Inside an APK.audio checkout this fails on any
 * difference and prints the cp that fixes it; a standalone checkout has
 * nothing to compare against and skips.
 */
let contracts: string | null = null;
for (let dir = resolve(__dirname, '../../..'); ; dir = dirname(dir)) {
  if (existsSync(join(dir, 'contracts/src/ifc/step.ts'))) { contracts = join(dir, 'contracts/src/ifc'); break; }
  if (dirname(dir) === dir) break;
}

describe.skipIf(!contracts)('the vendored IFC codec is the contracts one', () => {
  for (const name of ['step.ts', 'guid.ts']) {
    it(name, () => {
      const mine = readFileSync(join(__dirname, name), 'utf8');
      const theirs = readFileSync(join(contracts!, name), 'utf8');
      expect(mine === theirs, `fix: cp '${join(contracts!, name)}' '${join(__dirname, name)}'`).toBe(true);
    });
  }
  for (const name of ['connectors.json', 'signal-formats.json']) {
    it(name, () => {
      const source = join(contracts!, '../../ifc', name);
      const mine = readFileSync(join(__dirname, name), 'utf8');
      const theirs = readFileSync(source, 'utf8');
      expect(mine === theirs, `fix: cp '${source}' '${join(__dirname, name)}'`).toBe(true);
    });
  }
});
