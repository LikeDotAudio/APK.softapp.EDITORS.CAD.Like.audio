// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type {
  BlockDefinition,
  BlockPlacement,
  Connector,
  Group,
  Point,
  Port,
  PortRef,
  SchematicModel,
} from '../core/types';
import { terminalKey } from '../core/types';
import { CATALOG } from './catalog';
import { forgetPlacement } from './groups';
import { placementPoint } from './placement';
import { portLocalPoint } from './portLocalPoint';

/**
 * The operations on the schematic model. Everything here is a plain function
 * over `SchematicModel`, mirroring how `Doc` keeps one mutation per file under
 * `model/doc/` - the model is data, and the answers it can give are functions.
 *
 * The queries are the point. `connectorsOf`, `neighboursOf` and `isConnected`
 * answer "what is connected to what" without looking at a single coordinate,
 * which is the difference between a drawing of a system and a model of one.
 */

export function createSchematic(definitions = CATALOG): SchematicModel {
  return {
    definitions: definitions.slice(),
    placements: [],
    connectors: [],
    groups: [],
    nextPlacementId: 1,
    nextConnectorId: 1,
    nextGroupId: 1,
  };
}

export function definitionOf(model: SchematicModel, id: string): BlockDefinition | undefined {
  return model.definitions.find((d) => d.id === id);
}

export function placementOf(model: SchematicModel, id: number): BlockPlacement | undefined {
  return model.placements.find((p) => p.id === id);
}

/** The definition a placement is an instance of, or undefined if it is orphaned. */
export function definitionFor(
  model: SchematicModel,
  placement: BlockPlacement,
): BlockDefinition | undefined {
  return definitionOf(model, placement.definitionId);
}

/** Place a definition on the sheet. `refdes` defaults to a per-definition counter. */
export function placeBlock(
  model: SchematicModel,
  definitionId: string,
  at: Point,
  layerId = '0',
  refdes?: string,
): BlockPlacement | null {
  const def = definitionOf(model, definitionId);
  if (!def) return null;
  const existing = model.placements.filter((p) => p.definitionId === definitionId).length;
  const placement: BlockPlacement = {
    id: model.nextPlacementId++,
    definitionId,
    at: { ...at },
    layerId,
    refdes: refdes ?? `${def.name}${existing + 1}`,
  };
  model.placements.push(placement);
  return placement;
}

/**
 * Remove a placement AND every connector that referenced it AND its membership
 * of whatever group held it. All three, because a group listing an id that is
 * no longer on the sheet draws a box sized by a ghost - `groupBounds` skips the
 * missing placement, so the box silently shrinks rather than erroring, which is
 * the worst of the three possible behaviours.
 */
export function removePlacement(model: SchematicModel, id: number): boolean {
  const before = model.placements.length;
  model.placements = model.placements.filter((p) => p.id !== id);
  if (model.placements.length === before) return false;
  model.connectors = model.connectors.filter(
    (c) => c.from.placementId !== id && c.to.placementId !== id,
  );
  forgetPlacement(model, id);
  return true;
}

export function portOf(model: SchematicModel, ref: PortRef): Port | undefined {
  const placement = placementOf(model, ref.placementId);
  if (!placement) return undefined;
  const def = definitionFor(model, placement);
  return def?.ports.find((p) => p.id === ref.portId);
}

/** The caption shown for a port: the placement's override, then the definition's. */
export function portLabel(model: SchematicModel, ref: PortRef): string {
  const placement = placementOf(model, ref.placementId);
  const port = portOf(model, ref);
  return placement?.portLabels?.[ref.portId] ?? port?.label ?? ref.portId;
}

/** Where a port lands on the sheet - derived from its side, never stored. */
export function portWorldPoint(model: SchematicModel, ref: PortRef): Point | null {
  const placement = placementOf(model, ref.placementId);
  if (!placement) return null;
  const def = definitionFor(model, placement);
  if (!def) return null;
  const port = def.ports.find((p) => p.id === ref.portId);
  if (!port) return null;
  return placementPoint(placement, portLocalPoint(def, port));
}

