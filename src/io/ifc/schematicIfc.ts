// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { BlockPlacement, BlockSize, Connector, ConnectorCable, Group, Point } from '../../core/types';
import type { SchematicSnapshot } from '../../flow/Schematic';
import { portId as cadPortId } from '../../flow/bimPart';
import { deref, entitiesByType, getPsets, inverseIndex, isRef, unwrap, type StepEntity, type StepFile, type StepRef, type StepValue } from '../../vendor/ifc/step';
import { ifcGuid } from '../../vendor/ifc/guid';
import { E, R, bool, ident, int, label, length, realv, text, type PropValue, type StepBuilder } from './stepBuilder';

/**
 * THE FLOW SCHEMATIC AS IFC ENTITIES (IFC-CORE-DELTAS cad-6)
 *
 * The wiring and the boxes around the boxes are written as what IFC says they
 * are, not as JSON in APK_CadSession.Native:
 *
 * - Every placement is an occurrence. A BIM block is already its part's
 *   occurrence (exportIfc, cad-5); a catalogue / connector block, which has no
 *   part (owner decision: generic Flow definitions stay generic), is an
 *   IfcDistributionElement whose ObjectType is its definition id.
 * - Each connector is one IfcRelConnectsPorts between two IfcDistributionPorts
 *   nested on those occurrences: RelatingPort the SOURCE side (else `from`),
 *   RelatedPort the SINK side. A BIM occurrence's own terminal is used when its
 *   name is the CAD port id (bimPart portId); otherwise, and for every catalogue
 *   block, the port is made here, named by the CAD port id. IFC lets a port be
 *   RelatingPort once and RelatedPort once, so a fan-out gets one more port.
 *   Every port a connector uses carries APK_SchematicPort.PortId, the CAD id.
 * - Its drawn route is an IfcAnnotation 'WIRE' (Curve2D in a GRAPH_VIEW
 *   subcontext) with APK_SchematicWire {ConnectorId, Connection = the
 *   relationship's GlobalId, Label, Layer, Reversed, RoutePoints, HostKey, Net}
 *   — Net the name of the net the wire is on (flow/wires.ts).
 * - A wire that is a real cable (Connector.cable) is also an IfcCableSegment,
 *   the relationship's RealizingElement: Tag = the cable's label, typed by its
 *   BIM cable part (IfcRelDefinesByType) when the drawing has the part's file
 *   and that part is an IfcCableSegmentType, else PredefinedType CABLESEGMENT;
 *   APK_Connection {Medium wired, CablePart, CableStatus, CableColour} and
 *   Qto_CableSegmentBaseQuantities.Length (mm) on it.
 * - Every placement's symbol on the sheet is an IfcAnnotation (SYMBOL) in the
 *   GRAPH_VIEW subcontext, placed where the block is drawn — its 2D outline
 *   (Annotation, Curve2D: a closed IfcPolyline, the definition's size × the
 *   placement's scale, mm, SchematicSnapshot.sizes) — and assigned to its
 *   occurrence by IfcRelAssignsToProduct (what ifcopenshell.api.drawing
 *   .assign_product writes); APK_SheetSeat.Sheet 'Schematic'. Derived from the
 *   placement, so the reader ignores it.
 * - GlobalIds stay put across a host's resend (hostSchematic.ts replaces what
 *   it placed by key): an occurrence's derives from (hostKey, hostRef), a
 *   host group's from (hostKey, its source), a host connector's from
 *   (hostKey, both ends' hostRef and port id); the ports, symbols, wires and
 *   cables from those. Everything else keeps its CAD id.
 * - The ports' own SystemType (from the part) groups the occurrences into
 *   IfcDistributionSystems (AUDIOVISUAL, SIGNAL, ELECTRICAL …) — derived, so
 *   the reader ignores them.
 * - A group whose source is a rack or a kit is an IfcElementAssembly
 *   (USERDEFINED, ObjectType RACK / KIT, AssemblyPlace SITE) aggregating what
 *   it holds (IfcRelAggregates); any other group is an IfcGroup holding its
 *   members and child groups by IfcRelAssignsToGroup. APK_SchematicGroup keeps
 *   its id, layer, source and host key; APK_SchematicLayout its pad, folded
 *   state and label width — layout only, never a physical position.
 *
 * `readSchematic` is the inverse, held lossless by test (ifcSession.test.ts).
 * A file written before cad-6 (connectors and groups in Native) still reads.
 */

