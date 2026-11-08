// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
/**
 * A BIM library part (DATABASE.server.BIM, `apk.bim.part/1`) as a CAD block
 * definition (ROAD-3509). Every device type lives once in the library; the CAD
 * places it like any catalogue symbol. Each port group becomes ports on the side
 * its role says — inputs left, outputs and two-way right, power and control both
 * out the bottom (the owner, 2026-11-07: "all power and control to connect out the
 * bottom"; control keeps its domain, so it keeps its amber) — a group of N as N ports (at most 16, the rest named on the
 * last), its domain kept for the Terminals table. Pure: no DOM, no store.
 */
import type { BimRef, BlockDefinition, BlockHat, BoxIdentity, Port, PortSide } from '../core/types';
import { ifcGuid } from '../vendor/ifc/guid';

export interface BimPort { group?: string; terminal?: string; side?: string; domain?: string; connector?: string; connector_guess?: boolean; count?: number; labels?: string[]; block?: string }
export interface BimPart {
  id: string; manufacturer?: string; model?: string; name?: string; description?: string; ports?: BimPort[]; ref?: Partial<BimRef>;
  category?: string; class?: string; stage?: string; ru?: number;
}

/** A description's first sentence, at most `max` characters. */
export function firstSentence(text: string | undefined, max = 90): string {
  const t = String(text ?? '').replace(/\s+/g, ' ').trim();
  if (!t) return '';
  const cut = t.match(/^.*?[.!?](\s|$)/)?.[0]?.trim() || t;
  return cut.length > max ? `${cut.slice(0, max - 1).trimEnd()}…` : cut;
}

/**
 * The part's header: its name; LOCATION · Owner corners (a type has neither — its
 * category and its stage stand there until an instance names them); then details
 * (maker · model; ports and connectors) and what it is.
 */
export function partHat(part: BimPart): BlockHat {
  const title = part.name || `${part.manufacturer ?? ''} ${part.model ?? ''}`.trim() || part.id;
  const ports = (part.ports ?? []).reduce((n, p) => n + Math.max(1, p.count ?? 1), 0);
  const conn = Array.from(new Set((part.ports ?? []).map((p) => p.connector).filter(Boolean))).slice(0, 4).join(', ');
  const lines = [
    [part.manufacturer, part.model].filter(Boolean).join(' · '),
    [`${ports} port${ports === 1 ? '' : 's'}`, conn, part.ru ? `${part.ru}U` : ''].filter(Boolean).join(' · '),
    firstSentence(part.description),
  ].filter(Boolean);
  const left = [part.category, part.class].filter(Boolean).join(' › ');
  const right = part.stage === 'seeded' ? '⚠ seeded — unverified' : part.stage ?? '';
  return { title, lines, ...(left ? { left } : {}), ...(right ? { right } : {}), height: 24, footer: 14 };
}

export const PORTS_PER_GROUP = 16;

function sideOf(p: BimPort): PortSide {
  if (p.domain === 'power' || p.side === 'supply' || p.domain === 'control') return 'power';
  return p.side === 'input' ? 'input' : 'output';
}

export const portId = (text: string): string => text.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '') || 'PORT';

export function bimDefinitionId(part: BimPart): string {
  return `bim.${part.id}`;
}

/**
 * The BIM reference a block keeps (ROAD-3572): the pick's `ref`, else the one a full part
 * carries (/api/bim/parts/…), else none. Only {part, url, rev, globalId} — see withGlobalId.
 */
export function bimRefOf(part: BimPart, ref?: Partial<BimRef> | null): BimRef | undefined {
  const r = ref ?? part.ref;
  if (!r || !r.part) return undefined;
  return withGlobalId({ part: String(r.part), url: String(r.url ?? ''), rev: String(r.rev ?? ''), ...(r.globalId ? { globalId: String(r.globalId) } : {}) });
}

/**
 * The part's IFC type GlobalId (ROAD-3576): the one GlobalId rule of the roles part/<id>
 * (vendor/ifc/guid.ts = DATABASE.server.BIM ifc.guid), the id the part's .ifc twin and this
 * drawing's IfcRelDefinesByType carry. Every live answer and the snapshot send it in `ref`;
 * a ref from before (a saved drawing, an old snapshot) gets it here by the same rule, so a
 * placed element always resolves back to its BIM type. The occurrence's own GlobalId is the
 * IFC writer's (exportIfc occRole) and is never stored in the ref.
 */
