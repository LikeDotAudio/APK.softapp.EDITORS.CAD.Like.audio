// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Edge, Layer, Vertex } from '../../core/types';
import { SESSION_MM_VERSION } from '../../model/units/docUnits';
import type { SavedSession } from '../browserStorage/SavedSession';
import { parseStep, type StepFile } from '../../vendor/ifc/step';
import { importIfc, IfcImportError } from './importIfc';

/**
 * A FOREIGN .ifc (ROAD-3598, answer 1)
 *
 * Our own files — the CAD's, the BIM library's, every APK writer's: FILE_NAME
 * names APK.audio as author — are read by the small STEP codec (importIfc), as
 * they always were, and the engine is never fetched. A file another tool wrote
 * (Revit, ArchiCAD, IfcOpenShell …) carries its geometry as swept solids, Breps,
 * booleans and mapped items, which the codec does not evaluate; for that one
 * the page loads web-ifc through the shared lazy loader
 * (FrontEnd/shared/apk-webifc.js, vendored at public/vendor/apk-webifc/) and
 * this file turns the model's meshes into a plan:
 *
 *   every product's FEATURE EDGES — a triangle edge that bounds the mesh or
 *   where its two faces turn by more than CREASE_DEG — projected onto the floor
 *   (z dropped), in mm, one layer per IFC class ('IfcWall', 'IfcSlab' …), the
 *   same line from a top and a bottom face kept once.
 *
 * So an extruded wall comes in as its outline, a slab as its edge, a rack as
 * its footprint; a slab's diagonal (two coplanar triangles) does not. The
 * layers are drawing layers, not IfcWall classification: saving the drawing
 * does not claim the outlines are walls.
 */

/** One product's mesh as apk-webifc.js gives it: world positions in mm, Z up. */
export interface IfcMesh {
  expressID: number;
  type: string;
  name?: string | null;
  globalId?: string | null;
  positions: Float32Array | number[];
  indices: Uint32Array | number[];
}

export interface IfcMeshes {
  schema?: string;
  version?: string;
  meshes: IfcMesh[];
}

/** window.APKWebIfc, as far as the CAD uses it. */
export interface WebIfcEngine {
  meshes(input: string | Uint8Array, opts?: unknown): Promise<IfcMeshes>;
}

export type IfcOrigin = 'cad' | 'apk' | 'foreign';

/** Faces that turn by more than this along a shared edge make it a drawn edge. */
export const CREASE_DEG = 20;
/** A projected edge shorter than this (mm) is a vertical edge seen end-on: dropped. */
const MIN_EDGE_MM = 0.5;
/** A plan this big is enough to see the model; past it the rest is not drawn (and the hint says so). */
export const MAX_PLAN_EDGES = 200_000;

const CLASS_COLOR: Record<string, string> = {
  IfcWall: '#94a3b8', IfcWallStandardCase: '#94a3b8', IfcCurtainWall: '#94a3b8',
  IfcSlab: '#64748b', IfcRoof: '#64748b', IfcCovering: '#64748b',
  IfcDoor: '#f59e0b', IfcWindow: '#38bdf8',
  IfcColumn: '#a3a3a3', IfcBeam: '#a3a3a3', IfcMember: '#a3a3a3', IfcPlate: '#a3a3a3',
  IfcStair: '#c084fc', IfcStairFlight: '#c084fc', IfcRailing: '#c084fc', IfcRamp: '#c084fc',
  IfcSpace: '#22c55e',
  IfcAudioVisualAppliance: '#4e9af1', IfcCommunicationsAppliance: '#4e9af1', IfcFurniture: '#eab308', IfcFurnishingElement: '#eab308',
};

