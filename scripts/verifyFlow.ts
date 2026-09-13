// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
/**
 * WHAT THIS PROVES, AND WHY IT RUNS ON EVERY BUILD
 *
 * `check.sh kad` runs `npm run build`, which is `tsc --noEmit && vite build`.
 * Both of those prove the app COMPILES. Neither of them can tell you that a
 * port on the left edge of a rotated block is still an input, that two blocks
 * wired together answer `neighboursOf`, or that the exporter writes a BLOCK a
 * strict DXF reader can resolve an INSERT to — and those three are the whole
 * of what PLAN-49.01 asked for.
 *
 * So this file asserts them, and `npm run build` runs it. A check nothing
 * executes is a directory of opinions.
 *
 * It is deliberately dependency-free: no test runner, no assertion library.
 * Adding vitest to this project to hold nine assertions would be a bigger
 * change than the feature.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { PORT_SIDES, terminalKey, terminalSideOf } from '../src/core/types';
import { FLOW_CATALOG, SHOP_CATALOG } from '../src/flow/catalog';
import { placementPoint } from '../src/flow/placement';
import { portLocalPoint } from '../src/flow/portLocalPoint';
import {
  connectPorts,
  createSchematic,
  definitionOf,
  isConnected,
  neighboursOf,
  placeBlock,
  portsOf,
  portWorldPoint,
  removePlacement,
  restoreSchematic,
  snapshotSchematic,
  terminalKeysOf,
} from '../src/flow/Schematic';
import {
  depthOf,
  groupBounds,
  heightOf,
  isDescendant,
  makeGroup,
  membersDeep,
  nestGroup,
  rootGroups,
  ungroup,
} from '../src/flow/groups';
import { buildDxf } from '../src/io/exportDxf/buildDxf';
import { Doc } from '../src/model/Doc';

let failures = 0;
let checks = 0;

function ok(what: string, condition: boolean, detail = ''): void {
  checks += 1;
  if (condition) return;
  failures += 1;
  console.error(`  FAIL  ${what}${detail ? ` — ${detail}` : ''}`);
}

function near(a: number, b: number, eps = 1e-9): boolean {
  return Math.abs(a - b) < eps;
}

/* 1 · A port's position is DERIVED from its side, never stored. -------------- */

const processDef = definitionOf(createSchematic(), 'flow.process');
if (!processDef) throw new Error('flow.process missing from the catalogue');

const local = Object.fromEntries(
  processDef.ports.map((p) => [p.id, portLocalPoint(processDef, p)] as const),
);
ok('input sits on the left edge, centred', near(local.IN!.x, -0.8) && near(local.IN!.y, 0));
ok('output sits on the right edge, centred', near(local.OUT!.x, 0.8) && near(local.OUT!.y, 0));
ok('control sits on the top edge', near(local.CTL!.x, 0) && near(local.CTL!.y, 0.5));
ok('power sits on the bottom edge', near(local.PWR!.x, 0) && near(local.PWR!.y, -0.5));

/* 2 · Two ports on one edge spread evenly, in declaration order. ------------- */

const split = definitionOf(createSchematic(), 'flow.split');
if (!split) throw new Error('flow.split missing from the catalogue');
const a = portLocalPoint(split, split.ports.find((p) => p.id === 'OUT_A')!);
const b = portLocalPoint(split, split.ports.find((p) => p.id === 'OUT_B')!);
ok('two outputs share the right edge', near(a.x, 0.8) && near(b.x, 0.8));
ok('and are spread a third and two thirds down it', near(a.y, 0.2) && near(b.y, -0.2), `${a.y} / ${b.y}`);

/* 3 · Rotation turns the GEOMETRY. The side keeps its name. ------------------ */

const turned = createSchematic();
const spun = placeBlock(turned, 'flow.process', { x: 0, y: 0 })!;
spun.rotation = 90;
const spunIn = portWorldPoint(turned, { placementId: spun.id, portId: 'IN' })!;
ok('a block turned 90° has its input pointing down the sheet',
  near(spunIn.x, 0, 1e-9) && near(spunIn.y, -0.8, 1e-9), `${spunIn.x}, ${spunIn.y}`);
ok('and that port is still an input',
  portsOf(turned, spun.id).find((r) => r.port.id === 'IN')!.port.side === 'input');
ok('the transform is the one the renderer and the exporter both use',
  near(placementPoint(spun, { x: 0.8, y: 0 }).y, 0.8));

/* 4 · A connection is a fact, and it is queryable. --------------------------- */

