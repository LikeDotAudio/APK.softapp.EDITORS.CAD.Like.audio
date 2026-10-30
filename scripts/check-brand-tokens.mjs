#!/usr/bin/env node
// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
/**
 * BRAND TOKENS — `src/tokens/brand.json` is still byte-identical to the
 * monorepo's `contracts/tokens/brand.json`.
 *
 * The copy is vendored (no runtime fetch) so this repo builds on its own. That
 * means nothing else notices when the source changes. This walks up from the
 * repo looking for `contracts/tokens/brand.json`; when it finds one (a checkout
 * inside APK.audio) it fails on any difference and prints the cp that fixes it.
 * A standalone checkout (CI, a fork) has no monorepo above it: it says so and
 * passes, because there is nothing to compare against.
 *
 *   node scripts/check-brand-tokens.mjs
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const vendored = join(repo, 'src/tokens/brand.json');

let source = null;
for (let dir = dirname(repo); ; dir = dirname(dir)) {
  const candidate = join(dir, 'contracts/tokens/brand.json');
  if (existsSync(candidate)) { source = candidate; break; }
  if (dirname(dir) === dir) break;
}

if (!source) {
  console.log('brand tokens: no monorepo contracts/tokens/brand.json above this checkout — not compared');
  process.exit(0);
}
if (readFileSync(vendored, 'utf8') === readFileSync(source, 'utf8')) {
  console.log(`brand tokens: src/tokens/brand.json matches ${source}`);
  process.exit(0);
}
console.error(`brand tokens: src/tokens/brand.json differs from ${source}`);
console.error(`  fix: cp '${source}' '${vendored}'`);
process.exit(1);
