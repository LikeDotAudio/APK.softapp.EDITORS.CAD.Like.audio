// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { BlockPlacement, CadBlockInstance, CadSpace, Edge, FillEntity, Layer, Point, TextEntity, Units, Vertex } from '../../core/types';
import type { VirtualMirror } from '../../core/mirror';
import type { SchematicSnapshot } from '../../flow/Schematic';
import type { DocSnapshot } from '../../model/doc/DocSnapshot';
import { MM_PER_UNIT } from '../../model/units/mmPerUnit';
import type { SavedSession } from '../browserStorage/SavedSession';
import { deref, entitiesByType, getPsets, isRef, parseStep, schemaOf, unwrap, type StepEntity, type StepFile, type StepValue } from '../../vendor/ifc/step';
import { CAD_IFC_SCHEMA } from './exportIfc';
import { partIdOf } from './partTypes';

/**
 * AN .ifc BACK INTO A SESSION (IFC-CORE-DELTAS cad-3)
 *
 * The inverse of exportIfc: a file this editor wrote comes back as the very
 * session it was written from (held by test). Its geometry is read from the
 * IFC — the curves, the placements, the spaces' footprints — and divided back
 * into the session's display unit; only what IFC has no word for is read from
 * APK_CadSession.
 *
 * A file from another tool (no APK_CadSession) still opens: its IfcWall axes
 * come in as wall lines on a 'Walls' layer, IfcAnnotation curves as linework,
 * IfcSpace footprints as declared rooms, in mm. Corners that land on each
 * other are one vertex, so the walls are joined.
 */

export class IfcImportError extends Error {
  readonly code = 'bad_input';
}

type Pt = [number, number];
type Native = {
  vertexOrder: number[];
  orphans: Vertex[];
  groupPrimitives: DocSnapshot['groupPrimitives'];
  groupIntact: number[];
  blocks?: DocSnapshot['blocks'];
  present: string[];
  schematic?: Omit<SchematicSnapshot, 'placements'> & { placements: (BlockPlacement | { ifc: number })[] };
  session: Record<string, boolean>;
  version: number;
};

const num = (v: unknown): number | undefined => (typeof v === 'number' && Number.isFinite(v) ? v : undefined);
const str = (v: unknown): string | undefined => (typeof v === 'string' ? v : undefined);

function coords(file: StepFile, v: StepValue | undefined): Pt | null {
  const p = deref(file, v);
  if (!p || p.type !== 'IFCCARTESIANPOINT' || !Array.isArray(p.args[0])) return null;
  const [x, y] = p.args[0].map((c) => unwrap(c) as number);
  return typeof x === 'number' && typeof y === 'number' ? [x, y] : null;
}

/** Shape representation items of a product, by RepresentationIdentifier. */
function items(file: StepFile, product: StepEntity, id?: string): StepEntity[] {
  const shape = deref(file, product.args[6]);
  if (!shape || !Array.isArray(shape.args[2])) return [];
  const out: StepEntity[] = [];
  for (const r of shape.args[2]) {
    const rep = deref(file, r);
    if (!rep || (id && rep.args[1] !== id) || !Array.isArray(rep.args[3])) continue;
    for (const it of rep.args[3]) {
      const e = deref(file, it);
      if (e) out.push(e);
    }
  }
  return out;
}

/** A curve as its end points (and its circle, for an arc). */
function curveOf(file: StepFile, e: StepEntity): { a: Pt; b: Pt; arc?: { cx: number; cy: number; r: number; sense: boolean } } | null {
  if (e.type === 'IFCPOLYLINE' && Array.isArray(e.args[0]) && e.args[0].length >= 2) {
    const pts = e.args[0];
    const a = coords(file, pts[0]), b = coords(file, pts[pts.length - 1]);
    return a && b ? { a, b } : null;
  }
  if (e.type === 'IFCTRIMMEDCURVE') {
    const circle = deref(file, e.args[0]);
    const t1 = Array.isArray(e.args[1]) ? e.args[1].find(isRef) : undefined;
    const t2 = Array.isArray(e.args[2]) ? e.args[2].find(isRef) : undefined;
    const a = coords(file, t1), b = coords(file, t2);
    if (!circle || circle.type !== 'IFCCIRCLE' || !a || !b) return null;
    const c = coords(file, deref(file, circle.args[0])?.args[0]);
    const r = unwrap(circle.args[1]);
    if (!c || typeof r !== 'number') return null;
    const sense = unwrap(e.args[3]) !== false;
    return { a, b, arc: { cx: c[0], cy: c[1], r, sense } };
  }
  return null;
}

