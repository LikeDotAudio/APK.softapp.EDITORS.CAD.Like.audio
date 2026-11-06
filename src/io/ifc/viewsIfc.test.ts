// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { CadViewport } from '../../core/types';
import { Doc } from '../../model/Doc';
import type { SavedSession } from '../browserStorage/SavedSession';
import { entitiesByType, parseStep, writeStep } from '../../vendor/ifc/step';
import { exportIfc } from './exportIfc';
import { importIfc } from './importIfc';
import { projectionOf, viewContexts, viewsFromIfc, withViews } from './viewsIfc';

/* cad-9: a plan and four wall elevations are five view subcontexts with the right TargetView, and come back. */

function session(units: SavedSession['units']): SavedSession {
  const doc = new Doc();
  doc.addLine({ x: 0, y: 0 }, { x: 4000, y: 0 }, 0, '0');
  return {
    version: 1, timestamp: Date.UTC(2026, 10, 6), docSnapshot: doc.snapshot(), currentFileName: 'room.dxf', units,
    gridSize: 10, snapToGrid: true, shapeMode: false, activeLayerId: '0',
    layers: [{ id: '0', name: '0', color: '#ffffff', visible: true }], tracing: null, docKey: '1a2b3c4d-0000-4000-8000-00000000c0de',
  };
}

const VIEWS: CadViewport[] = [
  { id: 'plan', name: 'Plan', bounds: { x1: 0, y1: 0, x2: 6000, y2: 4000 }, host: true, scale: 0.02 },
  { id: 'elev-n', name: 'Elevation — north wall', bounds: { x1: 0, y1: 5000, x2: 6000, y2: 7700 }, host: true },
  { id: 'elev-e', name: 'Elevation — east wall', bounds: { x1: 7000, y1: 5000, x2: 11000, y2: 7700 }, host: true },
  { id: 'elev-s', name: 'South', subtitle: 'wall elevation', bounds: { x1: 0, y1: 8000, x2: 6000, y2: 10700 } },
  { id: 'elev-w', name: 'West', bounds: { x1: 7000, y1: 8000, x2: 11000, y2: 10700 }, projection: 'ELEVATION_VIEW' },
];

describe('the drawing\'s views as IFC subcontexts (cad-9)', () => {
  const text = withViews(exportIfc(session('mm')), VIEWS, 'mm');

  it('a plan and four elevations: five subcontexts with the right TargetView', () => {
    const ctx = viewContexts(text);
    expect(VIEWS.map((v) => ctx[v.id])).toEqual(['PLAN_VIEW', 'ELEVATION_VIEW', 'ELEVATION_VIEW', 'ELEVATION_VIEW', 'ELEVATION_VIEW']);
    const f = parseStep(text);
    expect(entitiesByType(f, 'IFCANNOTATION').filter((a) => a.args[4] === 'DRAWING')).toHaveLength(5);
    const plan = entitiesByType(f, 'IFCGEOMETRICREPRESENTATIONSUBCONTEXT').find((c) => c.args[0] === 'plan')!;
    expect(plan.args[7]).toMatchObject({ kind: 'real', value: 0.02 }); // TargetScale: a defined type, written bare
    if (process.env.CAD_IFC_OUT) {
      mkdirSync(process.env.CAD_IFC_OUT, { recursive: true });
      writeFileSync(join(process.env.CAD_IFC_OUT, 'views.ifc'), text);
    }
  });

  it('the viewports come back, in the drawing\'s units, and the session is untouched', () => {
    expect(viewsFromIfc(text, 'mm')).toEqual(VIEWS);
    const inches = VIEWS.map((v) => ({ ...v, bounds: { x1: v.bounds.x1 / 25.4, y1: v.bounds.y1 / 25.4, x2: v.bounds.x2 / 25.4, y2: v.bounds.y2 / 25.4 } }));
    const back = viewsFromIfc(withViews(exportIfc(session('in')), inches, 'in'), 'in');
    back.forEach((v, i) => { for (const k of ['x1', 'y1', 'x2', 'y2'] as const) expect(v.bounds[k]).toBeCloseTo(inches[i]!.bounds[k], 9); });
    expect(importIfc(text)).toEqual(session('mm'));
  });

  it('no views: the file is byte for byte the export; the codec re-writes an export unchanged', () => {
    const plain = exportIfc(session('mm'));
    expect(withViews(plain, [], 'mm')).toBe(plain);
    expect(writeStep(parseStep(plain))).toBe(plain);
  });

  it('a view says what it is, else its name does', () => {
    expect(projectionOf({ name: 'Reflected ceiling plan' })).toBe('REFLECTED_PLAN_VIEW');
    expect(projectionOf({ name: 'Cut-away A' })).toBe('SECTION_VIEW');
    expect(projectionOf({ name: 'Sheet 1', projection: 'SECTION_VIEW' })).toBe('SECTION_VIEW');
    expect(projectionOf({ name: 'TA01-C101' })).toBe('PLAN_VIEW');
  });
});
