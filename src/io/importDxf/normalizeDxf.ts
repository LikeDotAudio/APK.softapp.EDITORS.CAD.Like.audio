// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { DxfBlock, DxfEntity } from './DxfParseResult';

/**
 * Turns what the drawing model has no shape for into what it has:
 *
 * - ELLIPSE → ARC / CIRCLE when it is round, else a polyline through it.
 * - SPLINE → a polyline along the evaluated NURBS curve (or through its fit
 *   points when the file carries no control points).
 * - DIMENSION → the lines, arrows and text of the anonymous block it names,
 *   which DXF keeps in world coordinates. The measurement stops being live; the
 *   drawing looks as it did.
 * - INSERT inside a BLOCK → that block's geometry, moved, scaled and rotated
 *   into the outer block, because a `CadBlockDefinition` holds geometry only.
 *   A model-space INSERT stays an INSERT (`keepInserts`).
 * - Model-space INSERT scaled differently in x and y (group 41 ≠ 42, which
 *   includes a mirror in one axis) → an INSERT of a derived block that holds
 *   the stretched geometry, because a `CadBlockInstance` has one scale. The
 *   placement still moves as one thing; only its scale is baked in.
 *
 * Curves become polylines only when nothing exact exists: a round ellipse is a
 * true arc, and a uniformly scaled block keeps its arcs true.
 */

type Pt = { x: number; y: number };
/** p' = [a c; b d]·p + (tx, ty) */
type Affine = { a: number; b: number; c: number; d: number; tx: number; ty: number };

const IDENTITY: Affine = { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 };
/** Nesting deeper than this is a cycle or a pathological file; the rest is dropped. */
const MAX_DEPTH = 16;
/** Segments a full turn of a tessellated curve gets. */
const SEGMENTS_PER_TURN = 64;
const EPS = 1e-9;

const apply = (m: Affine, p: Pt): Pt => ({ x: m.a * p.x + m.c * p.y + m.tx, y: m.b * p.x + m.d * p.y + m.ty });
const applyDir = (m: Affine, p: Pt): Pt => ({ x: m.a * p.x + m.c * p.y, y: m.b * p.x + m.d * p.y });
const compose = (outer: Affine, inner: Affine): Affine => ({
  a: outer.a * inner.a + outer.c * inner.b,
  b: outer.b * inner.a + outer.d * inner.b,
  c: outer.a * inner.c + outer.c * inner.d,
  d: outer.b * inner.c + outer.d * inner.d,
  tx: outer.a * inner.tx + outer.c * inner.ty + outer.tx,
  ty: outer.b * inner.tx + outer.d * inner.ty + outer.ty,
});
const det = (m: Affine) => m.a * m.d - m.b * m.c;
/** Rotation + uniform scale (+ mirror): circles stay circles. */
function similarity(m: Affine): boolean {
  const tol = 1e-9 * (Math.abs(m.a) + Math.abs(m.b) + Math.abs(m.c) + Math.abs(m.d) + 1);
  const rot = Math.abs(m.a - m.d) < tol && Math.abs(m.b + m.c) < tol;
  const mir = Math.abs(m.a + m.d) < tol && Math.abs(m.b - m.c) < tol;
  return rot || mir;
}
const deg = (rad: number) => (rad * 180) / Math.PI;
const rad = (d: number) => (d * Math.PI) / 180;
const norm360 = (d: number) => ((d % 360) + 360) % 360;

/** An INSERT's placement: base point to the origin, scale, rotate, move to the insertion point. */
function insertAffine(e: DxfEntity, block: DxfBlock): Affine {
  // DXF defaults each of 41/42 to 1 on its own
  const sx = e.scaleX ?? 1;
  const sy = e.scaleY ?? 1;
  const r = rad(e.rotation ?? 0);
  const cos = Math.cos(r);
  const sin = Math.sin(r);
  const lin = { a: cos * sx, b: sin * sx, c: -sin * sy, d: cos * sy };
  const ix = e.x1 ?? 0;
  const iy = e.y1 ?? 0;
  return {
    ...lin,
    tx: ix - (lin.a * block.baseX + lin.c * block.baseY),
    ty: iy - (lin.b * block.baseX + lin.d * block.baseY),
  };
}

