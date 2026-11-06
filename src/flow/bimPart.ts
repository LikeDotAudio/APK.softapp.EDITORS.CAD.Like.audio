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
import type { BlockDefinition, BoxIdentity, Port, PortSide } from '../core/types';

export interface BimPort { group?: string; terminal?: string; side?: string; domain?: string; count?: number; labels?: string[] }
export interface BimPart { id: string; manufacturer?: string; model?: string; name?: string; description?: string; ports?: BimPort[] }

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

export function partToDefinition(part: BimPart): BlockDefinition {
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

/** One box as WEB.OsApi `/api/os/devices` lists it (ROAD-3538: `presented` + its serial). */
export interface OsDevice { model?: string; serial?: string; resource?: string; presented?: string | null }

const foldModel = (m?: string) => String(m ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '');

/**
 * The boxes of a model the OS says the bench presents now — the fallback when
 * the BIM library lists none of the part's instances online. Same rule as
 * liveBoxesOf: serial, else fixed GPIB address, never an IP.
 */
export function liveBoxesFromDevices(devices: OsDevice[], model?: string): BoxIdentity[] {
  const want = foldModel(model);
  if (!want) return [];
  return liveBoxesOf(devices
    .filter((d) => d.presented && foldModel(d.model) === want)
    .map((d) => ({ state: 'online', protocol: 'visa', serial: d.serial, resource: d.resource })));
}