/** What APK_CadSession.Native keeps of the schematic: the counters, and an order for the placements. */
export interface NativeSchematic {
  /** `{ifc: id}` — the placement is the occurrence whose APK_Placement.PlacementId is id. Files before cad-6 hold catalogue placements whole. */
  placements: (BlockPlacement | { ifc: number })[];
  nextPlacementId: number;
  nextConnectorId: number;
  nextGroupId?: number;
  /** cad-6 files: the session had a `groups` array (possibly empty). */
  hasGroups?: boolean;
  /** The placed symbols' sizes (SchematicSnapshot.sizes), drawing units: what the SYMBOL outlines are drawn from. */
  sizes?: Record<string, BlockSize>;
  /** Files before cad-6. */
  connectors?: Connector[];
  groups?: Group[];
}

export interface SchematicIfcTargets {
  b: StepBuilder;
  oh: StepRef;
  doc: string;
  mm: (v: number) => number;
  /** exportIfc's own property-set writer (its sets are related at the end of the file). */
  pset: (owner: string, name: string, props: [string, PropValue][], objects: StepRef[]) => void;
  storeyPl: StepRef;
  /** The 2D Plan 'Annotation' subcontext; its parent is the Plan context. */
  annotationCtx: StepRef;
  /** The BIM occurrences exportIfc wrote, by placement id. */
  occurrences: Map<number, { ref: StepRef; gid: string }>;
  /** exportIfc's storey containment: what this writes is held there too. */
  inStorey: StepRef[];
  /** exportIfc's Qto_ writer (lengths mm). */
  qto?: (owner: string, name: string, qs: [string, 'L' | 'A' | 'V', number | undefined][], objects: StepRef[]) => void;
  /** The part types exportIfc merged, by part id: a cable part's types its cables. */
  types?: Map<string, { type: StepRef; entity: string }>;
}

/** Group sources drawn as a physical assembly rather than a logical group. */
const ASSEMBLY_KINDS = new Set(['rack', 'kit']);
const isAssembly = (g: Group) => !!g.source && ASSEMBLY_KINDS.has(g.source.kind.toLowerCase());

const IPV4 = /\b\d{1,3}(?:\.\d{1,3}){3}\b/;
/** The BlockPlacement keys written as their own properties; anything else rides in Extra. */
const KNOWN = new Set(['id', 'definitionId', 'at', 'rotation', 'scale', 'layerId', 'refdes', 'portLabels', 'portals', 'hostKey', 'hostHash', 'hostRef', 'bimRef', 'serial', 'mac', 'resource', 'z_mm', 'mountedOn', 'mirrorOf']);
const json = (v: unknown) => JSON.stringify(v);
const CABLE_TYPE = 'IFCCABLESEGMENTTYPE';

/** The key a host's group keeps across resends, else its CAD id. */
function groupKey(g: Group): string {
  return g.hostKey && g.source?.id ? `host:${g.hostKey}:${g.source.kind}:${g.source.id}` : String(g.id);
}

/** The key a host's connector keeps across resends — its two ends by the host's names, in either order — else its CAD id. */
function connectorKey(c: Connector, byId: Map<number, BlockPlacement>): string {
  const a = byId.get(c.from.placementId), z = byId.get(c.to.placementId);
  if (!c.hostKey || !a?.hostRef || !z?.hostRef || a.hostKey !== c.hostKey || z.hostKey !== c.hostKey) return String(c.id);
  const ends = [`${a.hostRef}.${c.from.portId}`, `${z.hostRef}.${c.to.portId}`].sort();
  return `host:${c.hostKey}:${ends.join('~')}`;
}

/** Keys unique within the file: a repeat (two host connectors on the same two ports) falls back to the CAD id. */
function uniqueKeys<T extends { id: number }>(items: T[], key: (x: T) => string): Map<number, string> {
  const seen = new Set<string>(), out = new Map<number, string>();
  for (const x of items) {
    let k = key(x);
    if (seen.has(k)) k = String(x.id);
    seen.add(k);
    out.set(x.id, k);
  }
  return out;
}
const opt = <T,>(v: T | undefined | null, w: (x: T) => StepValue): PropValue => (v === undefined || v === null ? undefined : w(v));

/** Native's schematic for a cad-6 file: every placement by reference, connectors and groups in IFC. */
export function schematicNative(sch: SchematicSnapshot): NativeSchematic {
  return {
    placements: sch.placements.map((p) => ({ ifc: p.id })),
    nextPlacementId: sch.nextPlacementId,
    nextConnectorId: sch.nextConnectorId,
    ...(sch.nextGroupId !== undefined ? { nextGroupId: sch.nextGroupId } : {}),
    ...(sch.groups ? { hasGroups: true } : {}),
    ...(sch.sizes ? { sizes: sch.sizes } : {}),
  };
}

