// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Point, Port, PortSide, SchematicModel } from '../core/types';
import { getEssenceCategory } from '../connectors/adapterRules';
import { lookupConnectorLoose } from '../connectors/ConnectorLookup';
import { CARRIED_OVER_IP_FAMILIES, signalFamilyOf } from '../connectors/signalFormats';
import { portId as toPortId } from './bimPart';
import { definitionFor, hitPlacementAt, placementOf, portsOf } from './Schematic';

/**
 * A CONNECTOR DROPPED ON A DEVICE (the owner, 2026-11-11: "when I am dragging a connector to
 * the device, it should add the connector to the device as needed").
 *
 * "As needed":
 *  - dropped ON or NEAR A PORT → that port gets the connector (its `RJ45?` guess becomes the
 *    word), whatever it had;
 *  - dropped on the BODY → the first port whose connector is unknown or only guessed and that
 *    fits (the guess is this connector; else a guess OF ITS FAMILY — connectorFamily, ROAD-3688;
 *    else a port with no connector on the right side for a receiver/sender and the same kind
 *    of signal) gets it;
 *  - else → a NEW port with that connector: inputs/receivers left, outputs/senders right, a
 *    two-way one (RJ45, a network) on the side nearest the drop, power along the bottom —
 *    named and numbered after the ports of its kind already there (`RECEIVER 0` → `RECEIVER 1`).
 *
 * Kept on the placement (placement.ports / portConnectors — placementPorts.ts). Pure.
 */

export type ConnectorDirection = 'input' | 'output' | 'both' | 'power';

/** Which way a connector faces: a receiver/input, a sender/output, two-way, or power. */
export function connectorDirection(type: string): ConnectorDirection {
  const t = type.toUpperCase();
  const known = lookupConnectorLoose(type);
  const words = `${t} ${(known?.entry.description ?? '').toUpperCase()}`;
  if (getEssenceCategory(type) === 'physical_power' || /(^|[^A-Z])(POWER|IEC|NEMA|C13|C14|C19|C20|POWERCON|DC-?IN|MAINS)([^A-Z]|$)/.test(t)) return 'power';
  if (/(^|[-_ ])(RX|IN|INPUT)\d*([-_ ]|$)|\bRECEIVE|\bCONSUMED\b|\bSINK\b/.test(words)) return 'input';
  if (/(^|[-_ ])(TX|OUT|OUTPUT)\d*([-_ ]|$)|\bTRANSMIT|\bPRODUCED\b|\bSOURCE\b/.test(words)) return 'output';
  return 'both';
}

/** The Terminals domain a connector carries. */
export function connectorDomain(type: string): string | undefined {
  switch (getEssenceCategory(type)) {
    case 'audio': case 'physical_audio': return 'audio';
    case 'video': case 'physical_video': return 'video';
    case 'physical_network': case 'transport_ip': return 'network';
    case 'physical_power': return 'power';
    case 'control': return 'control';
    default: return undefined;
  }
}

export type DropOutcome =
  | { kind: 'assigned'; placementId: number; portId: string; was?: string }
  | { kind: 'added'; placementId: number; portId: string; label: string; side: PortSide };

const unknownConnector = (p: Port) => !p.connector || !!p.connectorGuess;

/** Which side a new port of this connector goes on, for a drop at `at` on the placement. */
function sideFor(dir: ConnectorDirection, model: SchematicModel, placementId: number, at: Point): PortSide {
  if (dir === 'power') return 'power';
  if (dir === 'input' || dir === 'output') return dir;
  const placement = placementOf(model, placementId)!;
  const rad = ((placement.rotation ?? 0) * Math.PI) / 180;
  const dx = at.x - placement.at.x, dy = at.y - placement.at.y;
  const lx = dx * Math.cos(-rad) - dy * Math.sin(-rad);
  return lx < 0 ? 'input' : 'output';
}

/**
 * A label after the ports of ITS KIND on that side — the same connector, else the same kind of
 * signal — the last numbered one, one up (`RECEIVER 0` → `RECEIVER 1`); else the connector, numbered.
 */
export function nextPortLabel(ports: readonly Port[], side: PortSide, type: string): string {
  const domain = connectorDomain(type);
  const kin = ports.filter((p) => p.side === side
    && ((p.connector ?? '').toUpperCase() === type.toUpperCase() || (!!domain && p.domain === domain)));
  const numbered = kin.map((p) => /^(.*?)([\s_-]*)(\d+)$/.exec(p.label ?? p.id)).filter((m): m is RegExpExecArray => !!m && !!m[1]);
  if (numbered.length) {
    const last = numbered.at(-1)!;
    const top = Math.max(...numbered.filter((m) => m[1] === last[1]).map((m) => Number(m[3])));
    return `${last[1]}${last[2] || ' '}${top + 1}`;
  }
  const same = ports.filter((p) => (p.connector ?? '').toUpperCase() === type.toUpperCase()).length;
  return `${type} ${same + 1}`;
}

/**
 * A connector's FAMILY — what a guessed port must share with a connector to take it (ROAD-3688):
 * a physical connector's vocabulary family (contracts/ifc/connectors.json: `XLR`, `RJ`, `Coaxial`,
 * `USB` …), a format carried over IP (Dante, AES67, ST 2110, NMOS …) `network` and `carried`, and
 * the network plugs (RJ, SFP, QSFP) `network` too. Pure.
 */
