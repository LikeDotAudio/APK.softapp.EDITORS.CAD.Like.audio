// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { BlockDefinition, BlockPlacement, Port, SchematicModel } from '../../core/types';
import { BLOCK } from '../../flow/bimPart';
import { definitionFor } from '../../flow/Schematic';
import {
  projectSymLibTable, safeName, symbolFromPart, writeSchematic, writeSymbolLib,
  type BimPartLike, type BimPortRow, type KicadSymbol, type KicadTarget,
} from '../../vendor/kicad/kicadLibrary.js';

/**
 * THE SHEET AS A KICAD PROJECT (File › Export KiCad). KiCad is a target (DATA.KICAD SRC/Reference/KLC):
 *
 * - every block definition on the sheet is one symbol, drawn by the KiCad Library Conventions
 *   (vendor/kicad/kicadLibrary.js symbolFromPart: 2.54 mm grid, inputs left, outputs right, power top,
 *   ground bottom, refdes by KLC S6.1) and carrying its BIM part as hidden APK_ fields; pin n is the
 *   definition's n-th port, so the wiring needs no table;
 * - every placement is a symbol instance where the block sits: the CAD's row pitch (BLOCK.pitch) is
 *   KiCad's 2.54 mm grid, the CAD's y-up sheet becomes KiCad's y-down one;
 * - every set of ports joined by wires is one net, named by a wire's label when it has one, drawn as a
 *   wire stub and a net label on each pin (KiCad joins by label exactly as by wire).
 *
 * Files: <name>.kicad_sch, <name>.kicad_pro, one <Library>.kicad_sym per symbol library (KLC S1.1) and
 * the sym-lib-table naming them — a project folder KiCad 9 and 10 open as is.
 */

export const KICAD_PER_CAD = 2.54 / BLOCK.pitch;

const UNVERIFIED = /seeded|unverified/i;

/** A CAD block definition → the BIM part shape symbolFromPart takes; one row per run of a port group. */
export function partOfDefinition(def: BlockDefinition): BimPartLike {
  const hat = def.hat;
  const [maker, model] = (hat?.lines?.[0] ?? '').split(' · ');
  const [category, klass] = (hat?.left ?? '').split(' › ');
  const rows: BimPortRow[] = [];
  let last: { row: BimPortRow; key: string } | null = null;
  for (const p of def.ports) {
    const side = sideOf(p);
    const name = p.label || p.id;
    const key = p.group ? `${p.group}|${side}|${p.domain ?? ''}` : '';
    if (key && last && last.key === key) {
      last.row.count = (last.row.count ?? 1) + 1;
      last.row.labels!.push(p.member || name);
      continue;
    }
    // a single port's own name is its terminal (a block bracket like 'Power' is its group, not its name)
    const row: BimPortRow = { group: p.group || name, terminal: p.member || name, side, ...(p.domain ? { domain: p.domain } : {}), ...(p.connector ? { connector: p.connector } : {}), count: 1, labels: [p.group ? (p.member || name) : name] };
    rows.push(row);
    last = { row, key };
  }
  const title = hat?.title || def.name;
  const id = def.bimRef?.part || def.id.replace(/^bim\./, ''); // bimDefinitionId: 'bim.<part id>'
  return {
    id,
    ...(maker && model ? { manufacturer: maker, model } : { model: title }),
    name: title,
    description: (def.description ?? '').replace(/^.*?— from the BIM library \([^)]*\):?\s*/, '') || hat?.lines?.at(-1) || '',
    ...(category ? { category } : {}), ...(klass ? { class: klass } : {}),
    ...(hat?.right ? { stage: UNVERIFIED.test(hat.right) ? 'seeded' : hat.right } : {}),
    ports: rows,
  };
}

function sideOf(p: Port): string {
  if (p.side === 'input') return 'input';
  if (p.side === 'output') return 'output';
  if (p.side === 'power' && (p.domain === 'power' || !p.domain)) return 'input'; // a power inlet: power_in (KLC S4.4)
  return 'connection';
}

