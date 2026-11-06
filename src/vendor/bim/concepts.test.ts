// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
// @ts-expect-error plain .mjs script, no types
import { conceptRows } from '../../../scripts/vendorBimConcepts.mjs';
import { CONCEPTS, DEFAULT_FLOW_DEFINITION } from '../../flow/concepts';

/* src/vendor/bim/concepts.json is the BIM library's concepts (ROAD-3588). Inside an
   APK.audio checkout this fails on any difference and says how to refresh it; a
   standalone checkout has no library to compare against and skips. */
let library: string | null = null;
for (let dir = resolve(__dirname, '../../..'); ; dir = dirname(dir)) {
  const lib = join(dir, 'PODS/POD.database/DATABASE.server.BIM/SRC/library');
  if (existsSync(join(lib, 'concept'))) { library = lib; break; }
  if (dirname(dir) === dir) break;
}

describe('the placeable concepts', () => {
  it('include the Flow tool\'s default and have unique ids', () => {
    expect(CONCEPTS.some((d) => d.id === DEFAULT_FLOW_DEFINITION)).toBe(true);
    expect(new Set(CONCEPTS.map((d) => d.id)).size).toBe(CONCEPTS.length);
  });
});

describe.skipIf(!library)('the vendored concepts are the BIM library\'s', () => {
  it('concepts.json', () => {
    const mine = JSON.parse(readFileSync(join(__dirname, 'concepts.json'), 'utf8')).concepts;
    const theirs = conceptRows(library!);
    const key = (r: { part: string }) => r.part;
    const sort = (a: { part: string }[]) => [...a].sort((x, y) => key(x).localeCompare(key(y)));
    expect(sort(mine), 'fix: node scripts/vendorBimConcepts.mjs').toEqual(sort(theirs));
  });
});