export function writeSchematic(t: SchematicIfcTargets, sch: SchematicSnapshot): void {
  const { b, oh, doc, mm, pset } = t;
  const role = (...r: (string | number)[]) => ifcGuid('cad', doc, ...r.map(String));
  const held: StepRef[] = [];
  const zUp = () => b.once('IFCDIRECTION', [[R(0), R(0), R(1)]]);
  const placementAt = (x: number, y: number, deg: number) => {
    const rad = (deg * Math.PI) / 180;
    const p = b.add('IFCCARTESIANPOINT', [[R(x), R(y), R(0)]]);
    const ax = deg ? b.add('IFCAXIS2PLACEMENT3D', [p, zUp(), b.add('IFCDIRECTION', [[R(Math.cos(rad)), R(Math.sin(rad)), R(0)]])])
      : b.add('IFCAXIS2PLACEMENT3D', [p, null, null]);
    return b.add('IFCLOCALPLACEMENT', [t.storeyPl, ax]);
  };

  // ---- every placement an occurrence: catalogue / connector blocks here (BIM blocks are exportIfc's)
  const occ = new Map<number, { ref: StepRef; gid: string }>(t.occurrences);
  for (const p of sch.placements) {
    if (occ.has(p.id)) continue;
    const g = role('occ', p.hostKey && p.hostRef ? `host:${p.hostKey}:${p.hostRef}` : `placement:${p.id}`);
    const e = b.add('IFCDISTRIBUTIONELEMENT', [g, oh, p.refdes ?? p.definitionId, null, p.definitionId, placementAt(mm(p.at.x), mm(p.at.y), p.rotation ?? 0), null, p.refdes ?? null]);
    occ.set(p.id, { ref: e, gid: g });
    held.push(e);
    const mac = p.mac?.toLowerCase();
    const extra = Object.fromEntries(Object.entries(p).filter(([k]) => !KNOWN.has(k)));
    pset(g, 'Pset_ManufacturerOccurrence', [['SerialNumber', opt(p.serial, ident)]], [e]);
    pset(g, 'APK_Identity', [['MacAddress', opt(mac, ident)]], [e]);
    pset(g, 'APK_Placement', [
      ['PlacementId', int(p.id)], ['DefinitionId', ident(p.definitionId)], ['Layer', ident(p.layerId)],
      ['Rotation', opt(p.rotation, realv)], ['Scale', opt(p.scale, realv)], ['Refdes', opt(p.refdes, label)],
      ['MountingHeight', opt(p.z_mm, length)],
      ['Resource', p.resource && !IPV4.test(p.resource) ? ident(p.resource) : undefined],
      ['Mac', p.mac !== undefined && p.mac !== mac ? ident(p.mac) : undefined],
      ['HostKey', opt(p.hostKey, ident)], ['HostHash', opt(p.hostHash, ident)], ['HostRef', opt(p.hostRef, ident)],
      ['PortLabels', p.portLabels ? text(json(p.portLabels)) : undefined], ['Portals', p.portals ? text(json(p.portals)) : undefined],
      ['MountedOnEdge', opt(p.mountedOn?.edgeId, int)], ['MirrorOf', opt(p.mirrorOf, int)],
      ['BimRef', p.bimRef ? text(json(p.bimRef)) : undefined],
      ['Extra', Object.keys(extra).length ? text(json(extra)) : undefined],
    ], [e]);
  }

  // ---- each placement's symbol on the sheet, assigned to its occurrence
  let graph: StepRef | null = null;
  const graphCtx = () => graph ??= b.add('IFCGEOMETRICREPRESENTATIONSUBCONTEXT', ['Annotation', 'Plan', { kind: 'derived' }, { kind: 'derived' }, { kind: 'derived' }, { kind: 'derived' }, b.entity(t.annotationCtx).args[6] ?? null, null, E('GRAPH_VIEW'), null]);
  for (const p of sch.placements) {
    const o = occ.get(p.id)!;
    const sg = ifcGuid(o.gid, 'symbol');
    // the block's outline as drawn (its definition's size × the placement's scale, mm, centred on where it
    // stands, turned with it by the placement), else — a size the session did not keep — the point it stands at
    const size = sch.sizes?.[p.definitionId];
    const k = p.scale ?? 1;
    const outline = size && size.w > 0 && size.h > 0
      ? (() => {
        const hw = mm((size.w * k) / 2), hh = mm((size.h * k) / 2);
        const c = [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]].map(([x, y]) => b.add('IFCCARTESIANPOINT', [[R(x), R(y)]]));
        return b.add('IFCSHAPEREPRESENTATION', [graphCtx(), 'Annotation', 'Curve2D', [b.add('IFCPOLYLINE', [[...c, c[0]]])]]);
      })()
      : b.add('IFCSHAPEREPRESENTATION', [graphCtx(), 'Annotation', 'Point', [b.once('IFCCARTESIANPOINT', [[R(0), R(0)]])]]);
    const rep = b.add('IFCPRODUCTDEFINITIONSHAPE', [null, null, [outline]]);
    const sym = b.add('IFCANNOTATION', [sg, oh, p.refdes ?? p.definitionId, 'Its symbol on the schematic: where the block is drawn, not where the thing is', null, placementAt(mm(p.at.x), mm(p.at.y), p.rotation ?? 0), rep, E('SYMBOL')]);
    held.push(sym);
    b.add('IFCRELASSIGNSTOPRODUCT', [ifcGuid(sg, 'assigned'), oh, 'Schematic symbol', null, [sym], null, o.ref]);
    pset(sg, 'APK_SheetSeat', [['Sheet', label('Schematic')]], [sym]);
  }

  // ---- the occurrences' own terminals (the IfcRelNests exportIfc wrote), by CAD port id
  const own = new Map<number, StepRef[]>();
  for (const e of b.entities) {
    if (e.type !== 'IFCRELNESTS' || !isRef(e.args[4]) || !Array.isArray(e.args[5])) continue;
    (own.get(e.args[4].id) ?? own.set(e.args[4].id, []).get(e.args[4].id)!).push(...e.args[5].filter(isRef));
  }
  const dirOf = (port: StepRef) => {
    const v = b.entity(port).args[7];
    return v && typeof v === 'object' && 'kind' in v && v.kind === 'enum' ? v.value : 'NOTDEFINED';
  };
  const asRelating = new Set<number>(), asRelated = new Set<number>();
  const made = new Map<number, StepRef[]>();
  const tagged = new Set<number>();
  const candidate = (placementId: number, pid: string): StepRef | undefined => {
    const o = occ.get(placementId);
    return o ? (own.get(o.ref.id) ?? []).find((p) => cadPortId(String(b.entity(p).args[2] ?? '')) === pid) : undefined;
  };
  /** A port of `placementId` named `pid` that is still free in this role (made when none is). */
  const portFor = (placementId: number, pid: string, relating: boolean, not?: StepRef): StepRef => {
    const o = occ.get(placementId)!;
    const used = relating ? asRelating : asRelated;
    const mine = [...(own.get(o.ref.id) ?? []).filter((p) => cadPortId(String(b.entity(p).args[2] ?? '')) === pid), ...(made.get(o.ref.id) ?? []).filter((p) => b.entity(p).args[2] === pid)];
    let port = mine.find((p) => !used.has(p.id) && p.id !== not?.id);
    if (port && (made.get(o.ref.id) ?? []).includes(port)) {
      const d = dirOf(port);
      if (d !== (relating ? 'SOURCE' : 'SINK')) b.entity(port).args[7] = E('SOURCEANDSINK');
    }
    if (!port) {
      const list = made.get(o.ref.id) ?? made.set(o.ref.id, []).get(o.ref.id)!;
      const n = mine.length + 1;
      port = b.add('IFCDISTRIBUTIONPORT', [ifcGuid(o.gid, 'port', pid, String(n)), oh, pid, null, null, null, null, E(relating ? 'SOURCE' : 'SINK'), E('NOTDEFINED'), null]);
      list.push(port);
    }
    used.add(port.id);
    if (!tagged.has(port.id)) {
      tagged.add(port.id);
      pset(String(b.entity(port).args[0]), 'APK_SchematicPort', [['PortId', ident(pid)]], [port]);
    }
    return port;
  };

  // ---- connectors: IfcRelConnectsPorts, and the drawn route as a WIRE annotation
  const byId = new Map(sch.placements.map((p) => [p.id, p]));
  const ckey = uniqueKeys(sch.connectors, (c) => connectorKey(c, byId));
  const typedCables = new Map<number, StepRef[]>();
  const systems = new Map<string, StepRef[]>();
  const inSystem = (port: StepRef, ...members: StepRef[]) => {
    const st = b.entity(port).args[9];
    if (!st || typeof st !== 'object' || !('kind' in st) || st.kind !== 'enum') return;
    const list = systems.get(st.value) ?? systems.set(st.value, []).get(st.value)!;
    for (const m of members) if (!list.includes(m)) list.push(m);
  };
  /** The cable a wire is: an IfcCableSegment, the connection's RealizingElement. */
  const writeCable = (connection: string, cable: ConnectorCable, name?: string): StepRef => {
    const cg = ifcGuid(connection, 'cable');
    const typed = cable.part ? t.types?.get(cable.part) : undefined;
    const type = typed && typed.entity === CABLE_TYPE ? typed.type : undefined;
    const seg = b.add('IFCCABLESEGMENT', [cg, oh, cable.tag ?? name ?? null, null, null, b.add('IFCLOCALPLACEMENT', [t.storeyPl, b.add('IFCAXIS2PLACEMENT3D', [b.once('IFCCARTESIANPOINT', [[R(0), R(0), R(0)]]), null, null])]), null, cable.tag ?? null, type ? null : E('CABLESEGMENT')]);
    held.push(seg);
    if (type) (typedCables.get(type.id) ?? typedCables.set(type.id, []).get(type.id)!).push(seg);
    pset(cg, 'APK_Connection', [
      ['Medium', label('wired')], ['CablePart', opt(cable.part, ident)], ['CableStatus', opt(cable.status, label)], ['CableColour', opt(cable.colour, label)],
    ], [seg]);
    t.qto?.(cg, 'Qto_CableSegmentBaseQuantities', [['Length', 'L', cable.length_mm]], [seg]);
    return seg;
  };
  for (const c of sch.connectors) {
    const a = occ.get(c.from.placementId), z = occ.get(c.to.placementId);
    const key = ckey.get(c.id)!;
    const wg = role('wire', key);
    let connection: string | undefined;
    let reversed = false;
    if (a && z) {
      const ca = candidate(c.from.placementId, c.from.portId), cz = candidate(c.to.placementId, c.to.portId);
      reversed = !!ca && !!cz && dirOf(ca) === 'SINK' && dirOf(cz) === 'SOURCE';
      const [src, snk] = reversed ? [c.to, c.from] : [c.from, c.to];
      const relating = portFor(src.placementId, src.portId, true);
      const related = portFor(snk.placementId, snk.portId, false, relating);
      connection = role('connector', key);
      const cable = c.cable ? writeCable(connection, c.cable, c.label) : null;
      b.add('IFCRELCONNECTSPORTS', [connection, oh, c.label ?? null, null, relating, related, cable]);
      inSystem(relating, a.ref, z.ref);
      inSystem(related, a.ref, z.ref);
    }
    const route = c.route;
    const pts: Point[] | null = route && route.length ? (route.length === 1 ? [route[0]!, route[0]!] : route) : null;
    const rep = pts
      ? b.add('IFCPRODUCTDEFINITIONSHAPE', [null, null, [b.add('IFCSHAPEREPRESENTATION', [graphCtx(), 'Annotation', 'Curve2D', [
          b.add('IFCPOLYLINE', [pts.map((p) => b.add('IFCCARTESIANPOINT', [[R(mm(p.x)), R(mm(p.y))]]))]),
        ]])]])
      : null;
    const wire = b.add('IFCANNOTATION', [wg, oh, c.label ?? null, null, 'WIRE', b.add('IFCLOCALPLACEMENT', [t.storeyPl, b.add('IFCAXIS2PLACEMENT3D', [b.add('IFCCARTESIANPOINT', [[R(0), R(0), R(0)]]), null, null])]), rep, E('USERDEFINED')]);
    held.push(wire);
    pset(wg, 'APK_SchematicWire', [
      ['ConnectorId', int(c.id)], ['Connection', opt(connection, ident)], ['Label', opt(c.label, label)], ['Layer', ident(c.layerId)],
      ['Reversed', reversed ? bool(true) : undefined], ['RoutePoints', route ? int(route.length) : undefined], ['HostKey', opt(c.hostKey, ident)],
      ['Fly', c.fly ? bool(true) : undefined],   // drawn as a fly-off / fly-on pair (flow/fly.ts)
      ['Net', opt(c.net, label)],   // the net it is on (flow/wires.ts): every pin joined by wires, the oldest wire's name
      // an end whose placement is not on the sheet has no port to join: said here instead
      ['FromPlacement', connection ? undefined : int(c.from.placementId)], ['FromPort', connection ? undefined : ident(c.from.portId)],
      ['ToPlacement', connection ? undefined : int(c.to.placementId)], ['ToPort', connection ? undefined : ident(c.to.portId)],
      ['Cable', !connection && c.cable ? text(json(c.cable)) : undefined],
    ], [wire]);
  }
  for (const [typeId, cables] of typedCables) {
    const typeRef: StepRef = { kind: 'ref', id: typeId };
    // a type is typed-by once (IfcTypeObject.Types SET [0:1]): join exportIfc's relationship when it wrote one
    const rel = b.entities.find((e) => e.type === 'IFCRELDEFINESBYTYPE' && isRef(e.args[5]) && e.args[5].id === typeRef.id);
    if (rel) (rel.args[4] as StepValue[]).push(...cables);
    else b.add('IFCRELDEFINESBYTYPE', [ifcGuid(String(b.entity(typeRef).args[0]), 'cables', doc), oh, null, null, cables, typeRef]);
  }
  for (const [ref, ports] of made) {
    b.add('IFCRELNESTS', [ifcGuid(String(b.entity({ kind: 'ref', id: ref }).args[0]), 'nests', 'schematic'), oh, 'Schematic ports', null, { kind: 'ref', id: ref }, ports]);
  }
  for (const [st, members] of [...systems].sort(([x], [y]) => (x < y ? -1 : x > y ? 1 : 0))) {
    const sys = b.add('IFCDISTRIBUTIONSYSTEM', [role('system', st), oh, st.toLowerCase(), 'The occurrences the schematic joins by their ports of this system', null, null, E(st)]);
    b.add('IFCRELASSIGNSTOGROUP', [role('rel', 'system', st), oh, null, null, members, null, sys]);
  }

  // ---- groups: assemblies (rack, kit) and logical groups, nested as the tree they are
  const groups = sch.groups ?? [];
  const gkey = uniqueKeys(groups, groupKey);
  const gref = new Map<number, StepRef>();
  for (const g of groups) {
    const gg = role('group', gkey.get(g.id)!);
    const e = isAssembly(g)
      ? b.add('IFCELEMENTASSEMBLY', [gg, oh, g.name, null, g.source!.kind.toUpperCase(), null, null, null, E('SITE'), E('USERDEFINED')])
      : b.add('IFCGROUP', [gg, oh, g.name, null, g.source?.kind ?? null]);
    gref.set(g.id, e);
    if (isAssembly(g)) held.push(e);
    pset(gg, 'APK_SchematicGroup', [
      ['GroupId', int(g.id)], ['Layer', ident(g.layerId)], ['SourceKind', opt(g.source?.kind, label)], ['SourceId', opt(g.source?.id, ident)],
      ['HostKey', opt(g.hostKey, ident)],
    ], [e]);
    pset(gg, 'APK_SchematicLayout', [['Pad', opt(g.pad, realv)], ['Collapsed', opt(g.collapsed, bool)], ['LabelWidth', opt(g.labelWidth, realv)]], [e]);
  }
  for (const g of groups) {
    const held2 = [...g.members.map((m) => occ.get(m)?.ref), ...g.children.map((c) => gref.get(c))].filter((r): r is StepRef => !!r);
    if (!held2.length) continue;
    if (isAssembly(g)) b.add('IFCRELAGGREGATES', [role('rel', 'assembly', gkey.get(g.id)!), oh, 'Holds', null, gref.get(g.id)!, held2]);
    else b.add('IFCRELASSIGNSTOGROUP', [role('rel', 'group', gkey.get(g.id)!), oh, 'Holds', null, held2, null, gref.get(g.id)!]);
  }

  t.inStorey.push(...held);
}