export function withGlobalId(ref: BimRef): BimRef {
  return ref.globalId || !ref.part ? ref : { ...ref, globalId: ifcGuid('part', ref.part) };
}

/**
 * THE BLOCK'S ANATOMY (the owner's sheet, 2026-11-07): the header INSIDE the box at
 * the top (title, then LOCATION · Owner corners, then details), the ports below it on
 * a fixed pitch, a run of grouped ports kept together and set apart from the next
 * by a gap, power and control along the bottom. In drawing units (mm).
 * DATABASE.server.BIM's blockSize (apk-bim-library.js) keeps the same numbers.
 */
export const BLOCK = { minW: 120, perBottomPort: 20, pitch: 10, groupGap: 10, pad: 6, header: 24, footer: 14, minBody: 20, step: 20 } as const;
/* ON THE GRID (flow/onGrid.ts, 10 mm): the header and its pad put the first port 30 below the top;
   ports 10 apart, a band gap of 10; width and height whole multiples of `step` (20) so, with the
   centre on the grid, every edge and every port is too; the bottom ports 20 apart, centred. */
const up = (v: number) => Math.ceil(v / BLOCK.step - 1e-9) * BLOCK.step;
/* THE FOOTER (the owner, 2026-11-07: "the ac in … needs that same footer space like the header,
   something that is always the same size … the freedom to be the same size all the time and not
   worry about spacing or crowding"): a band along the bottom, BLOCK.footer deep on every block
   whether it has bottom ports or not; power and control come out of it, named inside it. */

interface Run { side: PortSide; ports: Port[]; band: Band | null }
/** A band of rows: a functional block's ports (its inputs left, its outputs right, side by side), or a run of loose ones. */
interface Band { key: string; runs: Run[]; domain?: string; group?: boolean }

export function partToDefinition(part: BimPart, ref?: Partial<BimRef> | null, minSize?: { w: number; h: number }): BlockDefinition {
  const runs: Run[] = [];
  const bands: Band[] = [];
  const byKey = new Map<string, Band>();
  const used = new Set<string>();
  for (const p of part.ports ?? []) {
    const n = Math.max(1, p.count ?? 1);
    const shown = Math.min(n, PORTS_PER_GROUP);
    const group = p.group || p.terminal || 'PORT';
    const side = sideOf(p);
    /* its BRACKET (VIRTUAL NAME): the part's functional block (the owner, 2026-11-07: "Digital in
       and digital thru aligned vertically and bracketed"), else a group of more than one */
    const bracket = p.block || (n > 1 ? group : '');
    const run: Run = { side, ports: [], band: null };
    if (side === 'input' || side === 'output') {
      const key = p.block ? `b:${p.block}` : n > 1 ? `g:${group}:${runs.length}` : '';
      let band = key ? byKey.get(key) : bands.at(-1)?.key === '' ? bands.at(-1) : undefined;
      /* a group with no block pairs with an earlier group of the same domain whose band has nothing
         on this side yet — AUDIO INPUT 1-8 beside AUDIO THRU 1-8 (the owner: "the audio and audio
         should align") */
      if (!band && !p.block && n > 1) {
        band = bands.find((b) => b.group && b.domain === (p.domain ?? '') && !b.runs.some((r) => r.side === side));
      }
      if (!band) { band = { key, runs: [], domain: p.domain ?? '', group: !p.block && n > 1 }; bands.push(band); if (key) byKey.set(key, band); }
      band.runs.push(run);
      run.band = band;
    }
    for (let i = 0; i < shown; i++) {
      const member = n === 1 ? '' : p.labels?.[i] ? p.labels[i]! : `${i + 1}${i === shown - 1 && n > shown ? ` +${n - shown}` : ''}`;
      const label = member ? `${group} ${member}` : group;
      let id = portId(label);
      while (used.has(id)) id += '_';
      used.add(id);
      run.ports.push({
        id, side, label, ...(p.domain ? { domain: p.domain } : {}), ...(p.connector ? { connector: p.connector } : {}), ...(p.connector && p.connector_guess ? { connectorGuess: true } : {}),
        ...(bracket ? { group: bracket, member: member ? (p.block && !p.labels?.[i] ? `${group} ${member}` : member) : group } : {}),
      });
    }
    runs.push(run);
  }
  /* each band's rows top-down, in mm from the box top: header, pad, then per band its inputs and
     its outputs side by side from the band's first row (a block's IN beside its THRU), the band
     as tall as its taller side, a gap between bands where either is a block or a group */
  const ys = new Map<Port, number>();
  let y = BLOCK.header + BLOCK.pad;
  let prev: Band | null = null;
  let rows = 0;
  for (const band of bands) {
    if (prev && (prev.key || band.key)) y += BLOCK.groupGap;
    let tall = 0;
    for (const side of ['input', 'output'] as const) {
      let row = 0;
      for (const run of band.runs.filter((r) => r.side === side)) for (const port of run.ports) ys.set(port, y + BLOCK.pitch * row++);
      tall = Math.max(tall, row);
    }
    y += tall * BLOCK.pitch;
    rows += tall;
    prev = band;
  }
  const body = rows ? Math.max(BLOCK.minBody, y - BLOCK.pitch + BLOCK.pad - BLOCK.header) : BLOCK.minBody;
  const ports = runs.flatMap((r) => r.ports);
  const bottom = ports.filter((p) => p.side === 'power').length;
  const w = up(Math.max(BLOCK.minW, (bottom + 1) * BLOCK.perBottomPort, minSize?.w ?? 0));
  const h = up(Math.max(BLOCK.header + body + BLOCK.footer, minSize?.h ?? 0));
  for (const port of ports) { const y = ys.get(port); if (y !== undefined) port.offset = y / h; }
  // the bottom ports: 20 apart, centred on the block, each on the grid
  ports.filter((p) => p.side === 'power').forEach((port, i) => { port.offset = (w / 2 + (i - (bottom - 1) / 2) * BLOCK.perBottomPort) / w; });
  const title = part.name || `${part.manufacturer ?? ''} ${part.model ?? ''}`.trim() || part.id;
  return {
    id: bimDefinitionId(part),
    name: title.toUpperCase().replace(/[^A-Z0-9_-]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 64) || 'BIM_PART',
    description: `${title} — from the BIM library (${part.id})${part.description ? `: ${part.description}` : ''}`,
    size: { w, h },
    glyph: [],
    ports,
    ...(bimRefOf(part, ref) ? { bimRef: bimRefOf(part, ref) } : {}),
    hat: partHat(part),
  };
}

