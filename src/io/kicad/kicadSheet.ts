// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { BlockDefinition, BlockPlacement, Port, SchematicModel } from '../../core/types';
import { BLOCK } from '../../flow/bimPart';
import { definitionFor } from '../../flow/Schematic';
import { nets as drawingNets } from '../../flow/wires';
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
 * Files: <name>.kicad_sch, <name>.kicad_pro, <name>.kicad_sym (the project's symbol library: four files, not one
 * per kind of part — a browser lets a page download only a handful) and the sym-lib-table naming it — a project
 * folder KiCad 9 and 10 open as is. The stock-library shape (KLC S1.1 libraries) is DATATYPE.KiCad's ⬆ export.
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
    // what it is: the part's own description, else its hat's sentence (lines: maker · model, ports, the sentence)
    description: (def.description ?? '').replace(/^.*?— from the BIM library \([^)]*\):?\s*/, '').replace(/^.*?— from the BIM library \([^)]*\)\s*$/, '') || hat?.lines?.[2] || title,
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
export interface ExtraConnection { from: { placementId: number; portId: string }; to: { placementId: number; portId: string }; label?: string }

/** The schematic as a KiCad project. `name` is the file stem; target KiCad 9 opens in 9 and 10. `connections` are wires a
 *  host keeps as its own line work (the Simulation's routes), joined into the nets with the sheet's own connectors. */
/** A host's own groups (the Simulation's frames), named by the refs it placed. */
export interface HostGroupRow { name: string; refs: string[] }

