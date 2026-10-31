#!/usr/bin/env node
// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
/**
 * BRAND LITERALS — the accent is never spelled in `src/`.
 *
 * `src/tokens/brand.json` (held to the monorepo's by check-brand-tokens.mjs) is
 * the one place the accent's value is written. Tailwind classes say `*-accent`
 * (`--color-accent`, set at startup in main.tsx), code reads `COLORS.accent` /
 * `ACCENT_RGB` from colorsStyle.ts. This counts the accent hex and its rgb()
 * triple in every .ts/.tsx/.css/.html under src/ and index.html and fails on
 * any (SDK/contracts audit WS-07). The ceiling is zero: there is no backlog.
 *
 *   node scripts/check-brand-literals.mjs
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const brand = JSON.parse(readFileSync(join(repo, 'src/tokens/brand.json'), 'utf8'));
const [r, g, b] = brand.accent.rgb;
const pattern = new RegExp(`${brand.accent.hex}\\b|rgba?\\(\\s*${r}\\s*,\\s*${g}\\s*,\\s*${b}\\b`, 'gi');

const files = [];
const walk = (p) => {
  if (statSync(p).isDirectory()) for (const e of readdirSync(p)) walk(join(p, e));
  else if (/\.(tsx?|css|html)$/.test(p)) files.push(p);
};
walk(join(repo, 'src'));
files.push(join(repo, 'index.html'));

const hits = [];
for (const f of files) {
  const n = (readFileSync(f, 'utf8').match(pattern) ?? []).length;
  if (n) hits.push(`${relative(repo, f)}: ${n}`);
}
if (hits.length) {
  console.error(`brand literals: the accent is spelled out in ${hits.length} file(s) — use *-accent / COLORS.accent / ACCENT_RGB`);
  for (const h of hits) console.error(`  ${h}`);
  process.exit(1);
}
console.log(`brand literals: none in ${files.length} files`);
