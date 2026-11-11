// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { snap, snapAt } from '../../flow/onGrid';
import type { BlockDefinition, BlockPlacement, Group, PortPortal, SchematicModel } from '../../core/types';
import { partToDefinition, portId, withGlobalId, type BimPart, type BimPort } from '../../flow/bimPart';
import { connectPorts, definitionFor as defOfPlacement, portsOf, removePlacement } from '../../flow/Schematic';
import { outlineCorners } from '../../flow/placement';
import type { EditorStore } from '@state/EditorStore';

/**
 * A HOST'S DEVICES AS BIM BLOCKS WITH PORTS, NOT AS LINE WORK (ROAD-3528)
 *
 * `marks` lets a host draw; it cannot make a thing. A device on the Simulation's
 * sheet or Library Equipment's was a picture of a box with stubs, so nothing on
 * the sheet knew it had ports. `schematic` hands the CAD the BIM parts and says
 * where each instance of them sits — the CAD builds the block from the part
 * itself (`partToDefinition`: inputs left, outputs right, control top, power
 * bottom) and finds each terminal's port, so the host never computes a port id
 * or a coordinate on a block.
 *
 *   schematic { key, hash, layer?,
 *               parts:       [apk.bim.part/1 …]            the parts, ports and all
 *               placements:  [{ ref, part, at: [x, y], group?, name?, ports? }]
 *               connections: [{ a: { ref, terminal }, b: { ref, terminal }, label? }]
 *               groups?:     [{ id, name, parent?, labelWidth? }]   labelWidth: drawing units
 *                                                      kept clear for the group's name
 *               portals?:    { ref: { terminal: far } } }   far: "text" (a bay, grey)
 *                                                          | { text, wired, to? } (another block, accent;
 *                                                            to { drawing, refdes?, port? }: on another
 *                                                            drawing — a click asks the host, `drawing`)
 *
 * `size` [w, h] on a placement is the seat the host's layout gives it (BIM's
 * bench seat): the block is drawn at least that big, so the host's racks and
 * columns do not overlap; the ports are still spread by the CAD.
 *
 * `ports` on a placement are the terminals THAT instance showed beyond its part's
 * (BIM's bench keeps them per instance: 25 DNS-SD hosts, 25 sets); they give that
 * placement a definition of its own. A terminal is found by its port's caption,
 * then by its port id. A placement's `group` names an entry of `groups` (else a
 * group of that name is made); `parent` nests groups.
 *
 * Like `marks`, a send REPLACES everything placed under `key` — placements,
 * their connectors, groups and the definitions built for them — and a send
 * whose hash is already on the sheet is ignored. Nothing here goes on the undo
 * stack: it is the host's. `geometry` reports `schematic` { key: hash } and
 * every host placement's `at` (`hostPlacements`), so a drag here is a seat the
 * host learns and resends.
 */

type XY = [number, number];
type End = { ref?: unknown; terminal?: unknown };
interface HostPlacement { ref: string; part: string; at: XY; group?: string; name?: string; ports?: BimPort[]; size?: XY }
interface HostGroup { id: string; name?: string; parent?: string; labelWidth?: number }
export interface HostSchematicMessage {
  key?: unknown; hash?: unknown; layer?: unknown; parts?: unknown; placements?: unknown;
  connections?: unknown; groups?: unknown; portals?: unknown;
}

const num = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);
const xy = (p: unknown): p is XY => Array.isArray(p) && p.length === 2 && num(p[0]) && num(p[1]);
const str = (s: unknown): s is string => typeof s === 'string' && s.length > 0;
const fold = (s: string) => s.trim().toUpperCase();

/** The hash on the sheet under each key — what `geometry` reports as `schematic`. */
export function schematicInModel(model: SchematicModel): Record<string, string> {
  const out: Record<string, string> = {};
  for (const p of model.placements) if (p.hostKey) out[p.hostKey] = p.hostHash ?? '';
  return out;
}