// ------------------------------------------------------------------ reading

const num = (v: unknown): number | undefined => (typeof v === 'number' && Number.isFinite(v) ? v : undefined);

function coords(file: StepFile, v: StepValue | undefined): [number, number] | null {
  const p = deref(file, v);
  if (!p || p.type !== 'IFCCARTESIANPOINT' || !Array.isArray(p.args[0])) return null;
  const [x, y] = p.args[0].map((c) => unwrap(c) as number);
  return typeof x === 'number' && typeof y === 'number' ? [x, y] : null;
}

/** The translation (and turn) of a product's placement chain, mm. */
function placed(file: StepFile, product: StepEntity): { x: number; y: number } {
  let x = 0, y = 0;
  let pl = deref(file, product.args[5]);
  for (let guard = 0; pl && pl.type === 'IFCLOCALPLACEMENT' && guard < 32; guard++) {
    const ax = deref(file, pl.args[1]);
    const c = coords(file, ax?.args[0]);
    if (c) { x += c[0]; y += c[1]; }
    pl = deref(file, pl.args[0]);
  }
  return { x, y };
}

/** The cable an IfcCableSegment realizing a connection is (Connector.cable). */
function cableOf(file: StepFile, seg: StepEntity | undefined): ConnectorCable | undefined {
  if (!seg || seg.type !== 'IFCCABLESEGMENT') return undefined;
  const sets = getPsets(file, seg);
  const conn = sets.APK_Connection ?? {};
  const cable: ConnectorCable = {};
  if (conn.CablePart !== undefined) cable.part = String(conn.CablePart);
  if (typeof seg.args[7] === 'string') cable.tag = seg.args[7];
  const len = num(sets.Qto_CableSegmentBaseQuantities?.Length);
  if (len !== undefined) cable.length_mm = len;
  if (conn.CableColour !== undefined) cable.colour = String(conn.CableColour);
  if (conn.CableStatus !== undefined) cable.status = String(conn.CableStatus);
  return cable;
}

