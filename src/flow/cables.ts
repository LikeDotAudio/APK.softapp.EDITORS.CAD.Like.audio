// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { snapAt, wireEndPoint } from './onGrid';
import type { Connector, ConnectorCable, Point, SchematicModel } from '../core/types';
import { routeWaterfallWire } from './autoWire';
import { definitionFor, portOf, portWorldPoint } from './Schematic';

/**
 * A DRAWN WIRE AS A CABLE (ROAD-3582 r4). A connector is a line on the sheet;
 * marked as a cable it is also a real thing — a part, a label, a length, a
 * colour, a status (Connector.cable) — written to IFC as an IfcCableSegment
 * realizing the connection (io/ifc/schematicIfc.ts). This is the model side of
 * the Wire tool's cable editor (components/CableEditor.tsx): finding the wire
 * under the pointer, and setting or clearing what cable it is. Pure: no DOM.
 */

/** Cable statuses offered in the editor; any other word a file carries is kept. */
export const CABLE_STATUSES = ['planned', 'made', 'tested', 'faulty'] as const;

/** The wire as drawn, world points end to end: its own route, else the auto-routed one (drawSchematic's). */
/**
 * Where a wire meets a port: a BIM block's (it has a header, bimPart.ts) at the end of its
 * port's plug and lug, on the grid (onGrid.wireEndPoint); any other symbol's at the port.
 */
function wireEnd(model: SchematicModel, ref: Connector['from']): Point | null {
  const placement = model.placements.find((p) => p.id === ref.placementId);
  const def = placement ? definitionFor(model, placement) : undefined;
  const port = def?.ports.find((p) => p.id === ref.portId);
  if (placement && def?.hat && port) return wireEndPoint(placement, def, port);
  return portWorldPoint(model, ref);
}

export function wirePath(model: SchematicModel, connector: Connector, index: number): Point[] | null {
  const a = wireEnd(model, connector.from);
  const b = wireEnd(model, connector.to);
  if (!a || !b) return null;
  if (connector.route && connector.route.length > 0) return [a, ...connector.route, b];
  const path = routeWaterfallWire(a, b, {
    sourceSide: portOf(model, connector.from)?.side ?? 'output',
    targetSide: portOf(model, connector.to)?.side ?? 'input',
    laneIndex: index % 4,
  });
  // its corners on the grid too: a coordinate shared by two corners snaps the same way, so it stays square
  return path && path.length > 2 ? [path[0]!, ...path.slice(1, -1).map(snapAt), path.at(-1)!] : path;
}

function distToSegment(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x, dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  const t = len2 ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2)) : 0;
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

/** The id of the wire nearest `world` within `tol` (world units), else null. */
export function hitConnectorAt(model: SchematicModel, world: Point, tol: number): number | null {
  let best: number | null = null;
  let bestDist = tol;
  model.connectors.forEach((c, i) => {
    const path = wirePath(model, c, i);
    if (!path) return;
    for (let k = 1; k < path.length; k++) {
      const d = distToSegment(world, path[k - 1], path[k]);
      if (d <= bestDist) {
        bestDist = d;
        best = c.id;
      }
    }
  });
  return best;
}

/** What the editor's fields say, as the cable it is: blanks dropped, the length a positive number of mm. */
export function normaliseCable(fields: { part?: string; tag?: string; length_mm?: string | number; colour?: string; status?: string }): ConnectorCable {
  const out: ConnectorCable = {};
  const word = (v: unknown) => String(v ?? '').trim();
  const part = word(fields.part).toLowerCase();
  if (part) out.part = part;
  if (word(fields.tag)) out.tag = word(fields.tag);
  const len = typeof fields.length_mm === 'number' ? fields.length_mm : Number(word(fields.length_mm).replace(',', '.'));
  if (word(fields.length_mm) && Number.isFinite(len) && len > 0) out.length_mm = len;
  if (word(fields.colour)) out.colour = word(fields.colour);
  if (word(fields.status)) out.status = word(fields.status);
  return out;
}

/** A BIM part id is `<maker>/<model>`: lower-case words and dashes. */
export const isPartId = (s: string): boolean => /^[a-z0-9-]+\/[a-z0-9-]+$/.test(s);

/**
 * Make wire `id` the cable `cable` (null: only a line again). A new object every
 * time — snapshots share connector objects shallowly. → whether anything changed.
 */
export function setConnectorCable(model: SchematicModel, id: number, cable: ConnectorCable | null): boolean {
  const c = model.connectors.find((x) => x.id === id);
  if (!c) return false;
  if (cable === null) {
    if (!c.cable) return false;
    const { cable: _gone, ...rest } = c;
    void _gone;
    model.connectors = model.connectors.map((x) => (x === c ? rest : x));
    return true;
  }
  const next = { ...cable };
  if (c.cable && JSON.stringify(c.cable) === JSON.stringify(next)) return false;
  model.connectors = model.connectors.map((x) => (x === c ? { ...c, cable: next } : x));
  return true;
}

/** A short line naming the wire's ends, for the editor's title. */
export function wireTitle(model: SchematicModel, c: Connector): string {
  const end = (r: Connector['from']) => {
    const p = model.placements.find((x) => x.id === r.placementId);
    return `${p?.refdes ?? `#${r.placementId}`}.${r.portId}`;
  };
  return `${end(c.from)} → ${end(c.to)}`;
}
