// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { BlockPlacement, CadBlockInstance, Layer, Point } from '../../core/types';
import { MM_PER_UNIT } from '../../model/units/mmPerUnit';
import type { SavedSession } from '../browserStorage/SavedSession';
import { typed, type StepRef, type StepValue } from '../../vendor/ifc/step';
import { ifcGuid } from '../../vendor/ifc/guid';
import { StepBuilder, E, R, bool, gid, ident, int, label, length, positiveLength, realv, text, type PropValue } from './stepBuilder';
import { wallFaces } from './wallFaces';
import { mergePartType, occurrenceEntity, occurrenceTail, type MergedType } from './partTypes';
import { schematicNative, writeSchematic } from './schematicIfc';

/**
 * THE DRAWING AS IFC4X3_ADD2 (IFC-CORE-DELTAS cad-3, cad-4, cad-5, cad-10)
 *
 * A SavedSession goes out as one ISO 10303-21 file a strict reader accepts,
 * and comes back from it (importIfc.ts) as the same session — the .ifc is a
 * lossless twin of the native one, written beside it on every save.
 *
 *   IfcProject ─ IfcSite ─ IfcBuilding ─ IfcBuildingStorey 'Level 0' ─ IfcSpace per room
 *
 * - Every coordinate is in mm (one IfcSIUnit MILLI METRE); a session in inches
 *   is multiplied out on the way, and its display unit kept in APK_CadSession.
 * - Linework is IfcAnnotation (Curve2D: IfcPolyline, an arc an IfcTrimmedCurve
 *   on an IfcCircle), each edge one annotation carrying APK_CadEdge {EdgeId,
 *   GroupId, V1, V2}, so the welded vertex graph re-welds on the way back in.
 * - An edge on a layer classified `ifc.entity = 'IfcWall'` is an IfcWall with an
 *   Axis (and a SweptSolid Body when thickness and height are known), contained
 *   in the storey. Every room the walls enclose (wallFaces.ts) is an IfcSpace
 *   bounded by those walls (IfcRelSpaceBoundary); so are the rooms the user declared (session.spaces).
 * - A placed BIM block is an occurrence of its part's own type — the library's
 *   type object copied in with its GlobalId (partTypes.ts) — at an
 *   IfcLocalPlacement in mm, contained in the space it stands in, its ports
 *   its own, a wall it hangs on an IfcRelConnectsElements wall→device.
 * - A Virtual Mirror is an IfcAnnotation 'MIRROR_AXIS'; a reflected copy is a
 *   second placement and an APK_Symmetry on each partner — never a negative
 *   scale, which IFC forbids (IfcCartesianTransformationOperator.ScaleGreaterZero).
 * - The Flow schematic (schematicIfc.ts, cad-6): every placement an occurrence,
 *   each connector an IfcRelConnectsPorts between their ports, each group an
 *   IfcGroup or (a rack, a kit) an IfcElementAssembly.
 * - What IFC has no word for — block symbols, layers' DXF styling, counters —
 *   rides in APK_CadSession as the session's own JSON, so nothing is lost.
 *
 * GlobalIds are uuid5 of a role (contracts guid.ts): cad/<docKey>/edge/<id>,
 * cad/<docKey>/space/<key>, inst/serial:<maker>/<serial> for a placed box with
 * a serial … — the same drawing always writes the same bytes, and a wall keeps
 * its id from one session to the next.
 */

export const CAD_IFC_SCHEMA = 'cad.like.audio/session-ifc@1';

export interface ExportIfcOptions {
  /** Part type files by part id (GET /api/bim/parts/<id>.ifc). A part not here gets a stub type. */
  types?: Record<string, string>;
  /** FILE_NAME name; defaults to the session's file name. */
  fileName?: string;
}

/** Edge ids of a session's walls: every edge on an IfcWall layer. */
export function wallLayerIds(layers: readonly Layer[]): Set<string> {
  return new Set(layers.filter((l) => l.ifc?.entity === 'IfcWall').map((l) => l.id));
}

const BOX: Record<string, string> = {
  'top:left': 'top-left', 'top:center': 'top-middle', 'top:right': 'top-right',
  'middle:left': 'middle-left', 'middle:center': 'center', 'middle:right': 'middle-right',
  'bottom:left': 'bottom-left', 'bottom:center': 'bottom-middle', 'bottom:right': 'bottom-right',
  'baseline:left': 'bottom-left', 'baseline:center': 'bottom-middle', 'baseline:right': 'bottom-right',
};

const WALL_TYPES = new Set(['ELEMENTEDWALL', 'MOVABLE', 'PARAPET', 'PARTITIONING', 'PLUMBINGWALL', 'POLYGONAL', 'RETAININGWALL', 'SHEAR', 'SOLIDWALL', 'STANDARD', 'WAVEWALL']);