const model = createSchematic();
const source = placeBlock(model, 'flow.source', { x: -4, y: 0 })!;
const p1 = placeBlock(model, 'flow.process', { x: 0, y: 0 })!;
const p2 = placeBlock(model, 'flow.process', { x: 4, y: 0 })!;
ok('one symbol places more than once, with distinct refdes',
  p1.refdes === 'FLOW_PROCESS1' && p2.refdes === 'FLOW_PROCESS2', `${p1.refdes} / ${p2.refdes}`);

ok('source out wires to the first process in',
  connectPorts(model, { placementId: source.id, portId: 'OUT' }, { placementId: p1.id, portId: 'IN' }) !== null);
ok('the first process wires on to the second',
  connectPorts(model, { placementId: p1.id, portId: 'OUT' }, { placementId: p2.id, portId: 'IN' }) !== null);
ok('a port refuses to wire to itself',
  connectPorts(model, { placementId: p1.id, portId: 'IN' }, { placementId: p1.id, portId: 'IN' }) === null);
ok('the same pair refuses a second wire, in either direction',
  connectPorts(model, { placementId: p1.id, portId: 'IN' }, { placementId: source.id, portId: 'OUT' }) === null);

ok('the middle block knows both its neighbours', neighboursOf(model, p1.id).length === 2);
ok('and the connection is answerable without looking at a coordinate',
  isConnected(model, { placementId: source.id, portId: 'OUT' }, { placementId: p1.id, portId: 'IN' }));

/* 5 · The join key is the Terminals table's, spelled once. ------------------- */

const keys = terminalKeysOf(model);
ok('a signal port joins as its own side', keys.includes(terminalKey('FLOW_PROCESS1', 'input', 'IN')));
ok('control joins the Terminals table as bus', terminalSideOf('control') === 'bus');
ok('power joins the Terminals table as bus', terminalSideOf('power') === 'bus');
ok('every port of every placement is in the join list',
  keys.length === model.placements.reduce(
    (n, pl) => n + (definitionOf(model, pl.definitionId)?.ports.length ?? 0), 0));

/* 6 · Removing a placement takes its wires with it. -------------------------- */

const before = model.connectors.length;
removePlacement(model, p2.id);
ok('removing a block removes the connectors that referenced it',
  model.connectors.length === before - 1, `${before} → ${model.connectors.length}`);

/* 6b · A saved sheet comes back as a MODEL, not as strokes. ------------------ */

const reopened = createSchematic();
restoreSchematic(reopened, snapshotSchematic(model));
ok('a restored sheet holds the same placements', reopened.placements.length === model.placements.length);
ok('a restored sheet holds the same connectors', reopened.connectors.length === model.connectors.length);
ok('and still answers what is connected to what',
  isConnected(reopened, { placementId: source.id, portId: 'OUT' }, { placementId: p1.id, portId: 'IN' }));
ok('the next id does not collide with a restored one',
  reopened.nextPlacementId > Math.max(...reopened.placements.map((pl) => pl.id)));
ok('a port position survives the round trip, still derived',
  portWorldPoint(reopened, { placementId: p1.id, portId: 'IN' })!.x ===
    portWorldPoint(model, { placementId: p1.id, portId: 'IN' })!.x);

/* 7 · The exporter writes real BLOCKs, placed by INSERTs. -------------------- */

const dxf = buildDxf(new Doc(), 'in', [], model);
const count = (needle: string): number => dxf.split(`\n${needle}\n`).length - 1;

ok('there is a BLOCKS section', dxf.includes('\n  2\nBLOCKS\n'));
ok('there is a BLOCK_RECORD table', dxf.includes('\n  2\nBLOCK_RECORD\n'));
ok('each placed definition is written once as a BLOCK',
  dxf.includes('\nFLOW_SOURCE\n') && dxf.includes('\nFLOW_PROCESS\n'));
ok('an unplaced definition is not written', !dxf.includes('\nFLOW_SINK\n'));
ok('every placement is one INSERT', count('INSERT') === model.placements.length,
  `${count('INSERT')} INSERT vs ${model.placements.length} placements`);
ok('model space and paper space are both declared',
  dxf.includes('\n*Model_Space\n') && dxf.includes('\n*Paper_Space\n'));
ok('every entity declares AcDbEntity', count('AcDbEntity') >= count('INSERT'));
ok('the header seeds handles past the last one issued', dxf.includes('$HANDSEED'));
ok('and the file ends where DXF says it does', dxf.trimEnd().endsWith('EOF'));

/* 8 · The convention holds across the whole set, not just the first symbol. -- */

for (const def of [...FLOW_CATALOG, ...SHOP_CATALOG]) {
  ok(`${def.name}: every port sits on one of the four sides`,
    def.ports.every((p) => PORT_SIDES.includes(p.side)));
  ok(`${def.name}: every port id is unique within the definition`,
    new Set(def.ports.map((p) => p.id)).size === def.ports.length);
  ok(`${def.name}: no port carries a stored coordinate`,
    def.ports.every((p) => !('at' in p)));
}

