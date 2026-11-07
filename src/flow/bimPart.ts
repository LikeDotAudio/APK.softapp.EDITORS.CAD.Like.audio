// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
/**
 * A BIM library part (DATABASE.server.BIM, `apk.bim.part/1`) as a CAD block
 * definition (ROAD-3509). Every device type lives once in the library; the CAD
 * places it like any catalogue symbol. Each port group becomes ports on the side
 * its role says — inputs left, outputs and two-way right, control on top, power
 * at the bottom — a group of N as N ports (at most 16, the rest named on the
 * last), its domain kept for the Terminals table. Pure: no DOM, no store.
 */
import type { BimRef, BlockDefinition, BoxIdentity, Port, PortSide } from '../core/types';
import { ifcGuid } from '../vendor/ifc/guid';

export interface BimPort { group?: string; terminal?: string; side?: string; domain?: string; count?: number; labels?: string[] }
export interface BimPart { id: string; manufacturer?: string; model?: string; name?: string; description?: string; ports?: BimPort[]; ref?: Partial<BimRef> }

export const PORTS_PER_GROUP = 16;

function sideOf(p: BimPort): PortSide {
  if (p.domain === 'power' || p.side === 'supply') return 'power';
  if (p.domain === 'control') return 'control';
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

export function partToDefinition(part: BimPart, ref?: Partial<BimRef> | null): BlockDefinition {
  const ports: Port[] = [];
  const used = new Set<string>();
  for (const p of part.ports ?? []) {
    const n = Math.max(1, p.count ?? 1);
    const shown = Math.min(n, PORTS_PER_GROUP);
    const group = p.group || p.terminal || 'PORT';
    for (let i = 0; i < shown; i++) {
      const label = n === 1 ? group
        : p.labels?.[i] ? `${group} ${p.labels[i]}`
          : `${group} ${i + 1}${i === shown - 1 && n > shown ? ` +${n - shown}` : ''}`;
      let id = portId(label);
      while (used.has(id)) id += '_';
      used.add(id);
      ports.push({ id, side: sideOf(p), label, ...(p.domain ? { domain: p.domain } : {}) });
    }
  }
  const per = (s: PortSide): number => ports.filter((p) => p.side === s).length;
  const tall = Math.max(per('input'), per('output'), 2);
  const wide = Math.max(per('control'), per('power'), 3);
  const title = part.name || `${part.manufacturer ?? ''} ${part.model ?? ''}`.trim() || part.id;
  return {
    id: bimDefinitionId(part),
    name: title.toUpperCase().replace(/[^A-Z0-9_-]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 64) || 'BIM_PART',
    description: `${title} — from the BIM library (${part.id})${part.description ? `: ${part.description}` : ''}`,
    size: { w: Math.max(80, wide * 14), h: Math.max(40, tall * 10) },
    glyph: [],
    ports,
    ...(bimRefOf(part, ref) ? { bimRef: bimRefOf(part, ref) } : {}),
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