const refSafe = (s: string) => s.replace(/[^A-Za-z0-9_#+-]+/g, '_');
const netSafe = (s: string) => s.trim().replace(/\s+/g, '_').replace(/[{}]/g, '') || 'NET';

export interface KicadProject {
  name: string;
  /** file name → text: <name>.kicad_sch, <name>.kicad_pro, sym-lib-table, <Library>.kicad_sym … */
  files: Record<string, string>;
  placed: number;
  nets: number;
  skipped: string[];
}

/** The schematic as a KiCad project. `name` is the file stem; target KiCad 9 opens in 9 and 10. */
export function kicadProject(model: SchematicModel, name: string, { target = 'kicad9' as KicadTarget } = {}): KicadProject {
  const stem = safeName(name || 'drawing');
  const symbolOf = new Map<string, KicadSymbol>();
  const taken = new Set<string>();
  for (const pl of model.placements) {
    const def = definitionFor(model, pl);
    if (!def || symbolOf.has(def.id) || !def.ports.length) continue;
    const sym = symbolFromPart(partOfDefinition(def));
    let n = 2;
    const base = sym.name;
    while (taken.has(`${sym.library}:${sym.name}`)) sym.name = `${base}_${n++}`;
    if (sym.name !== base) sym.properties.find((p) => p.name === 'Value')!.value = sym.name;
    taken.add(`${sym.library}:${sym.name}`);
    symbolOf.set(def.id, sym);
  }

  const skipped: string[] = [];
  const refOf = new Map<number, string>();
  const usedRefs = new Set<string>();
  const instances = [];
  for (const pl of [...model.placements].sort((a, b) => a.id - b.id)) {
    const def = definitionFor(model, pl);
    const sym = def && symbolOf.get(def.id);
    if (!def || !sym) { skipped.push(`${pl.refdes ?? `#${pl.id}`}: ${def ? 'no ports' : 'no definition'}`); continue; }
    const prefix = sym.properties.find((p) => p.name === 'Reference')?.value || 'A';
    let ref = pl.refdes ? refSafe(pl.refdes) : '';
    if (!ref || usedRefs.has(ref) || !/^[A-Za-z#]/.test(ref)) {
      let k = 1;
      while (usedRefs.has(`${prefix}${k}`)) k++;
      ref = `${prefix}${k}`;
    }
    usedRefs.add(ref);
    refOf.set(pl.id, ref);
    instances.push({
      libId: `${sym.library}:${sym.name}`, ref, uuidKey: `${stem}|${pl.id}`,
      at: [pl.at.x * KICAD_PER_CAD, -pl.at.y * KICAD_PER_CAD] as [number, number],
      rotation: pl.rotation ?? 0,
      fields: placementFields(pl),
    });
  }

  // nets: ports joined by connectors, union–find
  const parent = new Map<string, string>();
  const key = (r: { placementId: number; portId: string }) => `${r.placementId}|${r.portId}`;
  const find = (k: string): string => { let r = k; while (parent.get(r) !== r) r = parent.get(r)!; parent.set(k, r); return r; };
  const add = (k: string) => { if (!parent.has(k)) parent.set(k, k); };
  for (const c of model.connectors) { add(key(c.from)); add(key(c.to)); parent.set(find(key(c.from)), find(key(c.to))); }
  const label = new Map<string, string>();
  for (const c of model.connectors) if (c.label && !label.has(find(key(c.from)))) label.set(find(key(c.from)), c.label);
  const sets = new Map<string, string[]>();
  for (const k of parent.keys()) { const r = find(k); if (!sets.has(r)) sets.set(r, []); sets.get(r)!.push(k); }
  const names = new Set<string>();
  const nets = [];
  for (const [root, members] of sets) {
    const nodes = [];
    for (const m of members.sort()) {
      const [pid, portId] = [Number(m.slice(0, m.indexOf('|'))), m.slice(m.indexOf('|') + 1)];
      const pl = model.placements.find((p) => p.id === pid);
      const def = pl && definitionFor(model, pl);
      const idx = def ? def.ports.findIndex((p) => p.id === portId) : -1;
      const ref = refOf.get(pid);
      if (!ref || idx < 0) { skipped.push(`wire end ${m}: no such port on the sheet`); continue; }
      nodes.push({ ref, pin: String(idx + 1), portId, def: def! });
    }
    if (nodes.length < 2) continue;
    const src = nodes.find((n) => n.def.ports.find((p) => p.id === n.portId)?.side === 'output') ?? nodes[0]!;
    const sp = src.def.ports.find((p) => p.id === src.portId);
    let nm = netSafe(label.get(root) ?? `${src.ref}_${sp?.member || sp?.label || src.portId}`);
    const base = nm;
    let k = 2;
    while (names.has(nm)) nm = `${base}_${k++}`;
    names.add(nm);
    nets.push({ name: nm, nodes: nodes.map(({ ref, pin }) => ({ ref, pin })) });
  }

  const symbols = [...symbolOf.values()];
  const sheet = writeSchematic({
    title: name || stem, project: stem, symbols, instances, nets, target,
    comment: 'exported from CAD.like.audio — symbols by the KiCad Library Conventions, BIM parts in APK_ fields',
  });
  const files: Record<string, string> = { [`${stem}.kicad_sch`]: sheet.text, [`${stem}.kicad_pro`]: kicadPro(stem) };
  const libs = new Map<string, KicadSymbol[]>();
  for (const s of symbols) { if (!libs.has(s.library)) libs.set(s.library, []); libs.get(s.library)!.push(s); }
  for (const [lib, list] of libs) files[`${lib}.kicad_sym`] = writeSymbolLib(list, { target });
  files['sym-lib-table'] = projectSymLibTable([...libs.keys()]);
  return { name: stem, files, placed: sheet.placed, nets: nets.length, skipped: [...skipped, ...sheet.skipped] };
}

/** The placement's own words a KiCad user wants on the instance: its BIM reference and the box it stands for. */
function placementFields(pl: BlockPlacement): Record<string, string> {
  const out: Record<string, string> = {};
  if (pl.bimRef?.part) out.APK_PartId = pl.bimRef.part;
  if (pl.bimRef?.globalId) out.APK_GlobalId = pl.bimRef.globalId;
  if (pl.hostRef) out.APK_HostRef = String(pl.hostRef);
  return out;
}

/** The smallest project file KiCad opens: it fills every setting it is not given. */
function kicadPro(stem: string): string {
  return `${JSON.stringify({ meta: { filename: `${stem}.kicad_pro`, version: 1 }, sheets: [], boards: [], text_variables: {} }, null, 2)}\n`;
}