export interface ResolvedPort {
  ref: PortRef;
  port: Port;
  world: Point;
}

/** Every port of one placement, resolved onto the sheet. */
export function portsOf(model: SchematicModel, placementId: number): ResolvedPort[] {
  const placement = placementOf(model, placementId);
  if (!placement) return [];
  const def = definitionFor(model, placement);
  if (!def) return [];
  return def.ports.map((port) => ({
    ref: { placementId, portId: port.id },
    port,
    world: placementPoint(placement, portLocalPoint(def, port)),
  }));
}

export function samePort(a: PortRef, b: PortRef): boolean {
  return a.placementId === b.placementId && a.portId === b.portId;
}

/**
 * Connect two ports. Refuses a port to itself and refuses a duplicate in
 * either direction - a connection is an undirected fact about two ports, and
 * drawing it twice does not make it truer.
 */
export function connectPorts(
  model: SchematicModel,
  from: PortRef,
  to: PortRef,
  layerId = '0',
): Connector | null {
  if (samePort(from, to)) return null;
  if (!portOf(model, from) || !portOf(model, to)) return null;
  const already = model.connectors.some(
    (c) =>
      (samePort(c.from, from) && samePort(c.to, to)) ||
      (samePort(c.from, to) && samePort(c.to, from)),
  );
  if (already) return null;
  const connector: Connector = {
    id: model.nextConnectorId++,
    from: { ...from },
    to: { ...to },
    layerId,
  };
  model.connectors.push(connector);
  return connector;
}

export function disconnect(model: SchematicModel, connectorId: number): boolean {
  const before = model.connectors.length;
  model.connectors = model.connectors.filter((c) => c.id !== connectorId);
  return model.connectors.length !== before;
}

// ------------------------------------------------------------------ queries

/** Every connector touching a placement. */
export function connectorsOf(model: SchematicModel, placementId: number): Connector[] {
  return model.connectors.filter(
    (c) => c.from.placementId === placementId || c.to.placementId === placementId,
  );
}

/** Every connector landing on one specific port. */
export function connectorsAtPort(model: SchematicModel, ref: PortRef): Connector[] {
  return model.connectors.filter((c) => samePort(c.from, ref) || samePort(c.to, ref));
}

/** The placements one placement is wired to, each listed once. */
export function neighboursOf(model: SchematicModel, placementId: number): number[] {
  const out = new Set<number>();
  for (const c of connectorsOf(model, placementId)) {
    const other = c.from.placementId === placementId ? c.to.placementId : c.from.placementId;
    if (other !== placementId) out.add(other);
  }
  return Array.from(out);
}

export function isConnected(model: SchematicModel, a: PortRef, b: PortRef): boolean {
  return model.connectors.some(
    (c) => (samePort(c.from, a) && samePort(c.to, b)) || (samePort(c.from, b) && samePort(c.to, a)),
  );
}

/**
 * Every port on the sheet as an `Interfaces.json` Terminals key. This is the
 * list PLAN-36.04's pairing joins against: one string per port, spelled by
 * `terminalKey()` so the drawing and the termination table cannot drift.
 */
export function terminalKeysOf(model: SchematicModel): string[] {
  const keys: string[] = [];
  for (const placement of model.placements) {
    const def = definitionFor(model, placement);
    if (!def) continue;
    const refdes = placement.refdes ?? `#${placement.id}`;
    for (const port of def.ports) keys.push(terminalKey(refdes, port.side, port.id));
  }
  return keys;
}

// ---------------------------------------------------------------- hit tests

