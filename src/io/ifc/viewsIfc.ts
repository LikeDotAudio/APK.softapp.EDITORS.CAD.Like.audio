// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { CadViewport, Units, ViewProjection } from '../../core/types';
import { MM_PER_UNIT } from '../../model/units/mmPerUnit';
import { deref, entitiesByType, getPsets, isRef, parseStep, real, typed, unwrap, enumv, writeStep, type StepEntity, type StepRef, type StepValue } from '../../vendor/ifc/step';
import { ifcGuid } from '../../vendor/ifc/guid';

/**
 * THE DRAWING'S VIEWS AS REPRESENTATION SUBCONTEXTS (IFC-CORE-DELTAS cad-9)
 *
 * Every viewport of the drawing — a sheet found in it (discoverViewports) or a
 * space a host named (a plan, wall elevations, cut-aways) — is one
 * IfcGeometricRepresentationSubContext of the 'Plan' context, its TargetView
 * the IfcGeometricProjectionEnum it is (PLAN_VIEW, ELEVATION_VIEW,
 * SECTION_VIEW, REFLECTED_PLAN_VIEW …) and its TargetScale the 1:n it prints
 * at; plus an IfcAnnotation ObjectType 'DRAWING' whose 'Annotation'
 * representation in that subcontext is the frame (mm), carrying APK_View
 * {ViewId, Name, Subtitle, Bounds, Host, Projection, Scale} so the viewport
 * round-trips.
 *
 * Written onto a finished exportIfc file (withViews), so it stays its own
 * module: the views are not in SavedSession — they are found in the drawing
 * or named by a host — and the session's twin is written without them.
 */

export const VIEW_PROJECTIONS: readonly ViewProjection[] = ['PLAN_VIEW', 'ELEVATION_VIEW', 'SECTION_VIEW', 'REFLECTED_PLAN_VIEW', 'MODEL_VIEW', 'SKETCH_VIEW', 'GRAPH_VIEW'];

/** What a viewport is, when it does not say: by its name (a host's "Elevation — north wall"), else a plan. */
export function projectionOf(v: Pick<CadViewport, 'name' | 'subtitle' | 'projection'>): ViewProjection {
  if (v.projection) return v.projection;
  const s = `${v.name} ${v.subtitle ?? ''}`;
  if (/reflected|ceiling plan|\bRCP\b/i.test(s)) return 'REFLECTED_PLAN_VIEW';
  if (/elevation/i.test(s)) return 'ELEVATION_VIEW';
  if (/section|cut[- ]?away/i.test(s)) return 'SECTION_VIEW';
  return 'PLAN_VIEW';
}

const num = (v: unknown): number | undefined => (typeof v === 'number' && Number.isFinite(v) ? v : undefined);
const R = (x: number) => real(Object.is(x, -0) ? 0 : x);