export function kicadProject(model: SchematicModel, name: string,
  { target = 'kicad9' as KicadTarget, connections = [] as ExtraConnection[], hostGroups = [] as HostGroupRow[], panels = new Map<string, unknown>() } = {}): KicadProject {
  const stem = safeName(name || 'drawing');
  const symbolOf = new Map<string, KicadSymbol>();
  const taken = new Set<string>();
  const same = new Map<string, KicadSymbol>(); // a symbol's content → the symbol: equal boxes share one
  const content = (s: KicadSymbol) => JSON.stringify([s.name, s.units.map((u) => u.name), s.pins.map((p) => [p.unit, p.number, p.name, p.type, p.at]), s.properties.filter((p) => p.name !== 'APK_Ports').map((p) => [p.name, p.value])]);
  for (const pl of model.placements) {
    const def = definitionFor(model, pl);
    if (!def || symbolOf.has(def.id)) continue;
    const part = partOfDefinition(def);
    const panel = part.id ? panels.get(part.id) : undefined;
    if (!def.ports.length && !panel) continue;
    // one project library, named for the project (KiCad's own way for a project's symbols; KLC S1.1 names the stock ones);
    // a part with a touch panel: each page one more unit, its controls pins (kicadLibrary symbolFromPart)
    const sym = symbolFromPart(part, { library: stem, ...(panel ? { panel } : {}) });
    const twin = same.get(content(sym));
    if (twin) { symbolOf.set(def.id, twin); continue; }
    same.set(content(sym), sym);
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
  const instances: Parameters<typeof writeSchematic>[0]['instances'] = [];
  const panelGroups: { name: string; refs: string[] }[] = [];
  for (const pl of [...model.placements].sort((a, b) => a.id - b.id)) {
    const def = definitionFor(model, pl);
    const sym = def && symbolOf.get(def.id);
    if (!def || !sym) { skipped.push(`${pl.refdes ?? `#${pl.id}`}: ${def ? 'no ports' : 'no definition'}`); continue; }
    const prefix = sym.properties.find((p) => p.name === 'Reference')?.value || 'A';
    // the bench's own ref (a host's: 'U19') before the sheet's caption ('U19 · 3235')
    let ref = pl.hostRef ? refSafe(String(pl.hostRef)) : pl.refdes ? refSafe(pl.refdes) : '';
    if (!ref || usedRefs.has(ref) || !/^[A-Za-z#]/.test(ref)) {
      let k = 1;
      while (usedRefs.has(`${prefix}${k}`)) k++;
      ref = `${prefix}${k}`;
    }
    usedRefs.add(ref);
    refOf.set(pl.id, ref);
    const at: [number, number] = [pl.at.x * KICAD_PER_CAD, -pl.at.y * KICAD_PER_CAD];
    const named = deviceName(pl, def);
    const fields = { ...placementFields(pl), Value: named || sym.name };
    const drawn = sym.units.filter((u) => u.unit > 0);
    // one instance per unit: the device's own I/O where the box is, its touch panel's pages in a row to its right
    let x = at[0];
    let prevHalf = 0;
    drawn.forEach((u, k) => {
      const half = unitHalfWidth(u);
      if (k) x += prevHalf + half + 10.16;
      prevHalf = half;
      const page = u.name && u.name !== 'Device' ? u.name : '';
      instances.push({
        libId: `${sym.library}:${sym.name}`, ref, unit: u.unit, uuidKey: `${stem}|${pl.id}`,
        at: [x, at[1]] as [number, number], rotation: k ? 0 : pl.rotation ?? 0, fields,
        // the device's own name is the Value; under it the symbol it is (and on a panel page, the page)
        shown: { ...(named && named !== sym.name ? { Part: sym.name } : {}), ...(page ? { Page: page } : {}) },
      });
    });
    if (drawn.some((u) => u.name && u.name !== 'Device')) panelGroups.push({ name: `${ref}${named ? ` · ${named}` : ''} — touch panel`, refs: [ref] });
  }

  // nets: the drawing's own (flow/wires.ts — one net model), joined by the panel links too
  const sets = new Map<string, string[]>();
  const label = new Map<string, string>();
  for (const n of drawingNets(model, connections)) {
    const root = n.name;
    sets.set(root, n.pins.map((p) => `${p.placementId}|${p.portId}`));
    const on = model.connectors.filter((c) => n.wires.includes(c.id));
    const declared = on.some((c) => c.net) ? n.name : on.find((c) => c.label)?.label ?? connections.find((c) => c.label && n.pins.some((p) => p.placementId === c.from.placementId && p.portId === c.from.portId))?.label;
    if (declared) label.set(root, declared);
  }
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

  // groups: the sheet's own (members and every child group's), then a host's (its refs), as KiCad refs
  const groups: { name: string; refs: string[] }[] = [];
  const byGroup = new Map(model.groups.map((g) => [g.id, g]));
  const membersOf = (g: { members: number[]; children: number[] }, seen = new Set<number>()): number[] =>
    [...g.members, ...g.children.flatMap((c) => (seen.has(c) || !byGroup.has(c) ? [] : (seen.add(c), membersOf(byGroup.get(c)!, seen))))];
  for (const g of model.groups) {
    const refs = membersOf(g).map((id) => refOf.get(id)).filter((r): r is string => !!r);
    if (refs.length) groups.push({ name: g.name, refs });
  }
  const byHost = new Map(model.placements.filter((p) => p.hostRef).map((p) => [String(p.hostRef), p.id]));
  for (const g of hostGroups) {
    const refs = (g.refs ?? []).map((r) => refOf.get(byHost.get(String(r)) ?? -1)).filter((r): r is string => !!r);
    if (refs.length && g.name) groups.push({ name: String(g.name), refs });
  }

  groups.push(...panelGroups);
  const symbols = [...new Set(symbolOf.values())];
  const sheet = writeSchematic({
    title: name || stem, project: stem, symbols, instances, nets, target, groups,
    comment: 'exported from CAD.like.audio — symbols by the KiCad Library Conventions, BIM parts in APK_ fields',
  });
  // in the order a reader needs them: the table and its libraries before the sheet, the project file last —
  // a project opened before its sym-lib-table had landed reads a half-written table
  const libs = new Map<string, KicadSymbol[]>();
  for (const s of symbols) { if (!libs.has(s.library)) libs.set(s.library, []); libs.get(s.library)!.push(s); }
  const files: Record<string, string> = { 'sym-lib-table': projectSymLibTable([...libs.keys()]) };
  for (const [lib, list] of libs) files[`${lib}.kicad_sym`] = writeSymbolLib(list, { target });
  files[`${stem}.kicad_sch`] = sheet.text;
  files[`${stem}.kicad_pro`] = kicadPro(stem);
  return { name: stem, files, placed: sheet.placed, nets: nets.length, skipped: [...skipped, ...sheet.skipped] };
}

/** Half a unit's body width (its rectangle), mm: how far apart a device's units stand in a row. */
function unitHalfWidth(u: { graphics: unknown[]; pins: { at: [number, number, number]; length: number }[] }): number {
  for (const g of u.graphics) {
    if (!Array.isArray(g) || g[0] !== 'rectangle') continue;
    const st = g[1] as [string, number, number], en = g[2] as [string, number, number];
    return Math.abs(Number(en[1]) - Number(st[1])) / 2 + 7.62;
  }
  return Math.max(10, ...u.pins.map((p) => Math.abs(p.at[0]) + 2.54));
}

/** What the box is called on the sheet: its caption without the ref ('U19 · HP 3235' → 'HP 3235'), else its part's title. */
function deviceName(pl: BlockPlacement, def: BlockDefinition): string {
  const caption = String(pl.refdes ?? '').trim();
  const own = pl.hostRef && caption.startsWith(String(pl.hostRef)) ? caption.slice(String(pl.hostRef).length).replace(/^\s*[·:|-]\s*/, '') : caption;
  // a caption that is only a ref ('U8') names nothing: the part's title then
  return own && own !== pl.hostRef && !/^[A-Za-z#]+\d+$/.test(own) ? own : (def.hat?.title || '');
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

/**
 * The project with every BIM part's touch panel (GET <api>/parts/<maker>/<model>: the part, `panel` included), each
 * part asked once. A part the API does not give, or a panel it has not got, exports without one.
 */
export async function kicadProjectWithPanels(model: SchematicModel, name: string, opts: Omit<Parameters<typeof kicadProject>[2] & object, 'panels'> = {},
  { api, fetchFn = globalThis.fetch }: { api: string; fetchFn?: typeof fetch }): Promise<KicadProject> {
  const ids = new Set<string>();
  for (const pl of model.placements) {
    const def = definitionFor(model, pl);
    const id = def ? partOfDefinition(def).id : undefined;
    if (id && /^[\w.-]+\/[\w.-]+$/.test(id)) ids.add(id);
  }
  const panels = new Map<string, unknown>();
  await Promise.all([...ids].map(async (id) => {
    try {
      const r = await fetchFn(`${api.replace(/\/$/, '')}/parts/${id.split('/').map(encodeURIComponent).join('/')}`);
      if (!r.ok) return;
      const part = await r.json() as { panel?: unknown };
      if (part && part.panel) panels.set(id, part.panel);
    } catch { /* no API, no panel: the device exports with its own I/O */ }
  }));
  return kicadProject(model, name, { ...opts, panels });
}