/** One live instance of a part, as DATABASE.server.BIM `/api/bim/instances` lists it. */
export interface BimInstance {
  state?: string;
  protocol?: string;
  mac?: string;
  serial?: string;
  resource?: string;
  panel?: { serial?: string; resource?: string } | null;
}

/** A serial that names one box: not empty, not all zeros (the 661xx answer 0). */
const realSerial = (s?: string) => { const v = String(s ?? '').trim(); return v && !/^0+$/.test(v) ? v : ''; };

/** A fixed GPIB address (GPIB0::28::INSTR, a gateway's ::gpib7,30,0::), board number dropped; else ''. */
export function fixedGpib(resource?: string): string {
  const text = String(resource ?? '').trim().toUpperCase().replace(/^([A-Z]+)\d*::/, '$1::');
  return /^GPIB::\d+/.test(text) || /::GPIB\d+,\d+/.test(text) ? text : '';
}

/**
 * The boxes a part's online instances stand for, each named by serial, else
 * fixed GPIB address — never a bare IP. A VISA box's MAC is not used: behind a
 * GPIB gateway it is the gateway's, shared by every box on the bus.
 */
export function liveBoxesOf(instances: BimInstance[]): BoxIdentity[] {
  const out: BoxIdentity[] = [];
  for (const i of instances) {
    if (i.state && i.state !== 'online') continue;
    const serial = realSerial(i.panel?.serial ?? i.serial);
    const resource = fixedGpib(i.panel?.resource ?? i.resource);
    const mac = i.protocol !== 'visa' ? String(i.mac ?? '').trim() : '';
    const box: BoxIdentity = serial ? { serial } : mac ? { mac } : resource ? { resource } : {};
    if (box.serial || box.mac || box.resource) {
      if (!out.some((b) => (b.serial && b.serial === box.serial) || (b.mac && b.mac === box.mac)
        || (b.resource && b.resource === box.resource))) out.push(box);
    }
  }
  return out;
}