/**
 * Every host placement's seat, for `geometry`: { key, ref, at, size, ports } — `size`
 * [w, h] is the block AS DRAWN (its outline's extent, centred on `at`), which is
 * bigger than the host's seat when the part needs more room for its ports (ROAD-3593:
 * the Simulation re-seats it so it covers no neighbour); `ports`
 * [{ terminal, at }] is where each of its ports is on the sheet now, named by
 * its caption (the terminal the host sent), so a host can run its own line work
 * — the Simulation's legs, flys and lenses — to the CAD's ports (ROAD-3555)
 * instead of keeping a copy of the block.
 */
export function hostPlacementsOf(model: SchematicModel): { key: string; ref: string; at: XY; size?: XY; ports: { terminal: string; at: XY }[] }[] {
  const sizeOf = (p: BlockPlacement): XY | undefined => {
    const def = defOfPlacement(model, p);
    if (!def) return undefined;
    const c = outlineCorners(def, p);
    const xs = c.map((q) => q.x), ys = c.map((q) => q.y);
    return [Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)];
  };
  return model.placements
    .filter((p) => p.hostKey && p.hostRef)
    .map((p) => ({
      key: p.hostKey!, ref: p.hostRef!, at: [p.at.x, p.at.y] as XY,
      ...(sizeOf(p) ? { size: sizeOf(p) } : {}),
      ports: portsOf(model, p.id).map((r) => ({ terminal: r.port.label ?? r.port.id, at: [r.world.x, r.world.y] as XY })),
    }));
}

/**
 * `schematicMove { key, items: [{ ref, at }] }` sets where some of the host's
 * placements stand, without rebuilding them — a host moving its blocks with
 * its own layout (a fader, a frame it carries). Off the undo stack, like the
 * rest; `geometry` reports the new seats and ports.
 */
export function moveHostSchematic(store: Pick<EditorStore, 'schematic' | 'markDocChanged' | 'requestDraw' | 'emit'>,
  msg: { key?: unknown; items?: unknown }): boolean {
  if (!str(msg.key) || !Array.isArray(msg.items)) return false;
  const byRef = new Map(store.schematic.placements.filter((p) => p.hostKey === msg.key && p.hostRef).map((p) => [p.hostRef!, p]));
  let moved = false;
  for (const it of msg.items as { ref?: unknown; at?: unknown }[]) {
    const p = it && str(it.ref) ? byRef.get(it.ref) : undefined;
    if (!p || !xy(it.at)) continue;
    if (p.at.x === snap(it.at[0]) && p.at.y === snap(it.at[1])) continue;
    p.at = snapAt({ x: it.at[0], y: it.at[1] });   // a host's seat, on the grid (flow/onGrid.ts)
    moved = true;
  }
  if (moved) {
    store.markDocChanged();
    store.requestDraw();
    store.emit();
  }
  return moved;
}

/** A key that moves whenever a host placement does — so a drag is reported. */
export function hostPlacesKey(model: SchematicModel): string {
  let k = '';
  for (const p of model.placements) if (p.hostKey) k += `${p.hostKey}/${p.hostRef}@${p.at.x},${p.at.y};`;
  return k;
}

/** Takes everything placed under `key` off the schematic; true when there was any. */
export function clearHostSchematic(model: SchematicModel, key: string): boolean {
  const before = model.placements.length + model.connectors.length + model.groups.length + model.definitions.length;
  for (const p of model.placements.filter((x) => x.hostKey === key)) removePlacement(model, p.id);
  model.connectors = model.connectors.filter((c) => c.hostKey !== key);
  const gone = new Set(model.groups.filter((g) => g.hostKey === key).map((g) => g.id));
  model.groups = model.groups.filter((g) => !gone.has(g.id));
  for (const g of model.groups) g.children = g.children.filter((id) => !gone.has(id));
  model.definitions = model.definitions.filter((d) => d.hostKey !== key);
  return model.placements.length + model.connectors.length + model.groups.length + model.definitions.length !== before;
}