export interface ConnectorFamily { family: string; network: boolean; carried: boolean }
export function connectorFamily(type: string): ConnectorFamily {
  const known = lookupConnectorLoose(type);
  const fmt = signalFamilyOf(known?.abbreviation ?? type);
  const carried = !!fmt && CARRIED_OVER_IP_FAMILIES.has(fmt);
  const essence = getEssenceCategory(known?.abbreviation ?? type);
  const network = carried || essence === 'physical_network' || essence === 'transport_ip'
    || /^(RJ|SFP|QSFP)/i.test(known?.entry.ifc?.family ?? '');
  const family = known?.entry.ifc?.family ?? (carried ? 'network' : fmt ?? known?.entry.group ?? (essence !== 'unknown' ? essence : type.trim().toUpperCase()));
  return { family: family.toUpperCase(), network, carried };
}

/** Two connectors of one family: the same plug family, or a carried format and a network plug / another carried one. */
export function sameFamily(a: string, b: string): boolean {
  const x = connectorFamily(a), y = connectorFamily(b);
  return x.family === y.family || (x.network && y.network && (x.carried || y.carried));
}

/**
 * Does an unknown port fit this connector? Its guess IS it ('exact'); a GUESSED port only a connector
 * of the guess's family ('family': a Dante connector fills a Dante / RJ45 guess, an XLR an XLR guess —
 * never DANTE-RX2 into an `XLR3-F?`); a port with no connector the right side and kind of signal ('fits').
 */
function fits(p: Port, type: string, dir: ConnectorDirection): 'exact' | 'family' | 'fits' | null {
  if (!unknownConnector(p)) return null;
  if (p.connector && p.connector.toUpperCase() === type.toUpperCase()) return 'exact';
  if (dir === 'power') return p.side === 'power' && (!p.connector || sameFamily(p.connector, type)) ? (p.connector ? 'family' : 'fits') : null;
  if (p.side === 'power' || p.side === 'control') return null;
  if (dir !== 'both' && p.side !== dir) return null;
  if (p.connector) return sameFamily(p.connector, type) ? 'family' : null;
  const want = connectorDomain(type);
  if (want && p.domain && p.domain !== want && !(want === 'network' || p.domain === 'network')) return null;
  return 'fits';
}

/**
 * Drop connector `type` at `at` (sheet units) with `tol` the "near a port" reach. Mutates the
 * model; the outcome, or null when nothing is under the drop.
 */
export function dropConnector(model: SchematicModel, type: string, at: Point, tol: number): DropOutcome | null {
  const name = lookupConnectorLoose(type)?.abbreviation ?? type.trim();
  if (!name) return null;
  // on or near a port: that port
  let near: { placementId: number; portId: string; d: number } | null = null;
  for (const p of model.placements) for (const r of portsOf(model, p.id)) {
    const d = Math.hypot(r.world.x - at.x, r.world.y - at.y);
    if (d <= tol && (!near || d < near.d)) near = { placementId: p.id, portId: r.port.id, d };
  }
  if (near) return assign(model, near.placementId, near.portId, name);
  const placement = hitPlacementAt(model, at);
  if (!placement) return null;
  return dropOnDevice(model, placement.id, name, at);
}

/** Drop on a device's body: fill the first fitting unknown port, else add one. */
export function dropOnDevice(model: SchematicModel, placementId: number, type: string, at: Point): DropOutcome | null {
  const placement = placementOf(model, placementId);
  const def = placement && definitionFor(model, placement);
  if (!placement || !def) return null;
  const dir = connectorDirection(type);
  const ranked = def.ports.map((p) => ({ p, f: fits(p, type, dir) })).filter((x) => x.f);
  const pick = ranked.find((x) => x.f === 'exact') ?? ranked.find((x) => x.f === 'family') ?? ranked[0];
  if (pick) return assign(model, placementId, pick.p.id, type);
  return addPort(model, placementId, type, sideFor(dir, model, placementId, at));
}

/** Give a port of the device this connector. */
export function assign(model: SchematicModel, placementId: number, portId: string, type: string): DropOutcome | null {
  const placement = placementOf(model, placementId);
  const def = placement && definitionFor(model, placement);
  const port = def?.ports.find((p) => p.id === portId);
  if (!placement || !port) return null;
  const was = port.connector ? `${port.connector}${port.connectorGuess ? '?' : ''}` : undefined;
  const own = placement.ports?.find((p) => p.id === portId);
  if (own) { own.connector = type; delete own.connectorGuess; }
  else placement.portConnectors = { ...placement.portConnectors, [portId]: type };
  return { kind: 'assigned', placementId, portId, ...(was ? { was } : {}) };
}

/** Add a port with this connector on `side`, named after the ports of its kind. */
export function addPort(model: SchematicModel, placementId: number, type: string, side: PortSide): DropOutcome | null {
  const placement = placementOf(model, placementId);
  const def = placement && definitionFor(model, placement);
  if (!placement || !def) return null;
  const label = nextPortLabel(def.ports, side, type);
  let id = toPortId(label);
  while (def.ports.some((p) => p.id === id)) id += '_';
  const domain = connectorDomain(type);
  const port: Port = { id, side, label, connector: type, ...(domain && side !== 'power' ? { domain } : side === 'power' ? { domain: 'power' } : {}) };
  placement.ports = [...(placement.ports ?? []), port];
  return { kind: 'added', placementId, portId: id, label, side };
}

/** What a drop did, in a sentence for the hint line. */
export function describeDrop(o: DropOutcome, model: SchematicModel): string {
  const who = placementOf(model, o.placementId)?.refdes?.split(' · ')[0] ?? `#${o.placementId}`;
  return o.kind === 'added'
    ? `${who}: new port ${o.label} (${o.side === 'input' ? 'left' : o.side === 'output' ? 'right' : 'bottom'})`
    : `${who}: ${o.portId}${o.was ? ` ${o.was} →` : ''} given its connector`;
}