/** Points along an arc from a1 to a2 degrees, counter-clockwise. */
function arcPoints(cx: number, cy: number, r: number, a1: number, a2: number): Pt[] {
  let sweep = norm360(a2 - a1);
  if (sweep < EPS) sweep = 360;
  const n = Math.max(4, Math.ceil((SEGMENTS_PER_TURN * sweep) / 360));
  const out: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const t = rad(a1 + (sweep * i) / n);
    out.push({ x: cx + r * Math.cos(t), y: cy + r * Math.sin(t) });
  }
  return out;
}

function polyline(base: DxfEntity, points: Pt[], closed: boolean): DxfEntity {
  return { type: 'LWPOLYLINE', layer: base.layer, colorIndex: base.colorIndex, points, isClosed: closed };
}

/** An ELLIPSE as a true circle or arc when it is round, else as a polyline. */
export function ellipseToEntities(e: DxfEntity): DxfEntity[] {
  const cx = e.cx ?? 0;
  const cy = e.cy ?? 0;
  const mx = e.majorX ?? 0;
  const my = e.majorY ?? 0;
  const ratio = e.ratio ?? 1;
  const major = Math.hypot(mx, my);
  if (major < EPS) return [];
  const t0 = e.startParam ?? 0;
  let t1 = e.endParam ?? 2 * Math.PI;
  while (t1 <= t0 + EPS) t1 += 2 * Math.PI;
  const full = t1 - t0 >= 2 * Math.PI - 1e-6;
  const tilt = Math.atan2(my, mx);
  const base = { layer: e.layer, colorIndex: e.colorIndex };
  if (Math.abs(ratio - 1) < 1e-6) {
    if (full) return [{ type: 'CIRCLE', ...base, cx, cy, r: major }];
    return [{ type: 'ARC', ...base, cx, cy, r: major, startAngle: norm360(deg(tilt + t0)), endAngle: norm360(deg(tilt + t1)) }];
  }
  // minor axis = major rotated a quarter turn counter-clockwise, times ratio
  const nx = -my * ratio;
  const ny = mx * ratio;
  const n = Math.max(8, Math.ceil((SEGMENTS_PER_TURN * (t1 - t0)) / (2 * Math.PI)));
  const pts: Pt[] = [];
  for (let i = 0; i < (full ? n : n + 1); i++) {
    const t = t0 + ((t1 - t0) * i) / n;
    pts.push({ x: cx + mx * Math.cos(t) + nx * Math.sin(t), y: cy + my * Math.cos(t) + ny * Math.sin(t) });
  }
  return [polyline(e, pts, full)];
}

/** A SPLINE as a polyline along its NURBS curve (de Boor), or through its fit points. */
export function splineToEntities(e: DxfEntity): DxfEntity[] {
  const ctrl = e.controlPoints ?? [];
  const closed = !!e.isClosed;
  if (ctrl.length < 2) {
    const fit = e.fitPoints ?? [];
    return fit.length >= 2 ? [polyline(e, fit, closed)] : [];
  }
  const n = ctrl.length;
  const p = Math.max(1, Math.min(e.degree ?? 3, n - 1));
  let knots = e.knots ?? [];
  if (knots.length !== n + p + 1) {
    // clamped uniform: p+1 zeros, interior steps, p+1 ones
    knots = [];
    for (let i = 0; i < n + p + 1; i++) knots.push(Math.min(Math.max(i - p, 0), n - p) / (n - p));
  }
  const w = e.weights && e.weights.length === n ? e.weights : ctrl.map(() => 1);
  const u0 = knots[p]!;
  const u1 = knots[n]!;
  const samples = Math.max(16, n * 8);
  const pts: Pt[] = [];
  for (let s = 0; s <= samples; s++) {
    const u = s === samples ? u1 : u0 + ((u1 - u0) * s) / samples;
    // span k with knots[k] <= u < knots[k+1], clamped to the last non-empty span
    let k = p;
    while (k < n - 1 && u >= knots[k + 1]!) k++;
    const d: { x: number; y: number; w: number }[] = [];
    for (let j = 0; j <= p; j++) {
      const i = k - p + j;
      const wi = w[i]!;
      d.push({ x: ctrl[i]!.x * wi, y: ctrl[i]!.y * wi, w: wi });
    }
    for (let r = 1; r <= p; r++) {
      for (let j = p; j >= r; j--) {
        const i = k - p + j;
        const den = knots[i + p - r + 1]! - knots[i]!;
        const a = den === 0 ? 0 : (u - knots[i]!) / den;
        d[j] = {
          x: (1 - a) * d[j - 1]!.x + a * d[j]!.x,
          y: (1 - a) * d[j - 1]!.y + a * d[j]!.y,
          w: (1 - a) * d[j - 1]!.w + a * d[j]!.w,
        };
      }
    }
    const q = d[p]!;
    pts.push({ x: q.x / q.w, y: q.y / q.w });
  }
  return [polyline(e, pts, closed)];
}