/**
 * A host's connections ({ a: { ref, terminal }, b: { ref, terminal }, label? }, the `schematic` shape) on the sheet as
 * it is now: each end the placement the host named `ref` and the port its terminal names. An end the sheet does not
 * have is dropped with its connection. For a host that keeps its wires as its own line work (the Simulation) and
 * still wants them in an export (toCad.kicad).
 */
export function resolveHostConnections(model: SchematicModel, raw: unknown): { from: { placementId: number; portId: string }; to: { placementId: number; portId: string }; label?: string }[] {
  const byRef = new Map<string, { placement: BlockPlacement; def: BlockDefinition }>();
  for (const placement of model.placements) {
    const def = placement.hostRef ? defOfPlacement(model, placement) : undefined;
    if (def && !byRef.has(placement.hostRef!)) byRef.set(placement.hostRef!, { placement, def });
  }
  const out = [];
  for (const c of (Array.isArray(raw) ? raw : []) as { a?: End; b?: End; label?: unknown }[]) {
    const end = (e: End | undefined) => {
      const at = e && str(e.ref) ? byRef.get(e.ref) : undefined;
      const port = at && str(e!.terminal) ? portForTerminal(at.def, e!.terminal) : undefined;
      return at && port ? { placementId: at.placement.id, portId: port } : null;
    };
    const a = end(c?.a), b = end(c?.b);
    if (a && b) out.push({ from: a, to: b, ...(str(c.label) ? { label: c.label } : {}) });
  }
  return out;
}

/** The port a terminal names on a definition: by caption, then by port id. */
export function portForTerminal(def: BlockDefinition, terminal: string): string | undefined {
  const t = fold(terminal);
  return (def.ports.find((p) => fold(p.label ?? '') === t) ?? def.ports.find((p) => p.id === portId(terminal)))?.id;
}

function definitionFor(part: BimPart, own: BimPort[] | undefined, key: string, ref: string, size?: XY): BlockDefinition {
  const have = new Set((part.ports ?? []).map((p) => `${p.side}|${fold(p.group ?? p.terminal ?? '')}`));
  const extra = (own ?? []).filter((p) => p && !have.has(`${p.side}|${fold(p.group ?? p.terminal ?? '')}`));
  const whole = extra.length ? { ...part, ports: [...(part.ports ?? []), ...extra] } : part;
  const def = partToDefinition(whole);
  const grow = size && (size[0] > def.size.w || size[1] > def.size.h);
  // a bigger seat: laid out again in it, ports kept under the header on their pitch, the room at the bottom
  const laid = grow ? partToDefinition(whole, null, { w: size![0], h: size![1] }) : def;
  return {
    ...laid,
    ...(def.bimRef ? { bimRef: def.bimRef } : {}),
    ...(extra.length || grow ? { id: `${def.id}@${key}:${ref}` } : {}),
    hostKey: key,
  };
}

function farOf(raw: unknown): PortPortal | null {
  if (str(raw)) return { text: raw, wired: false };
  if (raw && typeof raw === 'object' && str((raw as PortPortal).text)) {
    const far: PortPortal = { text: (raw as PortPortal).text, wired: (raw as PortPortal).wired === true };
    // the far end on another drawing (ROAD-3666): the capsule names it, a click asks the host to open it
    const to = (raw as PortPortal).to;
    if (to && typeof to === 'object' && str(to.drawing)) {
      far.to = { drawing: to.drawing, ...(str(to.refdes) ? { refdes: to.refdes } : {}), ...(str(to.port) ? { port: to.port } : {}) };
    }
    return far;
  }
  return null;
}