const IPV4 = /\b\d{1,3}(?:\.\d{1,3}){3}\b/;
const json = (v: unknown) => JSON.stringify(v);

/** The ISO timestamp of a session, as FILE_NAME carries it. */
export const stampOf = (t: number | undefined) => new Date(Number.isFinite(t) ? (t as number) : 0).toISOString();

function hexRgb(hex: string | undefined): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex ?? '');
  if (!m) return null;
  const n = parseInt(m[1]!, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

/** Is `p` on the boundary of the closed polygon `poly` (within tol)? */
function onBoundary(p: Point, poly: Point[], tol: number): boolean {
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i]!, b = poly[(i + 1) % poly.length]!;
    const dx = b.x - a.x, dy = b.y - a.y;
    const l2 = dx * dx + dy * dy;
    const t = l2 ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2)) : 0;
    if (Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy)) <= tol) return true;
  }
  return false;
}

function inside(p: Point, poly: Point[]): boolean {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i]!, b = poly[j]!;
    if ((a.y > p.y) !== (b.y > p.y) && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) c = !c;
  }
  return c;
}

/** The part id of a BIM block placement, or null for a catalogue / connector block. */
export const bimPartOf = (p: Pick<BlockPlacement, 'definitionId'>): string | null =>
  p.definitionId.startsWith('bim.') && p.definitionId.length > 4 ? p.definitionId.slice(4) : null;

