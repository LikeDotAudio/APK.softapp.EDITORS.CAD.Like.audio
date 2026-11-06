// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
/**
 * Vendor the BIM library's concepts into src/vendor/bim/concepts.json (ROAD-3588).
 *
 * The CAD's placeable concepts — the flow set, shop parts, schematic symbols, math & logic,
 * adapters — are BIM entries now: DATABASE.server.BIM/SRC/library/concept/<slug>.bim.json,
 * category Concepts, each carrying in ext.cad what the CAD needs to draw it. The CAD builds
 * offline (cad.like.audio has no BIM), so it carries a snapshot of them, as it carries
 * contracts/ifc/*.json. This copies every concept with ext.cad, keeping the snapshot's order
 * and appending new ones; src/vendor/bim/concepts.test.ts holds the snapshot to the library.
 *
 *   node scripts/vendorBimConcepts.mjs [path/to/DATABASE.server.BIM/SRC/library]
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, '../src/vendor/bim/concepts.json');

function findLibrary() {
  for (let dir = resolve(HERE, '..'); ; dir = dirname(dir)) {
    const lib = join(dir, 'PODS/POD.database/DATABASE.server.BIM/SRC/library');
    if (existsSync(join(lib, 'concept'))) return lib;
    if (dirname(dir) === dir) throw new Error('no DATABASE.server.BIM/SRC/library above this checkout: pass its path');
  }
}

export function conceptRows(library) {
  const dir = join(library, 'concept');
  return readdirSync(dir).filter((f) => f.endsWith('.bim.json')).sort().map((f) => JSON.parse(readFileSync(join(dir, f), 'utf8')))
    .filter((p) => p.ext?.cad?.definition)
    .map((p) => ({ part: p.id, class: p.class, description: p.description ?? '', cad: p.ext.cad }));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const library = process.argv[2] ? resolve(process.argv[2]) : findLibrary();
  const rows = conceptRows(library);
  const old = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')).concepts.map((c) => c.part) : [];
  const rank = (p) => { const i = old.indexOf(p); return i < 0 ? old.length : i; };
  rows.sort((a, b) => rank(a.part) - rank(b.part));
  const doc = { schema: 'apk.cad.bim-concepts/1', source: 'DATABASE.server.BIM/SRC/library/concept/*.bim.json (ext.cad)',
                rule: 'Vendored by scripts/vendorBimConcepts.mjs; never hand-edited. A concept is changed in the BIM library.', concepts: rows };
  writeFileSync(OUT, JSON.stringify(doc, null, 1) + '\n');
  console.log(`wrote ${OUT}: ${rows.length} concepts`);
}