/** One drawable entity carried through an affine map; curves stay true where the map allows. */
export function transformEntity(e: DxfEntity, m: Affine): DxfEntity[] {
  if (m === IDENTITY) return [e];
  const sim = similarity(m);
  const flip = det(m) < 0;
  const s = Math.sqrt(Math.abs(det(m)));
  const angleOf = (dir: Pt) => norm360(deg(Math.atan2(dir.y, dir.x)));
  switch (e.type) {
    case 'LINE': {
      const p1 = apply(m, { x: e.x1 ?? 0, y: e.y1 ?? 0 });
      const p2 = apply(m, { x: e.x2 ?? 0, y: e.y2 ?? 0 });
      return [{ ...e, x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y }];
    }
    case 'CIRCLE': {
      if (sim) {
        const c = apply(m, { x: e.cx ?? 0, y: e.cy ?? 0 });
        return [{ ...e, cx: c.x, cy: c.y, r: (e.r ?? 0) * s }];
      }
      const pts = arcPoints(e.cx ?? 0, e.cy ?? 0, e.r ?? 0, 0, 360).slice(0, -1);
      return [polyline(e, pts.map((p) => apply(m, p)), true)];
    }
    case 'ARC': {
      const a1 = e.startAngle ?? 0;
      const a2 = e.endAngle ?? 0;
      if (sim) {
        const c = apply(m, { x: e.cx ?? 0, y: e.cy ?? 0 });
        const s1 = angleOf(applyDir(m, { x: Math.cos(rad(a1)), y: Math.sin(rad(a1)) }));
        const s2 = angleOf(applyDir(m, { x: Math.cos(rad(a2)), y: Math.sin(rad(a2)) }));
        // a mirror turns counter-clockwise into clockwise: swap the ends
        return [{ ...e, cx: c.x, cy: c.y, r: (e.r ?? 0) * s, startAngle: flip ? s2 : s1, endAngle: flip ? s1 : s2 }];
      }
      return [polyline(e, arcPoints(e.cx ?? 0, e.cy ?? 0, e.r ?? 0, a1, a2).map((p) => apply(m, p)), false)];
    }
    case 'LWPOLYLINE':
    case 'HATCH': {
      const pts = e.points ?? [];
      const bulged = pts.some((p) => p.bulge && Math.abs(p.bulge) > 1e-6);
      if (sim || !bulged) {
        return [{ ...e, points: pts.map((p) => ({ ...apply(m, p), ...(p.bulge ? { bulge: flip ? -p.bulge : p.bulge } : {}) })) }];
      }
      // a bulge is a circular arc; under a stretch it is not one any more
      const flat: Pt[] = [];
      const segs = e.isClosed ? pts.length : pts.length - 1;
      for (let i = 0; i < segs; i++) {
        const p1 = pts[i]!;
        const p2 = pts[(i + 1) % pts.length]!;
        if (p1.bulge && Math.abs(p1.bulge) > 1e-6) {
          const theta = 4 * Math.atan(p1.bulge);
          const n = Math.max(4, Math.ceil((SEGMENTS_PER_TURN * Math.abs(theta)) / (2 * Math.PI)));
          const chord = Math.hypot(p2.x - p1.x, p2.y - p1.y);
          const r = chord / (2 * Math.sin(Math.abs(theta) / 2));
          const mid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
          const h = r * Math.cos(theta / 2) * Math.sign(theta);
          const c = { x: mid.x - ((p2.y - p1.y) / chord) * h, y: mid.y + ((p2.x - p1.x) / chord) * h };
          const start = Math.atan2(p1.y - c.y, p1.x - c.x);
          for (let j = 0; j < n; j++) {
            const t = start + (theta * j) / n;
            flat.push({ x: c.x + r * Math.cos(t), y: c.y + r * Math.sin(t) });
          }
        } else {
          flat.push(p1);
        }
      }
      if (!e.isClosed && pts.length) flat.push(pts[pts.length - 1]!);
      return [{ ...e, points: flat.map((p) => apply(m, p)) }];
    }
    case 'TEXT':
    case 'MTEXT': {
      const out: DxfEntity = { ...e };
      if (e.x1 !== undefined) Object.assign(out, (({ x, y }) => ({ x1: x, y1: y }))(apply(m, { x: e.x1, y: e.y1 ?? 0 })));
      if (e.x2 !== undefined) Object.assign(out, (({ x, y }) => ({ x2: x, y2: y }))(apply(m, { x: e.x2, y: e.y2 ?? 0 })));
      if (e.textHeight !== undefined) out.textHeight = e.textHeight * Math.hypot(m.c, m.d);
      out.rotation = norm360((e.rotation ?? 0) + deg(Math.atan2(m.b, m.a)));
      return [out];
    }
    case 'SOLID': {
      const out: DxfEntity = { ...e };
      for (const [xk, yk] of [['x1', 'y1'], ['x2', 'y2'], ['x3', 'y3'], ['x4', 'y4']] as const) {
        if (e[xk] === undefined) continue;
        const p = apply(m, { x: e[xk]!, y: e[yk] ?? 0 });
        out[xk] = p.x;
        out[yk] = p.y;
      }
      return [out];
    }
    default:
      return [e];
  }
}

