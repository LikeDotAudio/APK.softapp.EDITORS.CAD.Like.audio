#!/usr/bin/env node
// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
/**
 * MOUNT REACH — every component this app ships is reachable from `main.tsx`.
 *
 * `tsc --noEmit` proves the tree compiles; it says nothing about whether a
 * component is ever rendered. A panel that was replaced, a rail that lost its
 * last caller, a dialog behind a flag that was deleted: all of them still
 * typecheck, still lint, and still cost a reader the time to work out whether
 * they matter. 86 files in `components/` and 23 in `tools/` is more than
 * anybody holds in their head.
 *
 * So this walks the import graph from `src/main.tsx` and reports every `.tsx`
 * that exports something component-shaped and is not in it. It is a RATCHET,
 * not a rule: the count today is written to `check-mount-reach.baseline.json`
 * and the script fails when it GROWS. Deleting an orphan lowers it; wiring one
 * up lowers it; adding a new one that nothing renders fails the build.
 *
 * Deliberately dependency-free and deliberately regex-based — see the same
 * argument in `verifyFlow.ts`. A real module resolver would be more correct
 * and would need a parser this project does not otherwise carry. The failure
 * mode of the crude version is a FALSE ORPHAN, which is loud and gets fixed,
 * not a missed one.
 *
 * Reimplemented for this tree rather than copied from `oneScope/frontend/
 * scripts/`: those files open with a proprietary notice that may not be
 * distributed, and this application is MIT with a public repository.
 *
 *   node scripts/check-mount-reach.mjs                 check
 *   node scripts/check-mount-reach.mjs --set-baseline  re-record after a fix
 */
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const APP = resolve(HERE, '..');
const SRC = join(APP, 'src');
const ENTRY = join(SRC, 'main.tsx');
const BASELINE = join(HERE, 'check-mount-reach.baseline.json');

/** Every `from '...'` and `import('...')`, static and dynamic alike. */
const SPECIFIERS = /(?:from\s*|import\s*\(\s*)['"]([^'"]+)['"]/g;

/** `export function Foo`, `export const Foo =`, `export default function Foo`.
 *  Capitalised, because that is what JSX requires of a component. */
const COMPONENT = /export\s+(?:default\s+)?(?:function|const|class)\s+([A-Z]\w*)/;

const EXTENSIONS = ['', '.tsx', '.ts', '/index.tsx', '/index.ts'];

function resolveSpecifier(fromFile, spec) {
  if (!spec.startsWith('.')) return null;          // a package, not our source
  const base = resolve(dirname(fromFile), spec);
  for (const ext of EXTENSIONS) {
    const candidate = base.replace(/\.tsx?$/, '') + ext;
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  if (existsSync(base) && statSync(base).isFile()) return base;
  return null;
}

function reachableFrom(entry) {
  const seen = new Set();
  const queue = [entry];
  while (queue.length) {
    const file = queue.pop();
    if (seen.has(file)) continue;
    seen.add(file);
    let text;
    try { text = readFileSync(file, 'utf8'); } catch { continue; }
    for (const [, spec] of text.matchAll(SPECIFIERS)) {
      const target = resolveSpecifier(file, spec);
      if (target && !seen.has(target)) queue.push(target);
    }
  }
  return seen;
}

function everyTsx(dir) {
  const out = [];
  for (const entry of readdirSync(dir).sort()) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...everyTsx(full));
    else if (entry.endsWith('.tsx')) out.push(full);
  }
  return out;
}

if (!existsSync(ENTRY)) {
  console.error(`check-mount-reach: entry point is missing: ${relative(APP, ENTRY)}`);
  process.exit(1);
}

const reached = reachableFrom(ENTRY);
const orphans = everyTsx(SRC)
  .filter((f) => !reached.has(f))
  .filter((f) => COMPONENT.test(readFileSync(f, 'utf8')))
  .map((f) => relative(APP, f));

if (process.argv.includes('--set-baseline')) {
  writeFileSync(BASELINE, JSON.stringify({
    maximum: orphans.length,
    orphans,
    note: 'Components not reachable from src/main.tsx. A CEILING: this fails when the '
        + 'number GROWS. Lower it by rendering the component or deleting it, then re-run '
        + 'with --set-baseline. PLAN-111.02 step 4.',
  }, null, 2) + '\n');
  console.log(`check-mount-reach: baseline set to ${orphans.length}`);
  process.exit(0);
}

if (!existsSync(BASELINE)) {
  console.error('check-mount-reach: no baseline — run once with --set-baseline and commit it');
  process.exit(1);
}

const { maximum } = JSON.parse(readFileSync(BASELINE, 'utf8'));
const verdict = orphans.length > maximum ? 'FAIL' : 'ok';
console.log(`check-mount-reach: ${orphans.length} unreachable component(s), ceiling ${maximum} — ${verdict}`);
if (orphans.length > maximum) {
  for (const o of orphans) console.error(`  unreachable  ${o}`);
  console.error('  Render it from main.tsx\'s graph, or delete it. Then re-run --set-baseline.');
  process.exit(1);
}
