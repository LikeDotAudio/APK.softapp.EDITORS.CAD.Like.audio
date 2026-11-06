// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Point } from '../../core/types';
import { DOC_UNITS, SESSION_MM_VERSION } from '../../model/units/docUnits';
import { unitFactor } from '../../model/units/unitFactor';
import type { SavedSession } from './SavedSession';

/**
 * The units a session's numbers are in: mm from version 2 on (cad-1), the
 * session's own `units` before — a version 1 drawing kept its geometry in
 * whatever it was shown in.
 */
export function sessionDocUnits(session: Pick<SavedSession, 'version' | 'units'>): SavedSession['units'] {
  return (session.version ?? 1) >= SESSION_MM_VERSION ? DOC_UNITS : (session.units || 'in');
}

const pt = <P extends Point>(p: P, f: number): P => ({ ...p, x: p.x * f, y: p.y * f });

/**
 * A session as this editor keeps it: every number in mm, `units` only the
 * display choice, version 2. A version 2 session comes back as it is; a
 * version 1 one in inches (or cm, m, ft) is scaled to mm whole — the Doc as
 * scaleAll scales it, the Flow schematic (placements, their scale, wire
 * routes, group pads and label room), declared rooms, the Virtual Mirror, the
 * tracing image and the grid — so it opens at the size it was drawn.
 * Pure: the input is not touched.
 */
export function sessionInMm(session: SavedSession): SavedSession {
  if ((session.version ?? 1) >= SESSION_MM_VERSION) return session;
  const f = unitFactor(sessionDocUnits(session), DOC_UNITS);
  const out: SavedSession = { ...session, version: SESSION_MM_VERSION, units: session.units || 'in' };
  if (f === 1) return out;
  const d = session.docSnapshot;
  out.docSnapshot = {
    ...d,
    vertices: d.vertices.map((v) => pt(v, f)),
    edges: d.edges.map((e) => (e.type === 'arc' ? { ...e, cx: e.cx * f, cy: e.cy * f, r: e.r * f } : { ...e })),
    groupPrimitives: d.groupPrimitives.map(([id, p]) => [id, { ...p, cx: p.cx * f, cy: p.cy * f, r: p.r * f }]),
    ...(d.texts ? { texts: d.texts.map((t) => ({ ...pt(t, f), height: t.height * f })) } : {}),
    ...(d.fills ? { fills: d.fills.map((fl) => ({ ...fl, points: fl.points.map((p) => pt(p, f)) })) } : {}),
    ...(d.blockInstances ? { blockInstances: d.blockInstances.map((b) => ({ ...pt(b, f), scale: (b.scale ?? 1) * f })) } : {}),
  };
  if (session.schematic) {
    const s = session.schematic;
    out.schematic = {
      ...s,
      placements: s.placements.map((p) => ({ ...p, at: pt(p.at, f), scale: (p.scale ?? 1) * f })),
      connectors: s.connectors.map((c) => (c.route ? { ...c, route: c.route.map((p) => pt(p, f)) } : { ...c })),
      ...(s.groups
        ? { groups: s.groups.map((g) => ({ ...g, ...(g.pad !== undefined ? { pad: g.pad * f } : {}), ...(g.labelWidth !== undefined ? { labelWidth: g.labelWidth * f } : {}) })) }
        : {}),
    };
  }
  if (session.spaces) out.spaces = session.spaces.map((s) => ({ ...s, points: s.points.map((p) => pt(p, f)) }));
  if (session.mirror) out.mirror = { ...session.mirror, x: session.mirror.x * f, mirrors: session.mirror.mirrors.map((m) => ({ ...m, x: m.x * f })) };
  if (session.tracing) out.tracing = { ...session.tracing, x: session.tracing.x * f, y: session.tracing.y * f, worldWidth: session.tracing.worldWidth * f };
  if (session.gridSize) out.gridSize = session.gridSize * f;
  return out;
}