/**
 * Entities the loader can place, from entities as the file wrote them. With
 * `keepInserts` (model space) an INSERT stays an INSERT; without it (inside a
 * BLOCK) it is replaced by the inserted block's geometry.
 */
export function normalizeEntities(
  entities: DxfEntity[],
  blocks: Map<string, DxfBlock>,
  keepInserts: boolean,
  m: Affine = IDENTITY,
  open: string[] = [],
): DxfEntity[] {
  const out: DxfEntity[] = [];
  const inline = (name: string | undefined, inner: (b: DxfBlock) => Affine) => {
    const b = name ? blocks.get(name) : undefined;
    if (!b || open.includes(b.name) || open.length >= MAX_DEPTH) return;
    out.push(...normalizeEntities(b.entities, blocks, false, compose(m, inner(b)), [...open, b.name]));
  };
  for (const e of entities) {
    if (e.type === 'ELLIPSE') for (const x of ellipseToEntities(e)) out.push(...transformEntity(x, m));
    else if (e.type === 'SPLINE') for (const x of splineToEntities(e)) out.push(...transformEntity(x, m));
    // a DIMENSION's block is already in world coordinates: inserted at the origin
    else if (e.type === 'DIMENSION') inline(e.blockName, () => IDENTITY);
    else if (e.type === 'INSERT' && !keepInserts) inline(e.blockName, (b) => insertAffine(e, b));
    else out.push(...transformEntity(e, m));
  }
  return out;
}

/** A number as a block-name fragment a strict DXF reader accepts: `-1`, `0P5`. */
const nameNum = (n: number) => String(Math.round(n * 1e4) / 1e4).replace('.', 'P');

/**
 * Blocks with their nested INSERTs, DIMENSIONs and curves resolved, and
 * model-space entities likewise. A model-space INSERT whose x and y scale
 * differ points at a derived block (`<NAME>_X<sx>_Y<sy>`) with that scale
 * baked in, and keeps its insertion point and rotation at scale 1.
 */
export function normalizeDxf(blocks: DxfBlock[], entities: DxfEntity[]): { blocks: DxfBlock[]; entities: DxfEntity[] } {
  const byName = new Map(blocks.map((b) => [b.name, b]));
  const outBlocks = blocks.map((b) => ({ ...b, entities: normalizeEntities(b.entities, byName, false, IDENTITY, [b.name]) }));
  const derived = new Map<string, DxfBlock>();
  const sheet = entities.map((e) => {
    if (e.type !== 'INSERT' || !e.blockName) return e;
    const sx = e.scaleX ?? 1;
    const sy = e.scaleY ?? 1;
    const b = byName.get(e.blockName);
    if (!b || Math.abs(sx - sy) < 1e-9 * (Math.abs(sx) + Math.abs(sy) + 1)) return { ...e, scaleX: sx, scaleY: sy };
    const name = `${b.name}_X${nameNum(sx)}_Y${nameNum(sy)}`;
    if (!derived.has(name)) {
      // the base point to the origin, then the stretch: what insertAffine does before rotating
      const stretch: Affine = { a: sx, b: 0, c: 0, d: sy, tx: -sx * b.baseX, ty: -sy * b.baseY };
      derived.set(name, { name, baseX: 0, baseY: 0, entities: normalizeEntities(b.entities, byName, false, stretch, [b.name]) });
    }
    return { ...e, blockName: name, scaleX: 1, scaleY: 1 };
  });
  return {
    blocks: [...outBlocks, ...derived.values()],
    entities: normalizeEntities(sheet, byName, true),
  };
}