/* 9 · THE JOIN. A shop part's ports are the Terminals table's, or the build
   fails.

   Sections 1-8 prove the model is coherent with itself. This one is the only
   check here that reads something OUTSIDE the app, and it is the one
   PLAN-36.04 step 3 asked for: "whatever is on the CAD side must be greppable
   back to a `Terminals` row. If it is not, the join is a coincidence."

   `terminalKey` already spells the key one way for both sides. What was
   missing is anybody asserting that a key it spells actually EXISTS in the
   table — section 5 proves the spelling against `FLOW_PROCESS1`/`IN`, which
   are names this repository invented and which no row will ever have.

   THIS IS A HARD FAILURE WHEN THE TABLE CANNOT BE READ, and deliberately. A
   join check that skips when its file is missing reports the same green as a
   join that holds, and this tree has been bitten by exactly that shape twice
   (`validate.baseline.json` read into a `catch` that set null; a pnpm filter
   matching no packages and exiting 0). If the shop's termination list is not
   where it is committed, this check has proved nothing and says so. */

const INTERFACES_REL = 'APK:OS/Interfaces/APK-Shop/Interfaces.json';

interface TerminalRow {
  interface: string;
  side: string;
  terminal: string;
  domain?: string;
}

function readTerminals(): TerminalRow[] {
  /* Walk up from this bundle until the repository root is under us. The
     verifier is bundled into `node_modules/.cache/kad/`, so neither cwd nor a
     fixed number of `..` is dependable — `check.sh` runs it from the repo root
     and `npm run build` runs it from the app. */
  let dir = resolve(dirname(fileURLToPath(import.meta.url)));
  for (let hop = 0; hop < 12; hop += 1) {
    const candidate = join(dir, INTERFACES_REL);
    if (existsSync(candidate)) {
      const doc = JSON.parse(readFileSync(candidate, 'utf8'));
      return doc['Interface Map'].blocks.Terminals.data as TerminalRow[];
    }
    const up = dirname(dir);
    if (up === dir) break;
    dir = up;
  }
  throw new Error(`${INTERFACES_REL} was not found above ${dirname(fileURLToPath(import.meta.url))} — the join could not be checked, which is a failure and not a skip`);
}

const terminals = readTerminals();
ok('the shop termination list was read', terminals.length > 0, `${terminals.length} rows`);

/* The table keyed the way `terminalKey` spells it, so the comparison is
   string-to-string and cannot drift into a near-agreement. */
const tableKeys = new Set(terminals.map((row) => `${row.interface} ${row.side} ${row.terminal}`));

for (const def of SHOP_CATALOG) {
  /* Every interface the table terminates the same way this part does. A
     definition is per-KIND and a placement is per-instance, so the part is
     proved against every row that carries its ports rather than against one
     hand-picked refdes — that is what makes it survive a second node. */
  const carriers = [...new Set(terminals.map((row) => row.interface))].filter((iface) =>
    def.ports.every((port) => tableKeys.has(terminalKey(iface, port.side, port.id))),
  );

  ok(`${def.name}: every port is a terminal some interface actually has`,
    carriers.length > 0,
    `no interface in the table carries all of ${def.ports.map((p) => p.id).join(', ')}`);

  for (const port of def.ports) {
    const rows = terminals.filter(
      (row) => row.side === terminalSideOf(port.side) && row.terminal === port.id,
    );
    ok(`${def.name}.${port.id}: read out of the table, not coined`,
      rows.length > 0,
      `no Terminals row has side="${terminalSideOf(port.side)}" terminal="${port.id}"`);
    /* The `domain` column too, where the port declares one — a port that
       agrees on the name and disagrees on what runs through it is the
       near-agreement this whole section exists to refuse. */
    if (port.domain) {
      ok(`${def.name}.${port.id}: its domain is the table's`,
        rows.some((row) => row.domain === port.domain),
        `port says "${port.domain}", table says ${[...new Set(rows.map((r) => r.domain))].join(', ')}`);
    }
  }

  console.log(`  ${def.name}: joins ${carriers.length} interface(s) — ${carriers.join(', ')}`);
}

/* 8 · Groups: the box is derived, the tree is a tree. -------------------------
 *
 * These are the two invariants stated in `core/types.ts` and enforced again by
 * `server.py`'s `validate_big_picture`. They are asserted HERE because they are
 * properties of the operations, not of the file: a `makeGroup` that leaves a
 * placement in two groups writes a file that the server then correctly refuses,
 * and the error a person sees is "the server refused my drawing" rather than
 * "this function is wrong". */