export function applyHostSchematic(store: EditorStore, msg: HostSchematicMessage): void {
  const { key, hash } = msg;
  if (!str(key) || typeof hash !== 'string') return;
  const model = store.schematic;
  const onSheet = schematicInModel(model)[key];
  const placements = (Array.isArray(msg.placements) ? msg.placements : []) as HostPlacement[];
  if (onSheet === hash || (onSheet === undefined && !placements.length)) return;

  clearHostSchematic(model, key);
  const layer = str(msg.layer) ? msg.layer : '0';
  if (!store.layers.has(layer)) {
    // a host's layer appearing must not move where the user draws
    const active = store.activeLayerId;
    store.addLayer(layer);
    store.activeLayerId = active;
  }

  const parts = new Map<string, BimPart>();
  for (const p of (Array.isArray(msg.parts) ? msg.parts : []) as BimPart[]) if (p && str(p.id)) parts.set(p.id, p);

  // groups first, so a placement lands in one; nesting after every group exists
  const groups = new Map<string, Group>();
  const declared = (Array.isArray(msg.groups) ? msg.groups : []) as HostGroup[];
  const groupFor = (id: string, name?: string): Group => {
    let g = groups.get(id);
    if (!g) {
      g = { id: model.nextGroupId++, name: name || id, children: [], members: [], layerId: layer, hostKey: key, source: { kind: 'host', id } };
      groups.set(id, g);
      model.groups.push(g);
    }
    return g;
  };
  for (const g of declared) {
    if (!g || !str(g.id)) continue;
    const made = groupFor(g.id, g.name);
    if (num(g.labelWidth) && g.labelWidth > 0) made.labelWidth = g.labelWidth;
  }
  for (const g of declared) {
    if (!g || !str(g.id) || !str(g.parent) || g.parent === g.id || !groups.has(g.parent)) continue;
    groups.get(g.parent)!.children.push(groups.get(g.id)!.id);
  }

  const portals = (msg.portals && typeof msg.portals === 'object' ? msg.portals : {}) as Record<string, Record<string, unknown>>;
  const byRef = new Map<string, { placement: BlockPlacement; def: BlockDefinition }>();
  for (const raw of placements) {
    if (!raw || !str(raw.ref) || !str(raw.part) || !xy(raw.at) || byRef.has(raw.ref)) continue;
    const part = parts.get(raw.part);
    if (!part) continue;
    const def = definitionFor(part, Array.isArray(raw.ports) ? raw.ports : undefined, key, raw.ref, xy(raw.size) ? raw.size : undefined);
    if (!model.definitions.some((d) => d.id === def.id)) model.definitions.push(def);
    const placement: BlockPlacement = {
      id: model.nextPlacementId++, definitionId: def.id, at: snapAt({ x: raw.at[0], y: raw.at[1] }), layerId: layer,
      refdes: str(raw.name) ? raw.name : raw.ref, hostKey: key, hostHash: hash, hostRef: raw.ref,
      // a host's box points back to BIM like a picked one (ROAD-3576) — when its part came with a ref
      ...(def.bimRef ? { bimRef: withGlobalId({ ...def.bimRef }) } : {}),
    };
    const own: Record<string, PortPortal> = {};
    for (const [terminal, far] of Object.entries(portals[raw.ref] ?? {})) {
      const id = portForTerminal(def, terminal);
      const p = farOf(far);
      if (id && p) own[id] = p;
    }
    if (Object.keys(own).length) placement.portals = own;
    model.placements.push(placement);
    byRef.set(raw.ref, { placement, def });
    if (str(raw.group)) groupFor(raw.group).members.push(placement.id);
  }

  for (const c of (Array.isArray(msg.connections) ? msg.connections : []) as { a?: End; b?: End; label?: unknown }[]) {
    const end = (e: End | undefined) => {
      const at = e && str(e.ref) ? byRef.get(e.ref) : undefined;
      const port = at && str(e!.terminal) ? portForTerminal(at.def, e!.terminal) : undefined;
      return at && port ? { placementId: at.placement.id, portId: port } : null;
    };
    const a = end(c?.a);
    const b = end(c?.b);
    if (!a || !b) continue;
    const made = connectPorts(model, a, b, layer);
    if (!made) continue;
    made.hostKey = key;
    if (str(c.label)) made.label = c.label;
  }

  store.markDocChanged();
  store.requestDraw();
  store.emit();
}