/** The port nearest a world point within `tol` world units, or null. */
export function hitPortAt(model: SchematicModel, world: Point, tol: number): PortRef | null {
  let best: PortRef | null = null;
  let bestDist = tol;
  for (const placement of model.placements) {
    for (const resolved of portsOf(model, placement.id)) {
      const d = Math.hypot(resolved.world.x - world.x, resolved.world.y - world.y);
      if (d <= bestDist) {
        bestDist = d;
        best = resolved.ref;
      }
    }
  }
  return best;
}

/** The topmost placement whose outline contains a world point, or null. */
export function hitPlacementAt(model: SchematicModel, world: Point): BlockPlacement | null {
  for (let i = model.placements.length - 1; i >= 0; i -= 1) {
    const placement = model.placements[i];
    if (!placement) continue;
    const def = definitionFor(model, placement);
    if (!def) continue;
    // Into block-local space, where the outline is an axis-aligned box.
    const rad = ((placement.rotation ?? 0) * Math.PI) / 180;
    const s = placement.scale ?? 1;
    const dx = (world.x - placement.at.x) / s;
    const dy = (world.y - placement.at.y) / s;
    const lx = dx * Math.cos(-rad) - dy * Math.sin(-rad);
    const ly = dx * Math.sin(-rad) + dy * Math.cos(-rad);
    if (Math.abs(lx) <= def.size.w / 2 && Math.abs(ly) <= def.size.h / 2) return placement;
  }
  return null;
}

export function isSchematicEmpty(model: SchematicModel): boolean {
  return (
    model.placements.length === 0 && model.connectors.length === 0 && model.groups.length === 0
  );
}

// ------------------------------------------------------------- persistence

/**
 * What a saved session holds. The DEFINITIONS are deliberately not in it: the
 * catalogue is code, not the user's data, so a reopened sheet gets the current
 * symbols rather than a frozen copy of last week's. A placement whose
 * definition has since left the catalogue is skipped by every reader here
 * rather than crashing one.
 */
export interface SchematicSnapshot {
  placements: BlockPlacement[];
  connectors: Connector[];
  /** Optional so a session saved before groups existed still restores. */
  groups?: Group[];
  nextPlacementId: number;
  nextConnectorId: number;
  nextGroupId?: number;
}

export function snapshotSchematic(model: SchematicModel): SchematicSnapshot {
  return {
    placements: model.placements.map((p) => ({ ...p, at: { ...p.at } })),
    connectors: model.connectors.map((c) => ({
      ...c,
      from: { ...c.from },
      to: { ...c.to },
      route: c.route?.map((p) => ({ ...p })),
    })),
    groups: model.groups.map((g) => ({
      ...g,
      children: g.children.slice(),
      members: g.members.slice(),
      source: g.source ? { ...g.source } : undefined,
    })),
    nextPlacementId: model.nextPlacementId,
    nextConnectorId: model.nextConnectorId,
    nextGroupId: model.nextGroupId,
  };
}

/** Restore in place — the store holds one model object for its whole life. */
export function restoreSchematic(model: SchematicModel, saved: SchematicSnapshot): void {
  model.placements = saved.placements.map((p) => ({ ...p, at: { ...p.at } }));
  model.connectors = saved.connectors.map((c) => ({ ...c }));
  model.nextPlacementId =
    saved.nextPlacementId ?? model.placements.reduce((n, p) => Math.max(n, p.id + 1), 1);
  model.nextConnectorId =
    saved.nextConnectorId ?? model.connectors.reduce((n, c) => Math.max(n, c.id + 1), 1);
  model.groups = (saved.groups ?? []).map((g) => ({
    ...g,
    children: (g.children ?? []).slice(),
    members: (g.members ?? []).slice(),
  }));
  model.nextGroupId =
    saved.nextGroupId ?? model.groups.reduce((n, g) => Math.max(n, g.id + 1), 1);
}

export function clearSchematic(model: SchematicModel): boolean {
  if (isSchematicEmpty(model)) return false;
  model.placements = [];
  model.connectors = [];
  model.groups = [];
  return true;
}