const sheet = createSchematic();
const g1 = placeBlock(sheet, 'flow.process', { x: 0, y: 0 })!;
const g2 = placeBlock(sheet, 'flow.process', { x: 4, y: 0 })!;
const g3 = placeBlock(sheet, 'flow.process', { x: 8, y: 0 })!;

const inner = makeGroup(sheet, [g1.id, g2.id], [], 'INNER')!;
ok('makeGroup: takes the placements it was handed', inner.members.length === 2);
ok('makeGroup: a fresh group has no children', inner.children.length === 0);

const outer = makeGroup(sheet, [g3.id], [inner.id], 'OUTER')!;
ok('makeGroup: a group of groups holds the group', outer.children.includes(inner.id));
ok('makeGroup: the nested group keeps its own members',
  sheet.groups.find((g) => g.id === inner.id)!.members.length === 2,
  'enclosing a whole group must nest it, not dissolve it');
ok('makeGroup: the outer group does not repeat its child\'s members',
  outer.members.length === 1 && outer.members[0] === g3.id);

/* INVARIANT 1 — one owner per placement, counted across the whole model. */
const owners = new Map<number, number>();
for (const group of sheet.groups) {
  for (const member of group.members) owners.set(member, (owners.get(member) ?? 0) + 1);
}
ok('invariant: every placement is in at most one group',
  [...owners.values()].every((n) => n === 1),
  [...owners.entries()].filter(([, n]) => n > 1).map(([id]) => `#${id}`).join(', '));

/* INVARIANT 2 — one parent per group, and no cycles. */
ok('invariant: exactly one root', rootGroups(sheet).length === 1);
ok('depthOf: the nested group is one down', depthOf(sheet, inner.id) === 1);
ok('heightOf: the outer group is one tall', heightOf(sheet, outer.id) === 1);
ok('nestGroup: refuses a group into itself', !nestGroup(sheet, outer.id, outer.id));
ok('nestGroup: refuses a parent into its own descendant',
  !nestGroup(sheet, outer.id, inner.id),
  'a cycle has no bounds and no bottom');
ok('isDescendant: the inner group is under the outer one',
  isDescendant(sheet, outer.id, inner.id));

ok('membersDeep: the outer group holds all three',
  membersDeep(sheet, outer.id).length === 3);

/* THE BOX IS DERIVED. Move a block and the box that encloses it must follow,
   with nothing invalidated in between — that is the whole design call. */
const boxBefore = groupBounds(sheet, outer.id)!;
g3.at = { x: 40, y: 0 };
const boxAfter = groupBounds(sheet, outer.id)!;
ok('groupBounds: a moved block re-shapes its group', boxAfter.x2 > boxBefore.x2,
  `${boxBefore.x2} -> ${boxAfter.x2}`);
ok('groupBounds: a parent clears its child',
  boxAfter.x1 < groupBounds(sheet, inner.id)!.x1,
  'the outer box must not sit inside the inner one');

/* A REMOVED PLACEMENT LEAVES ITS GROUP. A group listing an id no longer on the
   sheet is drawn by a box sized from a ghost, which shrinks silently. */
removePlacement(sheet, g3.id);
ok('removePlacement: the group forgets it',
  !sheet.groups.some((g) => g.members.includes(g3.id)));
ok('removePlacement: the sheet still validates as a tree',
  membersDeep(sheet, outer.id).length === 2);

/* UNGROUP HANDS UP, NOT OUT. */
ungroup(sheet, inner.id);
ok('ungroup: the contents went to the parent',
  sheet.groups.find((g) => g.id === outer.id)!.members.length === 2,
  'ungrouping a rack inside a room must leave the boxes in the room');
ok('ungroup: the group is gone', !sheet.groups.some((g) => g.id === inner.id));

/* A GROUP SURVIVES THE ROUND TRIP. This is what gets written to
   `APK:OS/system/big-picture.json` and read back by the next window. */
const savedSheet = snapshotSchematic(sheet);
const reloaded = createSchematic();
restoreSchematic(reloaded, savedSheet);
ok('snapshot: the groups came back', reloaded.groups.length === sheet.groups.length);
ok('snapshot: the tree came back',
  membersDeep(reloaded, outer.id).length === membersDeep(sheet, outer.id).length);
ok('snapshot: a sheet saved before groups existed still restores', (() => {
  const old = createSchematic();
  restoreSchematic(old, { placements: [], connectors: [], nextPlacementId: 1, nextConnectorId: 1 });
  return old.groups.length === 0 && old.nextGroupId === 1;
})());

console.log(`flow model + DXF export: ${checks - failures}/${checks} checks passed`);
// Thrown rather than `process.exit`: this file is typechecked against the DOM
// lib the app uses, and a rejected build is what a red check has to produce.
if (failures) throw new Error(`${failures} of ${checks} flow checks failed`);
