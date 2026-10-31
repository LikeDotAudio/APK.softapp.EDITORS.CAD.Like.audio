#!/usr/bin/env node
// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
/**
 * INTERFACES TABLE — `scripts/fixtures/Interfaces.json` is still byte-identical
 * to the OS's `PODS/POD.THIN/OS/Interfaces/APK-Shop/Interfaces.json`.
 *
 * `verifyFlow.ts` (section 9, the join) reads ONLY the vendored copy, so the
 * gate tests the same table in every checkout. That means nothing else notices
 * when the OS edits its Terminals table. This walks up from the repo looking
 * for the monorepo's copy; when it finds one it fails on any difference and
 * prints the cp that fixes it. A standalone checkout (CI, a fork) has no OS
 * above it: it says so and passes, because there is nothing to compare
 * against — exactly as check-brand-tokens.mjs does.
 *
 *   node scripts/check-interfaces.mjs
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const vendored = join(repo, 'scripts/fixtures/Interfaces.json');
const REL = 'PODS/POD.THIN/OS/Interfaces/APK-Shop/Interfaces.json';

let source = null;
for (let dir = dirname(repo); ; dir = dirname(dir)) {
  const candidate = join(dir, REL);
  if (existsSync(candidate)) { source = candidate; break; }
  if (dirname(dir) === dir) break;
}

if (!source) {
  console.log(`interfaces: no monorepo ${REL} above this checkout — not compared`);
  process.exit(0);
}
if (readFileSync(vendored, 'utf8') === readFileSync(source, 'utf8')) {
  console.log(`interfaces: scripts/fixtures/Interfaces.json matches ${source}`);
  process.exit(0);
}
console.error(`interfaces: scripts/fixtures/Interfaces.json differs from ${source}`);
console.error(`  fix: cp '${source}' '${vendored}'`);
process.exit(1);