function placementOf(file: StepFile, product: StepEntity): { x: number; y: number; z: number } {
  // sum of the chain: every placement this editor writes is a translation (with a turn on the leaf)
  let x = 0, y = 0, z = 0;
  let pl = deref(file, product.args[5]);
  for (let guard = 0; pl && pl.type === 'IFCLOCALPLACEMENT' && guard < 32; guard++) {
    const ax = deref(file, pl.args[1]);
    const p = ax ? deref(file, ax.args[0]) : undefined;
    if (p && Array.isArray(p.args[0])) {
      const c = p.args[0].map((v) => unwrap(v) as number);
      x += c[0] ?? 0; y += c[1] ?? 0; z += c[2] ?? 0;
    }
    pl = deref(file, pl.args[0]);
  }
  return { x, y, z };
}

/** Own property sets only (not the type's), as plain values. */
function ownPsets(file: StepFile, e: StepEntity): Record<string, Record<string, unknown>> {
  const out: Record<string, Record<string, unknown>> = {};
  for (const [name, props] of Object.entries(getPsets(file, e))) out[name] = props;
  return out;
}

export function importIfc(textIn: string): SavedSession {
  let file: StepFile;
  try {
    file = parseStep(textIn);
  } catch (err) {
    throw new IfcImportError(`not an IFC file: ${(err as Error).message}`);
  }
  const schema = schemaOf(file) ?? '';
  if (!/^IFC/i.test(schema)) throw new IfcImportError(`not an IFC file (FILE_SCHEMA ${schema || 'missing'})`);
  const project = entitiesByType(file, 'IFCPROJECT')[0];
  if (!project) throw new IfcImportError('the file has no IfcProject');
  const cad = getPsets(file, project).APK_CadSession;
  if (!cad || cad.Schema !== CAD_IFC_SCHEMA) return foreign(file, project);

  const native = JSON.parse(String(cad.Native)) as Native;
  const units = (str(cad.Units) ?? 'mm') as Units;
  const f = MM_PER_UNIT[units] ?? 1;
  const u = (v: number) => v / f;
  const layers = JSON.parse(String(cad.Layers ?? '[]')) as Layer[];

  // products in file order, by the APK set each carries
  const withSet = (name: string) => {
    const out: { e: StepEntity; p: Record<string, unknown> }[] = [];
    for (const rel of entitiesByType(file, 'IFCRELDEFINESBYPROPERTIES')) {
      const set = deref(file, rel.args[5]);
      if (set?.args[2] !== name) continue;
      for (const o of Array.isArray(rel.args[4]) ? rel.args[4] : []) {
        const e = deref(file, o);
        if (e) out.push({ e, p: ownPsets(file, e)[name]! });
      }
    }
    return out.sort((a, b) => a.e.id - b.e.id);
  };

  // ---- edges, re-welded by vertex id
  const pos = new Map<number, Point>();
  const edges: Edge[] = [];
  for (const { e, p } of withSet('APK_CadEdge')) {
    const curve = items(file, e, e.type === 'IFCWALL' ? 'Axis' : undefined).map((it) => curveOf(file, it)).find(Boolean);
    if (!curve) continue;
    const id = p.EdgeId as number, v1 = p.V1 as number, v2 = p.V2 as number;
    pos.set(v1, { x: u(curve.a[0]), y: u(curve.a[1]) });
    pos.set(v2, { x: u(curve.b[0]), y: u(curve.b[1]) });
    const base = { id, v1, v2, groupId: p.GroupId as number, layerId: String(p.Layer), ...(p.Protected !== undefined ? { protected: p.Protected as boolean } : {}) };
    edges.push(curve.arc
      ? { ...base, type: 'arc', cx: u(curve.arc.cx), cy: u(curve.arc.cy), r: u(curve.arc.r) }
      : { ...base, type: 'line' });
  }
  for (const o of native.orphans) pos.set(o.id, { x: o.x, y: o.y });
  const vertices: Vertex[] = native.vertexOrder.filter((id) => pos.has(id)).map((id) => ({ id, ...pos.get(id)! }));

  // ---- texts and fills
  const texts: TextEntity[] = [];
  for (const { e, p } of withSet('APK_CadText')) {
    const lit = items(file, e).find((it) => it.type === 'IFCTEXTLITERALWITHEXTENT');
    if (!lit) continue;
    const at = coords(file, deref(file, lit.args[1])?.args[0]) ?? [0, 0];
    const t: TextEntity = { id: p.TextId as number, text: String(lit.args[0] ?? ''), x: u(at[0]), y: u(at[1]), height: u(p.Height as number), layerId: String(p.Layer) };
    if (p.Rotation !== undefined) t.rotation = p.Rotation as number;
    if (p.Color !== undefined) t.color = String(p.Color);
    if (p.Align !== undefined) t.align = p.Align as TextEntity['align'];
    if (p.VAlign !== undefined) t.vAlign = p.VAlign as TextEntity['vAlign'];
    if (p.Protected !== undefined) t.protected = p.Protected as boolean;
    if (p.HostKey !== undefined) t.hostKey = String(p.HostKey);
    if (p.HostHash !== undefined) t.hostHash = String(p.HostHash);
    texts.push(t);
  }
  const fills: FillEntity[] = [];
  for (const { e, p } of withSet('APK_CadFill')) {
    const area = items(file, e).find((it) => it.type === 'IFCANNOTATIONFILLAREA');
    const ring = deref(file, area?.args[0]);
    if (!ring || !Array.isArray(ring.args[0])) continue;
    const pts = ring.args[0].map((r) => coords(file, r)!).filter(Boolean).slice(0, p.PointCount as number);
    const fl: FillEntity = { id: p.FillId as number, type: p.FillType as FillEntity['type'], points: pts.map(([x, y]) => ({ x: u(x), y: u(y) })), layerId: String(p.Layer) };
    if (p.Color !== undefined) fl.color = String(p.Color);
    if (p.Opacity !== undefined) fl.opacity = p.Opacity as number;
    if (p.HatchPattern !== undefined) fl.hatchPattern = String(p.HatchPattern);
    if (p.PaletteId !== undefined) fl.paletteId = String(p.PaletteId);
    if (p.Protected !== undefined) fl.protected = p.Protected as boolean;
    if (p.HostKey !== undefined) fl.hostKey = String(p.HostKey);
    if (p.HostHash !== undefined) fl.hostHash = String(p.HostHash);
    fills.push(fl);
  }

  // ---- CAD block instances
  const blockInstances: CadBlockInstance[] = [];
  for (const { e, p } of withSet('APK_CadBlock')) {
    const at = placementOf(file, e);
    const bi: CadBlockInstance = {
      id: p.InstanceId as number, uuid: String(p.Uuid), blockName: String(p.BlockName), x: u(at.x), y: u(at.y),
      scale: p.Scale as number, rotation: p.Rotation as number, layerId: String(p.Layer),
      attributes: p.Attributes !== undefined ? JSON.parse(String(p.Attributes)) : {},
    };
    if (p.Protected !== undefined) bi.protected = p.Protected as boolean;
    if (p.MirrorOf !== undefined) bi.mirrorOf = String(p.MirrorOf);
    blockInstances.push(bi);
  }

  // ---- the Virtual Mirror
  const mirrors: VirtualMirror[] = withSet('APK_CadMirror').map(({ p }) => {
    const m: VirtualMirror = { id: String(p.MirrorId), x: u(p.AxisX as number), selected: p.Selected === true };
    if (p.Name !== undefined) m.name = String(p.Name);
    if (p.ReflectedFrom !== undefined) m.reflectedFrom = String(p.ReflectedFrom);
    if (p.GlowColor !== undefined) m.glowColor = String(p.GlowColor);
    return m;
  });

  // ---- declared rooms
  const spaces: CadSpace[] = [];
  for (const { p } of withSet('APK_CadSpace')) {
    if (p.Declared !== true) continue;
    const s: CadSpace = { key: String(p.SpaceKey), layerId: String(p.Layer), points: JSON.parse(String(p.Points ?? '[]')) as Point[] };
    spaces.push(s);
  }
  for (const { p } of withSet('APK_CadSpace')) {
    const s = spaces.find((x) => x.key === p.SpaceKey && p.Declared === true);
    if (!s) continue;
    if (p.Name !== undefined) s.name = String(p.Name);
    if (p.RoomType !== undefined) s.roomType = String(p.RoomType);
    if (p.Height !== undefined) s.height_mm = p.Height as number;
  }

  // ---- placed BIM blocks
  const typeOf = new Map<number, StepEntity>();
  for (const rel of entitiesByType(file, 'IFCRELDEFINESBYTYPE')) {
    const t = deref(file, rel.args[5]);
    if (t) for (const o of Array.isArray(rel.args[4]) ? rel.args[4] : []) if (isRef(o)) typeOf.set(o.id, t);
  }
  const placed = new Map<number, BlockPlacement>();
  for (const { e, p } of withSet('APK_Placement')) {
    const type = typeOf.get(e.id);
    const partId = type ? partIdOf(file, type) : undefined;
    if (!partId) continue;
    const at = placementOf(file, e);
    const own = ownPsets(file, e);
    const bp: BlockPlacement = { id: p.PlacementId as number, definitionId: `bim.${partId}`, at: { x: u(at.x), y: u(at.y) }, layerId: String(p.Layer) };
    if (p.Rotation !== undefined) bp.rotation = p.Rotation as number;
    if (p.Scale !== undefined) bp.scale = p.Scale as number;
    if (p.Refdes !== undefined) bp.refdes = String(p.Refdes);
    if (p.PortLabels !== undefined) bp.portLabels = JSON.parse(String(p.PortLabels));
    if (p.Portals !== undefined) bp.portals = JSON.parse(String(p.Portals));
    if (p.HostKey !== undefined) bp.hostKey = String(p.HostKey);
    if (p.HostHash !== undefined) bp.hostHash = String(p.HostHash);
    if (p.HostRef !== undefined) bp.hostRef = String(p.HostRef);
    const serial = own.Pset_ManufacturerOccurrence?.SerialNumber;
    if (serial !== undefined) bp.serial = String(serial);
    const mac = p.Mac ?? own.APK_Identity?.MacAddress;
    if (mac !== undefined) bp.mac = String(mac);
    if (p.Resource !== undefined) bp.resource = String(p.Resource);
    if (p.MountingHeight !== undefined) bp.z_mm = at.z;
    if (p.MountedOnEdge !== undefined) bp.mountedOn = { edgeId: p.MountedOnEdge as number };
    if (p.MirrorOf !== undefined) bp.mirrorOf = p.MirrorOf as number;
    if (p.BimRef !== undefined) bp.bimRef = JSON.parse(String(p.BimRef));
    placed.set(bp.id, bp);
  }

  const present = new Set(native.present);
  const docSnapshot: DocSnapshot = {
    vertices,
    edges,
    groupPrimitives: native.groupPrimitives,
    groupIntact: native.groupIntact,
    ...(present.has('texts') ? { texts } : {}),
    ...(present.has('fills') ? { fills } : {}),
    ...(present.has('blocks') ? { blocks: native.blocks } : {}),
    ...(present.has('blockInstances') ? { blockInstances } : {}),
    nextVertexId: cad.NextVertexId as number,
    nextEdgeId: cad.NextEdgeId as number,
    nextGroupId: cad.NextGroupId as number,
    ...(present.has('nextTextId') ? { nextTextId: cad.NextTextId as number } : {}),
    ...(present.has('nextFillId') ? { nextFillId: cad.NextFillId as number } : {}),
    ...(present.has('nextBlockInstanceId') ? { nextBlockInstanceId: cad.NextBlockInstanceId as number } : {}),
  };
  const sch = native.schematic;
  const has = native.session;
  const fileName = file.header.find((h) => h.type === 'FILE_NAME')?.args[1];
  const session: SavedSession = {
    version: native.version,
    timestamp: typeof fileName === 'string' ? Date.parse(fileName) : 0,
    docSnapshot,
    units,
    gridSize: cad.GridSize as number,
    snapToGrid: cad.SnapToGrid === true,
    shapeMode: cad.ShapeMode === true,
    activeLayerId: String(cad.ActiveLayer),
    layers,
    tracing: null,
  };
  if (has.currentFileName) session.currentFileName = cad.FileName !== undefined ? String(cad.FileName) : null;
  if (sch) {
    session.schematic = {
      ...sch,
      placements: sch.placements.map((p) => ('ifc' in p ? placed.get(p.ifc) : p)).filter((p): p is BlockPlacement => !!p),
    };
  }
  if (has.gridMode) session.gridMode = cad.GridMode as SavedSession['gridMode'];
  if (has.docKey) session.docKey = String(cad.DocKey);
  if (has.mirror) session.mirror = { enabled: cad.MirrorEnabled === true, x: u(num(cad.MirrorX) ?? 0), selected: cad.MirrorSelected === true, mirrors };
  if (has.spaces) session.spaces = spaces;
  return session;
}