/**
 * The schematic back out of a cad-6 file: `bim` is exportIfc's BIM placements
 * as importIfc read them, by id. Connectors and groups in Native (files before
 * cad-6) are taken as they are.
 */
export function readSchematic(file: StepFile, u: (mm: number) => number, native: NativeSchematic, bim: Map<number, BlockPlacement>): SchematicSnapshot {
  const inv = inverseIndex(file);
  const setOf = (e: StepEntity, name: string) => getPsets(file, e)[name];
  const byPlacement = new Map<number, StepEntity>();
  const byGroup = new Map<number, StepEntity>();
  const generic = new Map<number, BlockPlacement>();
  const rels = entitiesByType(file, 'IFCRELDEFINESBYPROPERTIES');
  const holding = (name: string) => {
    const out: StepEntity[] = [];
    for (const rel of rels) {
      if (deref(file, rel.args[5])?.args[2] !== name) continue;
      for (const o of Array.isArray(rel.args[4]) ? rel.args[4] : []) { const e = deref(file, o); if (e) out.push(e); }
    }
    return out.sort((a, b) => a.id - b.id);
  };

  for (const e of holding('APK_Placement')) {
    const p = setOf(e, 'APK_Placement')!;
    const id = num(p.PlacementId);
    if (id === undefined) continue;
    byPlacement.set(id, e);
    if (p.DefinitionId === undefined || bim.has(id)) continue;
    const own = getPsets(file, e);
    const at = placed(file, e);
    const bp: BlockPlacement = { id, definitionId: String(p.DefinitionId), at: { x: u(at.x), y: u(at.y) }, layerId: String(p.Layer) };
    if (p.Rotation !== undefined) bp.rotation = p.Rotation as number;
    if (p.Scale !== undefined) bp.scale = p.Scale as number;
    if (p.Refdes !== undefined) bp.refdes = String(p.Refdes);
    if (p.PortLabels !== undefined) bp.portLabels = JSON.parse(String(p.PortLabels));
    if (p.Portals !== undefined) bp.portals = JSON.parse(String(p.Portals));
    if (p.HostKey !== undefined) bp.hostKey = String(p.HostKey);
    if (p.HostHash !== undefined) bp.hostHash = String(p.HostHash);
    if (p.HostRef !== undefined) bp.hostRef = String(p.HostRef);
    if (p.BimRef !== undefined) bp.bimRef = JSON.parse(String(p.BimRef));
    const serial = own.Pset_ManufacturerOccurrence?.SerialNumber;
    if (serial !== undefined) bp.serial = String(serial);
    const mac = p.Mac ?? own.APK_Identity?.MacAddress;
    if (mac !== undefined) bp.mac = String(mac);
    if (p.Resource !== undefined) bp.resource = String(p.Resource);
    if (p.MountingHeight !== undefined) bp.z_mm = p.MountingHeight as number;
    if (p.MountedOnEdge !== undefined) bp.mountedOn = { edgeId: p.MountedOnEdge as number };
    if (p.MirrorOf !== undefined) bp.mirrorOf = p.MirrorOf as number;
    if (p.Extra !== undefined) Object.assign(bp, JSON.parse(String(p.Extra)));
    generic.set(id, bp);
  }
  const placementIdOf = new Map<number, number>();
  for (const [id, e] of byPlacement) placementIdOf.set(e.id, id);

  /** A port as the CAD names it: the placement nesting it, and its APK_SchematicPort.PortId. */
  const endOf = (port: StepEntity | undefined) => {
    if (!port) return undefined;
    const nest = (inv.get(port.id) ?? []).find((r) => r.type === 'IFCRELNESTS' && Array.isArray(r.args[5]) && r.args[5].some((x) => isRef(x) && x.id === port.id));
    const host = nest && isRef(nest.args[4]) ? placementIdOf.get(nest.args[4].id) : undefined;
    const pid = setOf(port, 'APK_SchematicPort')?.PortId;
    return host !== undefined && pid !== undefined ? { placementId: host, portId: String(pid) } : undefined;
  };
  const connection = new Map<string, StepEntity>();
  for (const r of entitiesByType(file, 'IFCRELCONNECTSPORTS')) if (typeof r.args[0] === 'string') connection.set(r.args[0], r);

  let connectors: Connector[];
  if (Array.isArray(native.connectors)) connectors = native.connectors;
  else {
    connectors = [];
    for (const wire of holding('APK_SchematicWire')) {
      const w = setOf(wire, 'APK_SchematicWire')!;
      let from, to;
      const rel = typeof w.Connection === 'string' ? connection.get(w.Connection) : undefined;
      if (rel) {
        const relating = endOf(deref(file, rel.args[4])), related = endOf(deref(file, rel.args[5]));
        if (!relating || !related) continue;
        [from, to] = w.Reversed === true ? [related, relating] : [relating, related];
      } else {
        from = { placementId: w.FromPlacement as number, portId: String(w.FromPort) };
        to = { placementId: w.ToPlacement as number, portId: String(w.ToPort) };
      }
      const c: Connector = { id: w.ConnectorId as number, from, to, layerId: String(w.Layer) };
      const n = num(w.RoutePoints);
      if (n !== undefined) {
        const shape = deref(file, wire.args[6]);
        const reps = Array.isArray(shape?.args[2]) ? shape!.args[2] : [];
        const poly = reps.map((r) => deref(file, r)).flatMap((r) => (Array.isArray(r?.args[3]) ? r!.args[3] : [])).map((x) => deref(file, x)).find((x) => x?.type === 'IFCPOLYLINE');
        const pts = Array.isArray(poly?.args[0]) ? poly!.args[0].map((p) => coords(file, p)).filter((p): p is [number, number] => !!p) : [];
        c.route = pts.slice(0, n).map(([x, y]) => ({ x: u(x), y: u(y) }));
      }
      if (w.Label !== undefined) c.label = String(w.Label);
      if (w.HostKey !== undefined) c.hostKey = String(w.HostKey);
      if (w.Fly === true || w.Fly === '.T.' || String(w.Fly) === 'true') c.fly = true;
      if (w.Net !== undefined) c.net = String(w.Net);
      const cable = rel ? cableOf(file, deref(file, rel.args[6])) : w.Cable !== undefined ? JSON.parse(String(w.Cable)) as ConnectorCable : undefined;
      if (cable) c.cable = cable;
      connectors.push(c);
    }
  }

  let groups: Group[] | undefined;
  if (Array.isArray(native.groups)) groups = native.groups;
  else if (native.hasGroups) {
    groups = [];
    const owners = new Map<number, Group>();
    for (const e of holding('APK_SchematicGroup')) {
      const s = setOf(e, 'APK_SchematicGroup')!;
      const lay = setOf(e, 'APK_SchematicLayout') ?? {};
      const g: Group = { id: s.GroupId as number, name: String(e.args[2] ?? ''), children: [], members: [], layerId: String(s.Layer) };
      if (s.SourceKind !== undefined || s.SourceId !== undefined) g.source = { kind: String(s.SourceKind ?? ''), id: String(s.SourceId ?? '') };
      if (s.HostKey !== undefined) g.hostKey = String(s.HostKey);
      if (lay.Pad !== undefined) g.pad = lay.Pad as number;
      if (lay.Collapsed !== undefined) g.collapsed = lay.Collapsed as boolean;
      if (lay.LabelWidth !== undefined) g.labelWidth = lay.LabelWidth as number;
      byGroup.set(g.id, e);
      owners.set(e.id, g);
      groups.push(g);
    }
    const fill = (g: Group, list: StepValue) => {
      for (const x of Array.isArray(list) ? list : []) {
        if (!isRef(x)) continue;
        const child = owners.get(x.id);
        if (child) g.children.push(child.id);
        else if (placementIdOf.has(x.id)) g.members.push(placementIdOf.get(x.id)!);
      }
    };
    for (const r of entitiesByType(file, 'IFCRELAGGREGATES')) { const g = isRef(r.args[4]) ? owners.get(r.args[4].id) : undefined; if (g) fill(g, r.args[5]); }
    for (const r of entitiesByType(file, 'IFCRELASSIGNSTOGROUP')) { const g = isRef(r.args[6]) ? owners.get(r.args[6].id) : undefined; if (g) fill(g, r.args[4]); }
  }

  return {
    placements: native.placements.map((p) => ('ifc' in p ? bim.get(p.ifc) ?? generic.get(p.ifc) : p)).filter((p): p is BlockPlacement => !!p),
    connectors,
    ...(groups ? { groups } : {}),
    nextPlacementId: native.nextPlacementId,
    nextConnectorId: native.nextConnectorId,
    ...(native.nextGroupId !== undefined ? { nextGroupId: native.nextGroupId } : {}),
    ...(native.sizes ? { sizes: native.sizes } : {}),
  };
}