/** `ifcText` (an exportIfc file) with the views added; unchanged when there are none. */
export function withViews(ifcText: string, viewports: readonly CadViewport[], units: Units): string {
  if (!viewports.length) return ifcText;
  const file = parseStep(ifcText);
  const f = MM_PER_UNIT[units] ?? 1;
  let next = file.entities.reduce((m, e) => Math.max(m, e.id), 0) + 1;
  const add = (type: string, args: StepValue[]): StepRef => {
    const e: StepEntity = { id: next++, type, args };
    file.entities.push(e);
    file.byId.set(e.id, e);
    return { kind: 'ref', id: e.id };
  };
  const first = (type: string) => entitiesByType(file, type)[0];
  const project = first('IFCPROJECT');
  const plan = entitiesByType(file, 'IFCGEOMETRICREPRESENTATIONCONTEXT').find((c) => c.args[1] === 'Plan');
  const storey = first('IFCBUILDINGSTOREY');
  if (!project || !plan || !storey) return ifcText;
  const oh = first('IFCOWNERHISTORY');
  const ohRef: StepRef | null = oh ? { kind: 'ref', id: oh.id } : null;
  const base = String(project.args[0]);
  const label = (s: string) => typed('IFCLABEL', s);
  const ident = (s: string) => typed('IFCIDENTIFIER', s);
  const prop = (k: string, v: StepValue) => add(Array.isArray(v) ? 'IFCPROPERTYLISTVALUE' : 'IFCPROPERTYSINGLEVALUE', [k, null, v, null]);
  const annotations: StepRef[] = [];
  const used = new Set<string>();
  for (const v of viewports) {
    const role = (...r: string[]) => ifcGuid(base, 'view', v.id, ...r);
    if (used.has(v.id)) continue;
    used.add(v.id);
    const view = projectionOf(v);
    const ctx = add('IFCGEOMETRICREPRESENTATIONSUBCONTEXT', [v.id, 'Plan', { kind: 'derived' }, { kind: 'derived' }, { kind: 'derived' }, { kind: 'derived' }, { kind: 'ref', id: plan.id },
      v.scale && v.scale > 0 ? R(v.scale) : null, enumv(view), null]);
    const b = { x1: v.bounds.x1 * f, y1: v.bounds.y1 * f, x2: v.bounds.x2 * f, y2: v.bounds.y2 * f };
    const ring = [[b.x1, b.y1], [b.x2, b.y1], [b.x2, b.y2], [b.x1, b.y2], [b.x1, b.y1]].map(([x, y]) => add('IFCCARTESIANPOINT', [[R(x!), R(y!)]]));
    const rep = add('IFCSHAPEREPRESENTATION', [ctx, 'Annotation', 'Curve2D', [add('IFCPOLYLINE', [ring])]]);
    const shape = add('IFCPRODUCTDEFINITIONSHAPE', [null, null, [rep]]);
    const pl = add('IFCLOCALPLACEMENT', [storey.args[5] ?? null, add('IFCAXIS2PLACEMENT3D', [add('IFCCARTESIANPOINT', [[R(0), R(0), R(0)]]), null, null])]);
    const g = role();
    const ann = add('IFCANNOTATION', [g, ohRef, v.name, v.subtitle ?? null, 'DRAWING', pl, shape, enumv('USERDEFINED')]);
    annotations.push(ann);
    const props = [
      prop('ViewId', ident(v.id)), prop('Name', label(v.name)),
      ...(v.subtitle !== undefined ? [prop('Subtitle', label(v.subtitle))] : []),
      prop('Bounds', [b.x1, b.y1, b.x2, b.y2].map((x) => typed('IFCLENGTHMEASURE', R(x)))),
      ...(v.host !== undefined ? [prop('Host', typed('IFCBOOLEAN', enumv(v.host ? 'T' : 'F')))] : []),
      ...(v.projection !== undefined ? [prop('Projection', label(v.projection))] : []),
      ...(v.scale !== undefined ? [prop('Scale', typed('IFCREAL', R(v.scale)))] : []),
    ];
    const set = add('IFCPROPERTYSET', [ifcGuid(g, 'pset', 'APK_View'), ohRef, 'APK_View', null, props]);
    add('IFCRELDEFINESBYPROPERTIES', [ifcGuid('rel', 'props', ifcGuid(g, 'pset', 'APK_View')), ohRef, null, null, [ann], set]);
  }
  const contains = entitiesByType(file, 'IFCRELCONTAINEDINSPATIALSTRUCTURE').find((r) => isRef(r.args[5]) && r.args[5].id === storey.id);
  if (contains && Array.isArray(contains.args[4])) contains.args[4] = [...contains.args[4], ...annotations];
  else add('IFCRELCONTAINEDINSPATIALSTRUCTURE', [ifcGuid(base, 'rel', 'storey-views'), ohRef, 'Views', null, annotations, { kind: 'ref', id: storey.id }]);
  return writeStep(file);
}

/** The viewports a file carries (its 'DRAWING' annotations with APK_View), in the drawing's `units`. */
export function viewsFromIfc(ifcText: string, units: Units): CadViewport[] {
  const file = parseStep(ifcText);
  const f = MM_PER_UNIT[units] ?? 1;
  const out: CadViewport[] = [];
  for (const a of entitiesByType(file, 'IFCANNOTATION')) {
    if (a.args[4] !== 'DRAWING') continue;
    const p = getPsets(file, a).APK_View;
    const bounds = Array.isArray(p?.Bounds) ? (p!.Bounds as unknown[]).map(num) : [];
    if (!p || bounds.length !== 4 || bounds.some((x) => x === undefined)) continue;
    const [x1, y1, x2, y2] = bounds as number[];
    const v: CadViewport = { id: String(p.ViewId), name: String(p.Name), bounds: { x1: x1! / f, y1: y1! / f, x2: x2! / f, y2: y2! / f } };
    if (p.Subtitle !== undefined) v.subtitle = String(p.Subtitle);
    if (p.Host !== undefined) v.host = p.Host === true;
    if (p.Projection !== undefined) v.projection = p.Projection as ViewProjection;
    if (p.Scale !== undefined) v.scale = p.Scale as number;
    out.push(v);
  }
  return out;
}

/** The TargetView of each view subcontext a file carries, by its identifier. */
export function viewContexts(ifcText: string): Record<string, string> {
  const file = parseStep(ifcText);
  const out: Record<string, string> = {};
  for (const c of entitiesByType(file, 'IFCGEOMETRICREPRESENTATIONSUBCONTEXT')) {
    const parent = deref(file, c.args[6]);
    if (parent?.args[1] === 'Plan' && typeof c.args[0] === 'string') out[c.args[0]] = String(unwrap(c.args[8]));
  }
  return out;
}