/** A file another tool wrote: its walls, linework and rooms, in mm. */
function foreign(file: StepFile, project: StepEntity): SavedSession {
  const vertices: Vertex[] = [];
  const at = new Map<string, number>();
  const vertex = (p: Pt): number => {
    const key = `${p[0]},${p[1]}`;
    let id = at.get(key);
    if (id === undefined) {
      id = vertices.length + 1;
      vertices.push({ id, x: p[0], y: p[1] });
      at.set(key, id);
    }
    return id;
  };
  const edges: Edge[] = [];
  const layers: Layer[] = [{ id: '0', name: '0', color: '#e5e7eb', visible: true }];
  const take = (type: string, layerId: string, rep?: string) => {
    for (const e of entitiesByType(file, type)) {
      for (const it of items(file, e, rep)) {
        const c = curveOf(file, it);
        if (!c) continue;
        const base = { id: edges.length + 1, v1: vertex(c.a), v2: vertex(c.b), groupId: 0, layerId };
        edges.push(c.arc ? { ...base, type: 'arc', cx: c.arc.cx, cy: c.arc.cy, r: c.arc.r } : { ...base, type: 'line' });
      }
    }
  };
  if (entitiesByType(file, 'IFCWALL').length + entitiesByType(file, 'IFCWALLSTANDARDCASE').length) {
    layers.push({ id: 'Walls', name: 'Walls', color: '#94a3b8', visible: true, ifc: { entity: 'IfcWall' } });
    take('IFCWALL', 'Walls', 'Axis');
    take('IFCWALLSTANDARDCASE', 'Walls', 'Axis');
  }
  take('IFCANNOTATION', '0');
  const spaces: CadSpace[] = [];
  for (const s of entitiesByType(file, 'IFCSPACE')) {
    const ring = items(file, s, 'FootPrint').find((it) => it.type === 'IFCPOLYLINE');
    if (!ring || !Array.isArray(ring.args[0])) continue;
    const pts = ring.args[0].map((r) => coords(file, r)).filter((p): p is Pt => !!p);
    if (pts.length > 1 && pts[0]![0] === pts[pts.length - 1]![0] && pts[0]![1] === pts[pts.length - 1]![1]) pts.pop();
    const g = typeof s.args[0] === 'string' ? s.args[0] : `space-${s.id}`;
    spaces.push({ key: g, ...(typeof s.args[2] === 'string' ? { name: s.args[2] } : {}), layerId: '0', points: pts.map(([x, y]) => ({ x, y })) });
  }
  return {
    version: 1,
    timestamp: 0,
    docSnapshot: { vertices, edges, groupPrimitives: [], groupIntact: [], texts: [], fills: [], blocks: [], blockInstances: [], nextVertexId: vertices.length + 1, nextEdgeId: edges.length + 1, nextGroupId: 1 },
    currentFileName: typeof project.args[2] === 'string' ? project.args[2] : null,
    units: 'mm',
    gridSize: 10,
    snapToGrid: true,
    shapeMode: false,
    activeLayerId: '0',
    layers,
    tracing: null,
    spaces,
  };
}