export function exportIfc(session: SavedSession, opts: ExportIfcOptions = {}): string {
  const f = MM_PER_UNIT[session.units] ?? 1;
  const mm = (v: number) => v * f;
  const doc = session.docKey || 'session';
  const role = (...r: (string | number)[]) => gid('cad', doc, ...r);
  const snap = session.docSnapshot;
  const layers = session.layers ?? [];
  const layerById = new Map(layers.map((l) => [l.id, l]));
  const walls = wallLayerIds(layers);
  const b = new StepBuilder();

  // ------------------------------------------------------------ owner, units, contexts
  const person = b.add('IFCPERSON', [null, 'APK.audio', null, null, null, null, null, null]);
  const org = b.add('IFCORGANIZATION', [null, 'APK.audio', 'CAD.Like.audio', null, null]);
  const po = b.add('IFCPERSONANDORGANIZATION', [person, org, null]);
  const app = b.add('IFCAPPLICATION', [org, '1', 'CAD.Like.audio', 'CAD.Like.audio']);
  const oh = b.add('IFCOWNERHISTORY', [po, app, null, null, null, null, null, 0]);
  const si = (kind: string, prefix: string | null, name: string) => b.once('IFCSIUNIT', [{ kind: 'derived' }, E(kind), prefix ? E(prefix) : null, E(name)]);
  const units = b.add('IFCUNITASSIGNMENT', [[
    si('LENGTHUNIT', 'MILLI', 'METRE'), si('MASSUNIT', 'KILO', 'GRAM'), si('POWERUNIT', null, 'WATT'),
    si('ELECTRICVOLTAGEUNIT', null, 'VOLT'), si('ELECTRICCURRENTUNIT', null, 'AMPERE'), si('FREQUENCYUNIT', null, 'HERTZ'),
    si('ELECTRICRESISTANCEUNIT', null, 'OHM'),
  ]]);
  const p3 = (x: number, y: number, z: number) => b.add('IFCCARTESIANPOINT', [[R(x), R(y), R(z)]]);
  const p2 = (x: number, y: number) => b.add('IFCCARTESIANPOINT', [[R(x), R(y)]]);
  const origin3 = p3(0, 0, 0);
  const world = b.add('IFCAXIS2PLACEMENT3D', [origin3, null, null]);
  const model = b.add('IFCGEOMETRICREPRESENTATIONCONTEXT', [null, 'Model', 3, R(1e-5), world, null]);
  const sub = (id: string, parent: StepRef, view: string) => b.add('IFCGEOMETRICREPRESENTATIONSUBCONTEXT', [id, parent === model ? 'Model' : 'Plan', { kind: 'derived' }, { kind: 'derived' }, { kind: 'derived' }, { kind: 'derived' }, parent, null, E(view), null]);
  const body = sub('Body', model, 'MODEL_VIEW');
  const axisCtx = sub('Axis', model, 'GRAPH_VIEW');
  const footprint = sub('FootPrint', model, 'PLAN_VIEW');
  const world2 = b.add('IFCAXIS2PLACEMENT2D', [p2(0, 0), null]);
  const plan = b.add('IFCGEOMETRICREPRESENTATIONCONTEXT', [null, 'Plan', 2, R(1e-5), world2, null]);
  const annotationCtx = sub('Annotation', plan, 'PLAN_VIEW');

  // ------------------------------------------------------------ property sets
  const rels: { set: StepRef; objects: StepRef[] }[] = [];
  /** One property set on `objects`; the properties left undefined are not written. A set with none is not written. */
  const pset = (owner: string, name: string, props: [string, PropValue][], objects: StepRef[]) => {
    const values = props.filter(([, v]) => v !== undefined && v !== null) as [string, StepValue][];
    if (!values.length || !objects.length) return;
    const items = values.map(([k, v]) => (Array.isArray(v)
      ? b.add('IFCPROPERTYLISTVALUE', [k, null, v, null])
      : b.add('IFCPROPERTYSINGLEVALUE', [k, null, v, null])));
    const set = b.add('IFCPROPERTYSET', [ifcGuid(owner, 'pset', name), oh, name, null, items]);
    rels.push({ set, objects });
  };
  const opt = <T,>(v: T | undefined | null, w: (x: T) => StepValue): PropValue => (v === undefined || v === null ? undefined : w(v));

  // ------------------------------------------------------------ project and spatial spine
  const project = b.add('IFCPROJECT', [role('project'), oh, session.currentFileName ?? 'CAD.Like.audio drawing', 'A CAD.Like.audio drawing (cad.like.audio/session as IFC)', null, null, null, [model, plan], units]);
  const local = (relTo: StepRef | null, at: StepRef = world) => b.add('IFCLOCALPLACEMENT', [relTo, at]);
  const sitePl = local(null);
  const site = b.add('IFCSITE', [role('site'), oh, 'Site', null, null, sitePl, null, null, E('ELEMENT'), null, null, null, null, null]);
  const buildingPl = local(sitePl);
  const building = b.add('IFCBUILDING', [role('building'), oh, 'Building', null, null, buildingPl, null, null, E('ELEMENT'), null, null, null]);
  const storeyPl = local(buildingPl);
  const storey = b.add('IFCBUILDINGSTOREY', [role('storey', 'level-0'), oh, 'Level 0', null, null, storeyPl, null, null, E('ELEMENT'), R(0)]);
  b.add('IFCRELAGGREGATES', [role('rel', 'project-site'), oh, null, null, project, [site]]);
  b.add('IFCRELAGGREGATES', [role('rel', 'site-building'), oh, null, null, site, [building]]);
  b.add('IFCRELAGGREGATES', [role('rel', 'building-storey'), oh, null, null, building, [storey]]);

  const inStorey: StepRef[] = [];
  const byLayer = new Map<string, StepRef[]>();
  /** Each layer's representation items (IfcPresentationLayerWithStyle takes items, not representations). */
  const onLayer = (layerId: string, rep: StepRef) => (byLayer.get(layerId) ?? byLayer.set(layerId, []).get(layerId)!).push(rep);
  const shape = (reps: StepRef[]) => b.add('IFCPRODUCTDEFINITIONSHAPE', [null, null, reps]);
  const polyline = (pts: Point[]) => b.add('IFCPOLYLINE', [pts.map((p) => p2(p.x, p.y))]);

  // ------------------------------------------------------------ linework and walls (cad-3, cad-4)
  const vertices = new Map(snap.vertices.map((v) => [v.id, v]));
  const wallRef = new Map<number, StepRef>();
  const wallGid = new Map<number, string>();
  const wallEnds = new Map<number, [Point, Point]>();
  const usedVertices = new Set<number>();
  for (const e of snap.edges) {
    const a = vertices.get(e.v1), c = vertices.get(e.v2);
    if (!a || !c) continue;
    usedVertices.add(e.v1).add(e.v2);
    const A = { x: mm(a.x), y: mm(a.y) }, C = { x: mm(c.x), y: mm(c.y) };
    const curve = e.type === 'line'
      ? polyline([A, C])
      : b.add('IFCTRIMMEDCURVE', [
          b.add('IFCCIRCLE', [b.add('IFCAXIS2PLACEMENT2D', [p2(mm(e.cx), mm(e.cy)), null]), R(mm(e.r))]),
          [p2(A.x, A.y)], [p2(C.x, C.y)], E('T'), E('CARTESIAN')]);
    const isWall = walls.has(e.layerId);
    const pl = local(storeyPl);
    const g = role('edge', e.id);
    let product: StepRef;
    if (isWall) {
      const spec = layerById.get(e.layerId)!.ifc!;
      const reps = [b.add('IFCSHAPEREPRESENTATION', [axisCtx, 'Axis', 'Curve2D', [curve]])];
      onLayer(e.layerId, curve);
      const t = spec.thickness_mm, h = spec.height_mm;
      const len = Math.hypot(C.x - A.x, C.y - A.y);
      if (e.type === 'line' && t && h && t > 0 && h > 0 && len > 0) {
        const nx = (-(C.y - A.y) / len) * (t / 2), ny = ((C.x - A.x) / len) * (t / 2);
        const ring = [{ x: A.x + nx, y: A.y + ny }, { x: C.x + nx, y: C.y + ny }, { x: C.x - nx, y: C.y - ny }, { x: A.x - nx, y: A.y - ny }];
        const profile = b.add('IFCARBITRARYCLOSEDPROFILEDEF', [E('AREA'), null, polyline([...ring, ring[0]!])]);
        const solid = b.add('IFCEXTRUDEDAREASOLID', [profile, null, b.once('IFCDIRECTION', [[R(0), R(0), R(1)]]), R(h)]);
        reps.push(b.add('IFCSHAPEREPRESENTATION', [body, 'Body', 'SweptSolid', [solid]]));
      }
      const pre = spec.predefinedType && WALL_TYPES.has(spec.predefinedType) ? spec.predefinedType : 'NOTDEFINED';
      product = b.add('IFCWALL', [g, oh, `Wall ${e.id}`, null, null, pl, shape(reps), null, E(pre)]);
      wallRef.set(e.id, product);
      wallGid.set(e.id, g);
      wallEnds.set(e.id, [A, C]);
    } else {
      const rep = b.add('IFCSHAPEREPRESENTATION', [annotationCtx, 'Annotation', 'Curve2D', [curve]]);
      onLayer(e.layerId, curve);
      product = b.add('IFCANNOTATION', [g, oh, null, null, 'LINEWORK', pl, shape([rep]), E('USERDEFINED')]);
    }
    inStorey.push(product);
    pset(g, 'APK_CadEdge', [
      ['EdgeId', int(e.id)], ['GroupId', int(e.groupId)], ['V1', int(e.v1)], ['V2', int(e.v2)],
      ['Layer', ident(e.layerId)], ['Protected', opt(e.protected, bool)],
    ], [product]);
  }

  // ------------------------------------------------------------ texts and fills
  for (const t of snap.texts ?? []) {
    const rot = ((t.rotation ?? 0) * Math.PI) / 180;
    const dir = t.rotation ? b.add('IFCDIRECTION', [[R(Math.cos(rot)), R(Math.sin(rot))]]) : null;
    const lit = b.add('IFCTEXTLITERALWITHEXTENT', [
      t.text, b.add('IFCAXIS2PLACEMENT2D', [p2(mm(t.x), mm(t.y)), dir]), E('RIGHT'),
      b.add('IFCPLANAREXTENT', [R(Math.max(mm(t.height), 1e-3) * Math.max(1, t.text.length) * 0.6), R(Math.max(mm(t.height), 1e-3))]),
      BOX[`${t.vAlign ?? 'baseline'}:${t.align ?? 'left'}`] ?? 'bottom-left',
    ]);
    const rep = b.add('IFCSHAPEREPRESENTATION', [annotationCtx, 'Annotation', 'Annotation2D', [lit]]);
    onLayer(t.layerId, lit);
    const g = role('text', t.id);
    const product = b.add('IFCANNOTATION', [g, oh, null, null, 'TEXT', local(storeyPl), shape([rep]), E('TEXT')]);
    inStorey.push(product);
    pset(g, 'APK_CadText', [
      ['TextId', int(t.id)], ['Layer', ident(t.layerId)], ['Height', length(mm(t.height))],
      ['Rotation', opt(t.rotation, realv)], ['Color', opt(t.color, label)], ['Align', opt(t.align, label)],
      ['VAlign', opt(t.vAlign, label)], ['Protected', opt(t.protected, bool)], ['HostKey', opt(t.hostKey, ident)],
      ['HostHash', opt(t.hostHash, ident)],
    ], [product]);
  }
  for (const fl of snap.fills ?? []) {
    const pts = fl.points.map((p) => ({ x: mm(p.x), y: mm(p.y) }));
    if (pts.length < 2) continue;
    const area = b.add('IFCANNOTATIONFILLAREA', [polyline([...pts, pts[0]!]), null]);
    const rep = b.add('IFCSHAPEREPRESENTATION', [annotationCtx, 'Annotation', 'Annotation2D', [area]]);
    onLayer(fl.layerId, area);
    const g = role('fill', fl.id);
    const product = b.add('IFCANNOTATION', [g, oh, null, null, 'FILL', local(storeyPl), shape([rep]), E('USERDEFINED')]);
    inStorey.push(product);
    pset(g, 'APK_CadFill', [
      ['FillId', int(fl.id)], ['FillType', label(fl.type)], ['Layer', ident(fl.layerId)], ['PointCount', int(fl.points.length)],
      ['Color', opt(fl.color, label)], ['Opacity', opt(fl.opacity, realv)], ['HatchPattern', opt(fl.hatchPattern, label)],
      ['PaletteId', opt(fl.paletteId, ident)], ['Protected', opt(fl.protected, bool)], ['HostKey', opt(fl.hostKey, ident)],
      ['HostHash', opt(fl.hostHash, ident)],
    ], [product]);
  }

  // ------------------------------------------------------------ CAD block instances (symbols, palette products)
  const blockGid = (bi: CadBlockInstance) => role('block', bi.uuid);
  const blockByUuid = new Map((snap.blockInstances ?? []).map((bi) => [bi.uuid, bi]));
  const reflectedBy = new Map<string, CadBlockInstance>();
  for (const bi of snap.blockInstances ?? []) if (bi.mirrorOf) reflectedBy.set(bi.mirrorOf, bi);
  const placementAt = (relTo: StepRef, x: number, y: number, z: number, deg: number) => {
    const rad = (deg * Math.PI) / 180;
    const ax = deg ? b.add('IFCAXIS2PLACEMENT3D', [p3(x, y, z), b.once('IFCDIRECTION', [[R(0), R(0), R(1)]]), b.add('IFCDIRECTION', [[R(Math.cos(rad)), R(Math.sin(rad)), R(0)]])])
      : b.add('IFCAXIS2PLACEMENT3D', [p3(x, y, z), null, null]);
    return local(relTo, ax);
  };
  for (const bi of snap.blockInstances ?? []) {
    const g = blockGid(bi);
    const product = b.add('IFCANNOTATION', [g, oh, bi.blockName, null, 'CAD_BLOCK', placementAt(storeyPl, mm(bi.x), mm(bi.y), 0, bi.rotation || 0), null, E('USERDEFINED')]);
    inStorey.push(product);
    pset(g, 'APK_CadBlock', [
      ['InstanceId', int(bi.id)], ['Uuid', ident(bi.uuid)], ['BlockName', label(bi.blockName)], ['Scale', realv(bi.scale)],
      ['Rotation', realv(bi.rotation)], ['Layer', ident(bi.layerId)], ['Protected', opt(bi.protected, bool)],
      ['Attributes', bi.attributes ? text(json(bi.attributes)) : undefined], ['MirrorOf', opt(bi.mirrorOf, ident)],
    ], [product]);
    const partner = bi.mirrorOf ? blockByUuid.get(bi.mirrorOf) : reflectedBy.get(bi.uuid);
    if (partner) {
      pset(g, 'APK_Symmetry', [
        ['AxisX', length((mm(bi.x) + mm(partner.x)) / 2)], ['PartnerGlobalId', ident(blockGid(partner))],
        ['ReflectedFrom', bi.mirrorOf ? ident(blockGid(partner)) : undefined],
      ], [product]);
    }
  }

  // ------------------------------------------------------------ Virtual Mirror axes (cad-10)
  const ext = snap.vertices.length
    ? snap.vertices.reduce((m, v) => ({ y1: Math.min(m.y1, mm(v.y)), y2: Math.max(m.y2, mm(v.y)) }), { y1: Infinity, y2: -Infinity })
    : { y1: -1000, y2: 1000 };
  const y1 = ext.y1 === ext.y2 ? ext.y1 - 1000 : ext.y1, y2 = ext.y1 === ext.y2 ? ext.y2 + 1000 : ext.y2;
  for (const m of session.mirror?.mirrors ?? []) {
    const rep = b.add('IFCSHAPEREPRESENTATION', [annotationCtx, 'Annotation', 'Curve2D', [polyline([{ x: mm(m.x), y: y1 }, { x: mm(m.x), y: y2 }])]]);
    const g = role('mirror', m.id);
    const product = b.add('IFCANNOTATION', [g, oh, m.name ?? null, null, 'MIRROR_AXIS', local(storeyPl), shape([rep]), E('USERDEFINED')]);
    inStorey.push(product);
    pset(g, 'APK_CadMirror', [
      ['MirrorId', ident(m.id)], ['AxisX', length(mm(m.x))], ['Selected', bool(m.selected)], ['Name', opt(m.name, label)],
      ['ReflectedFrom', opt(m.reflectedFrom, ident)], ['GlowColor', opt(m.glowColor, label)],
    ], [product]);
  }

  // ------------------------------------------------------------ rooms (cad-4)
  interface Room { key: string; name: string; points: Point[]; layerId: string; kind: string; declared: boolean; roomType?: string; height?: number; edgeIds?: number[] }
  const rooms: Room[] = [];
  for (const s of session.spaces ?? []) {
    rooms.push({ key: s.key, name: s.name ?? s.key, points: s.points.map((p) => ({ x: mm(p.x), y: mm(p.y) })), layerId: s.layerId, kind: 'declared', declared: true, roomType: s.roomType, height: s.height_mm });
  }
  for (const face of wallFaces(snap.vertices, snap.edges.filter((e) => walls.has(e.layerId)))) {
    const layerId = snap.edges.find((e) => e.id === face.edgeIds[0])!.layerId;
    rooms.push({ key: face.key, name: `Room ${rooms.length + 1}`, points: face.points.map((p) => ({ x: mm(p.x), y: mm(p.y) })), layerId, kind: 'walls', declared: false, height: layerById.get(layerId)?.ifc?.height_mm, edgeIds: face.edgeIds });
  }
  const spaceRefs: { ref: StepRef; pl: StepRef; points: Point[] }[] = [];
  const tol = 1e-3;
  for (const r of rooms) {
    if (r.points.length < 3) continue;
    const g = role('space', r.key);
    const reps = [b.add('IFCSHAPEREPRESENTATION', [footprint, 'FootPrint', 'Curve2D', [polyline([...r.points, r.points[0]!])]])];
    if (r.height && r.height > 0) {
      const profile = b.add('IFCARBITRARYCLOSEDPROFILEDEF', [E('AREA'), null, polyline([...r.points, r.points[0]!])]);
      reps.push(b.add('IFCSHAPEREPRESENTATION', [body, 'Body', 'SweptSolid', [b.add('IFCEXTRUDEDAREASOLID', [profile, null, b.once('IFCDIRECTION', [[R(0), R(0), R(1)]]), R(r.height)])]]));
    }
    const pl = local(storeyPl);
    const space = b.add('IFCSPACE', [g, oh, r.name, null, r.roomType ?? null, pl, shape(reps), null, E('ELEMENT'), E('SPACE'), null]);
    spaceRefs.push({ ref: space, pl, points: r.points });
    pset(g, 'Pset_SpaceCommon', [['Reference', ident(r.key)]], [space]);
    pset(g, 'APK_CadSpace', [
      ['SpaceKey', ident(r.key)], ['Name', r.declared ? opt((session.spaces ?? []).find((x) => x.key === r.key)!.name, label) : undefined], ['Kind', label(r.kind)], ['Layer', ident(r.layerId)], ['Declared', bool(r.declared)],
      ['RoomType', opt(r.roomType, label)], ['Height', opt(r.height, positiveLength)],
      ['Points', r.declared ? text(json((session.spaces ?? []).find((s) => s.key === r.key)!.points)) : undefined],
    ], [space]);
    for (const [edgeId, [A, C]] of wallEnds) {
      if (r.edgeIds ? !r.edgeIds.includes(edgeId) : !onBoundary(A, r.points, tol) || !onBoundary(C, r.points, tol)) continue;
      const wg = wallGid.get(edgeId)!;
      b.add('IFCRELSPACEBOUNDARY', [ifcGuid('rel', 'spaceboundary', g, wg), oh, null, null, space, wallRef.get(edgeId)!, null, E('PHYSICAL'), E('NOTDEFINED')]);
    }
  }
  if (spaceRefs.length) b.add('IFCRELAGGREGATES', [role('rel', 'storey-spaces'), oh, null, null, storey, spaceRefs.map((s) => s.ref)]);

  // ------------------------------------------------------------ placed BIM blocks (cad-5)
  const placements = session.schematic?.placements ?? [];
  const bim = placements.filter((p) => bimPartOf(p));
  const merged = new Map<string, MergedType>();
  let library: StepRef | null = null;
  const libraryTypes: StepRef[] = [];
  const typeFor = (partId: string): MergedType => {
    let m = merged.get(partId);
    if (m) return m;
    const file = opts.types?.[partId];
    m = file ? mergePartType(b, file, { ownerHistory: oh, model, body }) ?? undefined : undefined;
    if (!m) {
      const partSet = b.add('IFCPROPERTYSET', [ifcGuid('part', partId, 'pset', 'APK_Part'), oh, 'APK_Part', null, [
        b.add('IFCPROPERTYSINGLEVALUE', ['PartId', null, ident(partId), null]),
        b.add('IFCPROPERTYSINGLEVALUE', ['Stage', null, label('stub'), null]),
      ]]);
      const t = b.add('IFCBUILDINGELEMENTPROXYTYPE', [ifcGuid('part', partId), oh, partId, 'A BIM part the drawing could not fetch: re-resolved by APK_Part.PartId', null, [partSet], null, partId, 'APK part', E('USERDEFINED')]);
      m = { type: t, entity: 'IFCBUILDINGELEMENTPROXYTYPE', maps: [], ports: [] };
    }
    merged.set(partId, m);
    libraryTypes.push(m.type);
    return m;
  };
  const seenIdentity = new Set<string>();
  const occByPlacement = new Map<number, { ref: StepRef; gid: string; p: BlockPlacement }>();
  const typed2occ = new Map<string, StepRef[]>();
  const contained = new Map<StepRef, StepRef[]>();
  for (const p of bim) {
    const partId = bimPartOf(p)!;
    const t = typeFor(partId);
    const maker = partId.split('/')[0] ?? partId;
    const mac = p.mac?.toLowerCase();
    const identity = p.serial ? `serial:${maker}/${p.serial}` : mac ? `mac:${mac}` : null;
    const firstOfIdentity = identity && !seenIdentity.has(identity);
    if (identity) seenIdentity.add(identity);
    const occRole = firstOfIdentity ? ['inst', identity!] : ['cad', doc, 'occ', p.hostKey && p.hostRef ? `host:${p.hostKey}:${p.hostRef}` : `placement:${p.id}`];
    const g = ifcGuid(...occRole);
    const at = { x: mm(p.at.x), y: mm(p.at.y) };
    const room = spaceRefs.find((s) => inside(at, s.points));
    const relTo = room ? room.pl : storeyPl;
    const pl = placementAt(relTo, at.x, at.y, p.z_mm ?? 0, p.rotation ?? 0);
    const rep = t.maps.length
      ? shape([b.add('IFCSHAPEREPRESENTATION', [body, 'Body', 'MappedRepresentation', t.maps.map((m) =>
          b.add('IFCMAPPEDITEM', [m, b.once('IFCCARTESIANTRANSFORMATIONOPERATOR3D', [null, null, origin3, null, null])]))])])
      : null;
    const ent = occurrenceEntity(t.entity);
    const occ = b.add(ent, [g, oh, p.refdes ?? partId, null, null, pl, rep, p.refdes ?? null, ...Array.from({ length: occurrenceTail(ent) }, () => null)]);
    occByPlacement.set(p.id, { ref: occ, gid: g, p });
    (typed2occ.get(partId) ?? typed2occ.set(partId, []).get(partId)!).push(occ);
    const box = room ? room.ref : storey;
    (contained.get(box) ?? contained.set(box, []).get(box)!).push(occ);
    // its own ports, one per terminal of its type, sharing the type ports' sets
    if (t.ports.length) {
      const own = t.ports.map(({ port, rels: prels }, i) => {
        const src = b.entity(port);
        const mine = b.add('IFCDISTRIBUTIONPORT', [ifcGuid(...occRole, 'port', String(i + 1)), oh, src.args[2] ?? null, src.args[3] ?? null, null, null, null, src.args[7] ?? null, src.args[8] ?? null, src.args[9] ?? null]);
        for (const r of prels) (b.entity(r).args[4] as StepValue[]).push(mine);
        return mine;
      });
      b.add('IFCRELNESTS', [ifcGuid(...occRole, 'nests'), oh, 'Terminals', null, occ, own]);
    }
    pset(g, 'Pset_ManufacturerOccurrence', [['SerialNumber', opt(p.serial, ident)]], [occ]);
    pset(g, 'APK_Identity', [['IdentityKey', identity ? ident(identity) : undefined], ['MacAddress', opt(mac, ident)]], [occ]);
    pset(g, 'APK_Placement', [
      ['PlacementId', int(p.id)], ['Layer', ident(p.layerId)], ['Rotation', opt(p.rotation, realv)], ['Scale', opt(p.scale, realv)],
      ['Refdes', opt(p.refdes, label)], ['MountingHeight', opt(p.z_mm, length)],
      ['Resource', p.resource && !IPV4.test(p.resource) ? ident(p.resource) : undefined],
      ['Mac', p.mac !== undefined && p.mac !== mac ? ident(p.mac) : undefined],
      ['HostKey', opt(p.hostKey, ident)], ['HostHash', opt(p.hostHash, ident)], ['HostRef', opt(p.hostRef, ident)],
      ['PortLabels', p.portLabels ? text(json(p.portLabels)) : undefined], ['Portals', p.portals ? text(json(p.portals)) : undefined],
      ['MountedOnEdge', opt(p.mountedOn?.edgeId, int)], ['MirrorOf', opt(p.mirrorOf, int)],
      ['BimRef', p.bimRef ? text(json(p.bimRef)) : undefined],
    ], [occ]);
  }
  for (const [, o] of occByPlacement) {
    const p = o.p;
    if (p.mountedOn && wallRef.has(p.mountedOn.edgeId)) {
      b.add('IFCRELCONNECTSELEMENTS', [ifcGuid('rel', 'mounted', wallGid.get(p.mountedOn.edgeId)!, o.gid), oh, 'Mounted on', null, null, wallRef.get(p.mountedOn.edgeId)!, o.ref]);
    }
    const reflected = [...occByPlacement.values()].find((x) => x.p.mirrorOf === p.id);
    const partner = p.mirrorOf !== undefined ? occByPlacement.get(p.mirrorOf) : reflected;
    if (partner) {
      pset(o.gid, 'APK_Symmetry', [
        ['AxisX', length((mm(p.at.x) + mm(partner.p.at.x)) / 2)], ['PartnerGlobalId', ident(partner.gid)],
        ['ReflectedFrom', p.mirrorOf !== undefined ? ident(partner.gid) : undefined],
      ], [o.ref]);
    }
  }
  for (const [partId, occs] of typed2occ) {
    b.add('IFCRELDEFINESBYTYPE', [ifcGuid('rel', 'type', ifcGuid('part', partId), role('occurrences')), oh, null, null, occs, merged.get(partId)!.type]);
  }
  if (libraryTypes.length) {
    library = b.add('IFCPROJECTLIBRARY', [role('library'), oh, 'BIM parts', 'The BIM library parts this drawing places', null, null, null, null, null]);
    b.add('IFCRELDECLARES', [role('rel', 'project-library'), oh, null, null, project, [library]]);
    b.add('IFCRELDECLARES', [role('rel', 'library-types'), oh, null, null, library, libraryTypes]);
  }

  if (session.schematic) {
    writeSchematic({ b, oh, doc, mm, pset, storeyPl, annotationCtx, occurrences: occByPlacement, inStorey }, session.schematic);
  }

  // ------------------------------------------------------------ containment, layers, the session's own state
  if (inStorey.length || contained.get(storey)?.length) {
    b.add('IFCRELCONTAINEDINSPATIALSTRUCTURE', [role('rel', 'storey-contains'), oh, null, null, [...inStorey, ...(contained.get(storey) ?? [])], storey]);
  }
  for (const s of spaceRefs) {
    const held = contained.get(s.ref);
    if (held?.length) b.add('IFCRELCONTAINEDINSPATIALSTRUCTURE', [ifcGuid('rel', 'contains', b.entity(s.ref).args[0] as string, role('occurrences')), oh, null, null, held, s.ref]);
  }
  for (const l of layers) {
    const items = byLayer.get(l.id);
    if (!items?.length) continue;
    const rgb = hexRgb(l.color);
    const colour = rgb ? b.add('IFCCOLOURRGB', [null, R(rgb[0]), R(rgb[1]), R(rgb[2])]) : null;
    const style = b.add('IFCCURVESTYLE', [l.name, null, l.lineweight ? typed('IFCPOSITIVELENGTHMEASURE', R(l.lineweight / 100)) : null, colour, null]);
    b.add('IFCPRESENTATIONLAYERWITHSTYLE', [l.name, null, items, l.id, E(l.visible === false ? 'F' : 'T'), E('F'), E(l.locked ? 'T' : 'F'), [style]]);
  }

  const sch = session.schematic;
  const vertexOrder = snap.vertices.map((v) => v.id);
  const orphans = snap.vertices.filter((v) => !usedVertices.has(v.id));
  const native = {
    vertexOrder,
    orphans,
    groupPrimitives: snap.groupPrimitives,
    groupIntact: snap.groupIntact,
    blocks: snap.blocks,
    present: (['texts', 'fills', 'blocks', 'blockInstances', 'nextTextId', 'nextFillId', 'nextBlockInstanceId'] as const).filter((k) => snap[k] !== undefined),
    schematic: sch ? schematicNative(sch) : undefined,
    session: Object.fromEntries((['gridMode', 'currentFileName', 'spaces', 'docKey', 'mirror'] as const).map((k) => [k, session[k] !== undefined])),
    version: session.version,
  };
  pset(ifcGuid('cad', doc, 'project'), 'APK_CadSession', [
    ['Schema', ident(CAD_IFC_SCHEMA)], ['DocKey', opt(session.docKey, ident)], ['Units', label(session.units)],
    ['GridSize', realv(session.gridSize)], ['GridMode', opt(session.gridMode, label)], ['SnapToGrid', bool(!!session.snapToGrid)],
    ['ShapeMode', bool(!!session.shapeMode)], ['ActiveLayer', ident(session.activeLayerId)],
    ['FileName', opt(session.currentFileName, label)],
    ['NextVertexId', int(snap.nextVertexId)], ['NextEdgeId', int(snap.nextEdgeId)], ['NextGroupId', int(snap.nextGroupId)],
    ['NextTextId', opt(snap.nextTextId, int)], ['NextFillId', opt(snap.nextFillId, int)], ['NextBlockInstanceId', opt(snap.nextBlockInstanceId, int)],
    ['MirrorEnabled', session.mirror ? bool(session.mirror.enabled) : undefined], ['MirrorX', session.mirror ? length(mm(session.mirror.x)) : undefined],
    ['MirrorSelected', session.mirror ? bool(session.mirror.selected) : undefined],
    ['Layers', text(json(layers))], ['Native', text(json(native))],
  ], [project]);

  for (const { set, objects } of rels) {
    const setGid = b.entity(set).args[0] as string;
    b.add('IFCRELDEFINESBYPROPERTIES', [ifcGuid('rel', 'props', setGid), oh, null, null, objects, set]);
  }

  const name = (opts.fileName ?? session.currentFileName ?? 'drawing').replace(/\.(dxf|ifc|json)$/i, '') + '.ifc';
  return b.write([
    { type: 'FILE_DESCRIPTION', args: [['ViewDefinition [ReferenceView]'], '2;1'] },
    { type: 'FILE_NAME', args: [name, stampOf(session.timestamp), ['APK.audio'], ['APK.audio'], 'CAD.Like.audio', 'CAD.Like.audio', ''] },
    { type: 'FILE_SCHEMA', args: [['IFC4X3_ADD2']] },
  ]);
}