/** Which reader a file is for: the CAD's own, another APK writer's, or someone else's. */
export function ifcOrigin(text: string): { origin: IfcOrigin; file?: StepFile } {
  let file: StepFile;
  try {
    file = parseStep(text);
  } catch {
    return { origin: 'foreign' };
  }
  const fn = file.header.find((h) => h.type === 'FILE_NAME');
  const names = (i: number) => (Array.isArray(fn?.args[i]) ? (fn!.args[i] as unknown[]) : []).map(String);
  const apk = [...names(2), ...names(3)].includes('APK.audio');
  if (!apk) return { origin: 'foreign', file };
  return { origin: /APK_CadSession/.test(text) ? 'cad' : 'apk', file };
}

/** The meshes' feature edges on the floor plan, one layer per IFC class. */
export function planFromMeshes(model: IfcMeshes, name?: string | null): { session: SavedSession; products: number; edges: number; truncated: boolean } {
  const vertices: Vertex[] = [];
  const vAt = new Map<string, number>();
  const q = (v: number) => Math.round(v * 10) / 10; // 0.1 mm
  const vertex = (x: number, y: number): number => {
    const key = `${q(x)},${q(y)}`;
    let id = vAt.get(key);
    if (id === undefined) {
      id = vertices.length + 1;
      vertices.push({ id, x: q(x), y: q(y) });
      vAt.set(key, id);
    }
    return id;
  };
  const edges: Edge[] = [];
  const seen = new Set<string>();
  const layers: Layer[] = [{ id: '0', name: '0', color: '#e5e7eb', visible: true }];
  const layerOf = new Map<string, string>();
  const layerFor = (type: string): string => {
    let id = layerOf.get(type);
    if (!id) {
      id = type;
      layers.push({ id, name: type, color: CLASS_COLOR[type] ?? '#cbd5e1', visible: true });
      layerOf.set(type, id);
    }
    return id;
  };
  const cosCrease = Math.cos((CREASE_DEG * Math.PI) / 180);
  const products = new Set<number>();
  let truncated = false;

  for (const m of model.meshes) {
    if (truncated) break;
    const P = m.positions, I = m.indices;
    if (!P.length || I.length < 3) continue;
    products.add(m.expressID);
    // weld the mesh's own corners (web-ifc repeats a corner per face, for flat normals)
    const wid = new Map<string, number>();
    const weld = new Int32Array(P.length / 3);
    for (let i = 0; i < weld.length; i++) {
      const key = `${Math.round(P[i * 3]! * 100)},${Math.round(P[i * 3 + 1]! * 100)},${Math.round(P[i * 3 + 2]! * 100)}`;
      let w = wid.get(key);
      if (w === undefined) { w = i; wid.set(key, i); }
      weld[i] = w;
    }
    const faces = new Map<string, { a: number; b: number; n: number[][] }>();
    for (let t = 0; t + 2 < I.length; t += 3) {
      const c = [I[t]!, I[t + 1]!, I[t + 2]!];
      const p = c.map((i) => [P[i * 3]!, P[i * 3 + 1]!, P[i * 3 + 2]!]);
      const u = [p[1]![0]! - p[0]![0]!, p[1]![1]! - p[0]![1]!, p[1]![2]! - p[0]![2]!];
      const v = [p[2]![0]! - p[0]![0]!, p[2]![1]! - p[0]![1]!, p[2]![2]! - p[0]![2]!];
      const n = [u[1]! * v[2]! - u[2]! * v[1]!, u[2]! * v[0]! - u[0]! * v[2]!, u[0]! * v[1]! - u[1]! * v[0]!];
      const l = Math.hypot(n[0]!, n[1]!, n[2]!);
      if (!(l > 0)) continue; // a sliver
      const nn = [n[0]! / l, n[1]! / l, n[2]! / l];
      for (let k = 0; k < 3; k++) {
        const a = weld[c[k]!]!, b = weld[c[(k + 1) % 3]!]!;
        if (a === b) continue;
        const key = a < b ? `${a}-${b}` : `${b}-${a}`;
        const f = faces.get(key);
        if (f) f.n.push(nn);
        else faces.set(key, { a, b, n: [nn] });
      }
    }
    const layerId = layerFor(m.type);
    for (const { a, b, n } of faces.values()) {
      const crease = n.length === 1 || n.some((x, i) => n.some((y, j) => j > i && x[0]! * y[0]! + x[1]! * y[1]! + x[2]! * y[2]! < cosCrease));
      if (!crease) continue;
      const ax = P[a * 3]!, ay = P[a * 3 + 1]!, bx = P[b * 3]!, by = P[b * 3 + 1]!;
      if (Math.hypot(bx - ax, by - ay) < MIN_EDGE_MM) continue;
      const v1 = vertex(ax, ay), v2 = vertex(bx, by);
      if (v1 === v2) continue;
      const key = `${layerId}|${Math.min(v1, v2)}-${Math.max(v1, v2)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      if (edges.length >= MAX_PLAN_EDGES) { truncated = true; break; }
      edges.push({ id: edges.length + 1, v1, v2, groupId: 0, layerId, type: 'line' });
    }
  }

  const session: SavedSession = {
    version: SESSION_MM_VERSION,
    timestamp: 0,
    docSnapshot: { vertices, edges, groupPrimitives: [], groupIntact: [], texts: [], fills: [], blocks: [], blockInstances: [], nextVertexId: vertices.length + 1, nextEdgeId: edges.length + 1, nextGroupId: 1 },
    currentFileName: name ?? null,
    units: 'mm',
    gridSize: 10,
    snapToGrid: true,
    shapeMode: false,
    activeLayerId: '0',
    layers,
    tracing: null,
  };
  return { session, products: products.size, edges: edges.length, truncated };
}

export interface ForeignOpen {
  session: SavedSession;
  /** 'codec': the small STEP codec; 'web-ifc': the engine's meshes. */
  via: 'codec' | 'web-ifc';
  origin: IfcOrigin;
  products?: number;
  truncated?: boolean;
  schema?: string;
}

/**
 * Any .ifc into a session. Ours: importIfc, and `engine` is never called. Foreign:
 * the engine's meshes as a plan; if the engine cannot be had (offline, no wasm)
 * or draws nothing, the codec's own reading of a foreign file (its wall axes,
 * linework and rooms) when it can parse one, else the engine's error.
 */
export async function openAnyIfc(text: string, engine: () => Promise<WebIfcEngine>): Promise<ForeignOpen> {
  const { origin, file } = ifcOrigin(text);
  if (origin !== 'foreign') return { session: importIfc(text), via: 'codec', origin };
  const project = projectName(text);
  let err: unknown;
  try {
    const model = await (await engine()).meshes(text);
    const plan = planFromMeshes(model, project);
    if (plan.edges > 0) return { session: plan.session, via: 'web-ifc', origin, products: plan.products, truncated: plan.truncated, schema: model.schema };
    err = new IfcImportError('the file has no geometry the engine could draw');
  } catch (e) {
    err = e;
  }
  if (file) {
    try {
      return { session: importIfc(text), via: 'codec', origin };
    } catch { /* the engine's reason is the better sentence */ }
  }
  throw err instanceof Error ? err : new IfcImportError(String(err));
}

function projectName(text: string): string | null {
  const m = /IFCPROJECT\s*\(\s*'[^']*'\s*,\s*(?:#\d+|\$)\s*,\s*'((?:[^']|'')*)'/i.exec(text);
  return m ? m[1]!.replace(/''/g, "'") : null;
}

/**
 * The shared loader (public/vendor/apk-webifc/apk-webifc.js), injected the first
 * time a foreign file is opened — a page that only ever opens our own files never
 * fetches it, nor the engine behind it.
 */
export async function webIfcEngine(): Promise<WebIfcEngine> {
  const g = globalThis as unknown as { APKWebIfc?: WebIfcEngine };
  if (g.APKWebIfc) return g.APKWebIfc;
  const src = new URL('./vendor/apk-webifc/apk-webifc.js', document.baseURI).href;
  await new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`the IFC engine loader did not load (${src})`));
    document.head.appendChild(s);
  });
  if (!g.APKWebIfc) throw new Error(`the IFC engine loader at ${src} did not set APKWebIfc`);
  return g.APKWebIfc;
}
