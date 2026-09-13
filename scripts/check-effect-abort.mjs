#!/usr/bin/env node
// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
/**
 * EFFECT ABORT — an async thing started in an effect must be cancellable.
 *
 * `useEffect` that starts work and returns nothing is the standard React leak:
 * the component unmounts, the promise resolves, and the resolver writes into
 * state that is gone — or worse, into state belonging to the component that
 * replaced it. Strict mode's double-mount makes it fire twice on every
 * development render, which is where it is normally noticed and where it is
 * normally shrugged off.
 *
 * This app fetches almost nothing today: the count below is ZERO and that is
 * the point. It is seeded as a REGRESSION GUARD, not as a backlog — the first
 * entry anybody adds is something new that arrived, not something old that was
 * inherited. It costs nothing while the number stays at zero, and it costs one
 * `AbortController` the day it does not.
 *
 * WHAT COUNTS AS ASYNC: `fetch(`, `.then(`, `await `, `setTimeout(`,
 * `setInterval(`, `addEventListener(`, `new ResizeObserver`,
 * `new MutationObserver`, `requestAnimationFrame(`.
 * WHAT COUNTS AS CANCELLABLE: the effect body returns a cleanup function, or
 * threads an `AbortController` / `signal` through.
 *
 * Regex over an effect's body, brace-counted rather than parsed — the same
 * dependency-free argument as `verifyFlow.ts`. It over-reports before it
 * under-reports, which is the direction a gate should fail in.
 *
 * Reimplemented for this tree rather than copied from `oneScope/frontend/
 * scripts/`: those files open with a proprietary notice that may not be
 * distributed, and this application is MIT with a public repository.
 *
 *   node scripts/check-effect-abort.mjs                 check
 *   node scripts/check-effect-abort.mjs --set-baseline  re-record after a fix
 */
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const APP = resolve(HERE, '..');
const SRC = join(APP, 'src');
const BASELINE = join(HERE, 'check-effect-abort.baseline.json');

const ASYNC = /\bfetch\s*\(|\.then\s*\(|\bawait\s|\bsetTimeout\s*\(|\bsetInterval\s*\(|\.addEventListener\s*\(|new\s+ResizeObserver|new\s+MutationObserver|\brequestAnimationFrame\s*\(/;
const CANCELLABLE = /\breturn\s*\(?\s*(?:\(\s*\)\s*=>|function\b)|AbortController|\bsignal\b/;

function sources(dir) {
  const out = [];
  for (const entry of readdirSync(dir).sort()) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...sources(full));
    else if (/\.tsx?$/.test(entry)) out.push(full);
  }
  return out;
}

/** The text between the `{` after `useEffect(() => ` and its matching `}`. */
function effectBodies(text) {
  const bodies = [];
  const opener = /useEffect\s*\(\s*(?:async\s+)?\(\s*\)\s*=>\s*\{/g;
  for (const m of text.matchAll(opener)) {
    let depth = 1;
    let i = m.index + m[0].length;
    for (; i < text.length && depth > 0; i++) {
      if (text[i] === '{') depth++;
      else if (text[i] === '}') depth--;
    }
    bodies.push({ body: text.slice(m.index + m[0].length, i - 1), at: m.index });
  }
  return bodies;
}

const leaks = [];
for (const file of sources(SRC)) {
  const text = readFileSync(file, 'utf8');
  for (const { body, at } of effectBodies(text)) {
    if (ASYNC.test(body) && !CANCELLABLE.test(body)) {
      leaks.push(`${relative(APP, file)}:${text.slice(0, at).split('\n').length}`);
    }
  }
}

if (process.argv.includes('--set-baseline')) {
  writeFileSync(BASELINE, JSON.stringify({
    maximum: leaks.length,
    leaks,
    note: 'Effects that start async work and return no cleanup. A CEILING: this fails '
        + 'when the number GROWS. Seeded at zero as a regression guard — the first entry '
        + 'anybody adds is a regression, not an inheritance. PLAN-111.02 step 4.',
  }, null, 2) + '\n');
  console.log(`check-effect-abort: baseline set to ${leaks.length}`);
  process.exit(0);
}

if (!existsSync(BASELINE)) {
  console.error('check-effect-abort: no baseline — run once with --set-baseline and commit it');
  process.exit(1);
}

const { maximum } = JSON.parse(readFileSync(BASELINE, 'utf8'));
const verdict = leaks.length > maximum ? 'FAIL' : 'ok';
console.log(`check-effect-abort: ${leaks.length} uncancellable effect(s), ceiling ${maximum} — ${verdict}`);
if (leaks.length > maximum) {
  for (const l of leaks) console.error(`  no cleanup   ${l}`);
  console.error('  Return a cleanup function, or thread an AbortController signal through.');
  process.exit(1);
}
