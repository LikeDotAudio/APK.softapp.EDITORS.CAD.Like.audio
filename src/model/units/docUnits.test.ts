// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@io/recentFiles/addRecentFile', () => ({ addRecentFile: async () => undefined }));
vi.mock('@io/browserStorage/saveSessionToBrowser', () => ({ saveSessionToBrowser: async () => undefined }));

import { Doc } from '../Doc';
import { EditorStore } from '../../state/EditorStore';
import { buildSavedSession } from '../../state/actions/autoSaveSession';
import { applySavedSession } from '../../state/actions/restoreBrowserSession';
import { loadDxfText } from '../../state/actions/loadDxfText';
import { sessionDocUnits, sessionInMm } from '../../io/browserStorage/sessionInMm';
import type { SavedSession } from '../../io/browserStorage/SavedSession';
import { exportIfc } from '../../io/ifc/exportIfc';
import { importIfc } from '../../io/ifc/importIfc';
import { geometryForHost, viewForHost } from '../../shell/hostBridge/hostBridge';
import { dxfForHost } from '../../shell/hostBridge/hostPick';
import { validateMessage } from '../../../contract/validate.mjs';
import { DOC_UNITS, SESSION_MM_VERSION, fromDisplay, toDisplay } from './docUnits';
import { formatField } from './formatField';
import { formatLength } from './formatLength';

/*
 * cad-1 (ROAD-3581): the editor keeps the drawing in mm; `units` is only how
 * lengths are shown and typed. A unit switch moves nothing, typed lengths are
 * converted once, sessions are version 2 (mm) and version 1 ones are scaled
 * to mm when opened, the .ifc and the DXF state mm, and host@1 says mm.
 */

vi.stubGlobal('requestAnimationFrame', () => 1);

const schema = JSON.parse(readFileSync(join(__dirname, '../../../contract/host@1/host.schema.json'), 'utf8'));

function storeWithBox(): EditorStore {
  const store = new EditorStore();
  store.doc.addLine({ x: 0, y: 0 }, { x: 254, y: 0 });
  store.doc.addLine({ x: 254, y: 0 }, { x: 254, y: 127 });
  return store;
}

const xs = (doc: Doc) => [...doc.vertices.values()].map((v) => [v.x, v.y]);

describe('lengths are converted only where a person reads or types them', () => {
  it('toDisplay / fromDisplay, and the formatters take mm', () => {
    expect(DOC_UNITS).toBe('mm');
    expect(toDisplay(25.4, 'in')).toBe(1);
    expect(fromDisplay(2, 'in')).toBeCloseTo(50.8, 12);
    expect(fromDisplay(3, 'm')).toBe(3000);
    expect(formatLength(254, 'in')).toBe('10.000');
    expect(formatLength(254, 'mm')).toBe('254.0');
    expect(formatLength(1234, 'cm')).toBe('123.4');
    expect(formatField(38.1, 'in')).toBe('1.5');
    expect(formatField(38.1, 'mm')).toBe('38.1');
  });

  it('a unit switch moves no point, keeps the view and the grid, and is saved', () => {
    const store = storeWithBox();
    const before = xs(store.doc);
    const zoom = store.view.zoom;
    const grid = store.gridSize;
    expect(store.units).toBe('in');
    expect(grid).toBeCloseTo(6.35, 12); // a quarter inch, in mm
    expect(zoom).toBeCloseTo(80 / 25.4, 12); // 80 px to the inch, as the opening sheet always showed it
    const v = store.docVersion;
    store.setUnits('mm');
    expect(store.units).toBe('mm');
    expect(xs(store.doc)).toEqual(before);
    expect(store.view.zoom).toBe(zoom);
    expect(store.gridSize).toBe(grid);
    expect(store.docVersion).toBe(v + 1);
    store.setUnits('ft');
    expect(xs(store.doc)).toEqual(before);
  });

  it('typed lengths reach the tool in mm, angles as typed', () => {
    const store = new EditorStore();
    store.setTool('line');
    store.units = 'in';
    store.dynValues = { len: '2', ang: '30' };
    expect(store.dynNumbers()).toEqual({ len: 50.8, ang: 30 });
    store.units = 'mm';
    expect(store.dynNumbers()).toEqual({ len: 2, ang: 30 });
    store.dynValues = { len: 'oops' };
    expect(store.dynNumbers()).toEqual({ len: null });
  });

  it('a calibration typed in inches scales the drawing to mm', () => {
    const store = storeWithBox();
    store.calibration = { ...store.calibration, p1: { x: 0, y: 0 }, p2: { x: 254, y: 0 } };
    // the ScaleBox converts what was typed: 20 in between the points
    expect(store.applyCalibration(fromDisplay(20, 'in'))).toBe(true);
    expect(Math.max(...xs(store.doc).map(([x]) => x!))).toBeCloseTo(508, 9);
  });
});

/** A version 1 session drawn in inches: a 10 × 5 in box, a 2 in text, a Flow block, a room, a mirror, an image. */
function inchSessionV1(): SavedSession {
  const doc = new Doc();
  doc.addLine({ x: 0, y: 0 }, { x: 10, y: 0 }, 0, '0');
  doc.addLine({ x: 10, y: 0 }, { x: 10, y: 5 }, 0, '0');
  doc.addArc(5, 5, 1, { x: 6, y: 5 }, { x: 5, y: 6 }, 0, '0');
  doc.addText('Title', 1, 4, 0.5, 0, '0');
  doc.addFill([{ x: 1, y: 1 }, { x: 2, y: 1 }, { x: 2, y: 2 }], 'hatch', '0');
  doc.addBlockDefinition({ name: 'SYM', basePoint: { x: 0, y: 0 }, lines: [{ x1: -1, y1: 0, x2: 1, y2: 0 }], arcs: [], circles: [] });
  doc.addBlockInstance('SYM', 3, 3, 2, 0, '0');
  return {
    version: 1,
    timestamp: Date.UTC(2026, 10, 6),
    docSnapshot: doc.snapshot(),
    currentFileName: 'bracket.dxf',
    units: 'in',
    gridSize: 0.25,
    snapToGrid: true,
    shapeMode: false,
    activeLayerId: '0',
    layers: [{ id: '0', name: '0', color: '#ffffff', visible: true }],
    tracing: { dataUrl: '', x: 1, y: 2, worldWidth: 10, opacity: 0.4, visible: true },
    docKey: '00000000-0000-4000-8000-0000000000c1',
    mirror: { enabled: true, x: 5, selected: false, mirrors: [{ id: 'm1', x: 5, selected: false }] },
    spaces: [{ key: 'r1', name: 'Box', layerId: '0', points: [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 5 }, { x: 0, y: 5 }] }],
    schematic: {
      placements: [{ id: 1, definitionId: 'flow.source', at: { x: 4, y: 1 }, layerId: '0', refdes: 'SRC1' }],
      connectors: [{ id: 1, from: { placementId: 1, portId: 'OUT' }, to: { placementId: 1, portId: 'CTL' }, layerId: '0', route: [{ x: 6, y: 1 }] }],
      groups: [{ id: 1, name: 'G', children: [], members: [1], layerId: '0', pad: 0.5, labelWidth: 2 }],
      nextPlacementId: 2,
      nextConnectorId: 2,
      nextGroupId: 2,
    },
  };
}

describe('sessions are in mm from version 2 on; a version 1 session is scaled to mm when opened', () => {
  it('sessionInMm scales every number of an inch session, and leaves a version 2 one alone', () => {
    const v1 = inchSessionV1();
    const frozen = JSON.stringify(v1);
    const s = sessionInMm(v1);
    expect(JSON.stringify(v1)).toBe(frozen); // pure
    expect(s.version).toBe(SESSION_MM_VERSION);
    expect(s.units).toBe('in');
    expect(sessionDocUnits(v1)).toBe('in');
    expect(sessionDocUnits(s)).toBe('mm');
    expect(s.docSnapshot.vertices.map((v) => [v.x, v.y])).toContainEqual([254, 127]);
    const arc = s.docSnapshot.edges.find((e) => e.type === 'arc')!;
    expect(arc.type === 'arc' && [arc.cx, arc.cy, arc.r]).toEqual([127, 127, 25.4]);
    expect(s.docSnapshot.texts![0]).toMatchObject({ x: 25.4, y: 101.6, height: 12.7 });
    expect(s.docSnapshot.fills![0]!.points[2]).toEqual({ x: 50.8, y: 50.8 });
    expect(s.docSnapshot.blockInstances![0]).toMatchObject({ x: 76.19999999999999, y: 76.19999999999999, scale: 50.8 });
    expect(s.docSnapshot.blocks).toEqual(v1.docSnapshot.blocks); // a definition is shared: its instance carries the factor
    expect(s.schematic!.placements[0]).toMatchObject({ at: { x: 101.6, y: 25.4 }, scale: 25.4 });
    expect(s.schematic!.connectors[0]!.route).toEqual([{ x: 152.39999999999998, y: 25.4 }]);
    expect(s.schematic!.groups![0]).toMatchObject({ pad: 12.7, labelWidth: 50.8 });
    expect(s.spaces![0]!.points[2]).toEqual({ x: 254, y: 127 });
    expect(s.mirror).toMatchObject({ x: 127, mirrors: [{ x: 127 }] });
    expect(s.tracing).toMatchObject({ x: 25.4, y: 50.8, worldWidth: 254 });
    expect(s.gridSize).toBeCloseTo(6.35, 12);
    expect(sessionInMm(s)).toBe(s);
    // a version 1 session already in mm is only relabelled
    const mm1 = sessionInMm({ ...v1, units: 'mm' });
    expect(mm1.version).toBe(SESSION_MM_VERSION);
    expect(mm1.docSnapshot).toBe(v1.docSnapshot);
  });

  it('the store saves version 2, and opens a version 1 inch session at its real size', async () => {
    const store = new EditorStore();
    await applySavedSession(store, { ...inchSessionV1(), tracing: null });
    expect(store.units).toBe('in');
    expect(Math.max(...xs(store.doc).map(([x]) => x!))).toBeCloseTo(254, 9);
    expect(store.gridSize).toBeCloseTo(6.35, 12);
    expect(store.spaces[0]!.points[1]).toEqual({ x: 254, y: 0 });
    expect(store.mirror.x).toBe(127);
    const saved = buildSavedSession(store);
    expect(saved.version).toBe(SESSION_MM_VERSION);
    expect(saved.units).toBe('in');
    // and back: a version 2 session opens as it is
    const again = new EditorStore();
    await applySavedSession(again, saved);
    expect(xs(again.doc)).toEqual(xs(store.doc));
  });

  it('a version 2 session shown in inches is the same .ifc as its mm twin, and comes back the same', () => {
    const v2 = sessionInMm(inchSessionV1());
    const asMm = { ...v2, units: 'mm' as const };
    const a = exportIfc({ ...v2, tracing: null });
    const b = exportIfc({ ...asMm, tracing: null });
    // the geometry is identical; only APK_CadSession.Units (the display choice) differs
    expect(a.replace(/'in'/g, "'mm'")).toBe(b);
    expect(a).toContain('IFCCARTESIANPOINT((254.,0.))');
    expect(importIfc(a)).toEqual({ ...v2, tracing: null });
    expect(exportIfc(importIfc(a))).toBe(a);
    // and a version 1 file (geometry in inches) still opens: its session in inches, then scaled
    const old = exportIfc({ ...inchSessionV1(), tracing: null });
    const back = importIfc(old);
    expect(back.version).toBe(1);
    expect(sessionInMm(back).docSnapshot.vertices.map((v) => v.x)).toContain(254);
  });
});

describe('the DXF says mm, and an inch DXF opens in mm', () => {
  it('Download DXF (and host@1 dxf) writes the drawing in mm with $INSUNITS 4, whatever is shown', () => {
    const store = storeWithBox();
    store.units = 'in';
    const { fileName, text } = dxfForHost(store);
    expect(fileName).toBe('my-part-mm.dxf');
    expect(text).toMatch(/\$INSUNITS\r?\n\s*70\r?\n\s*4\b/);
    expect(text).toMatch(/\n\s*11\r?\n254(\.0+)?\r?\n/);
  });

  it('an inch DXF is scaled to mm; the person keeps seeing inches', async () => {
    const store = new EditorStore();
    const inchDxf = dxfForHost(storeWithBox()).text.replace(/(\$INSUNITS\r?\n\s*70\r?\n\s*)4/, '$11');
    // the same numbers, now said to be inches: 254 in long
    await loadDxfText(store, inchDxf, 'inch.dxf', 'in', 'in');
    expect(store.units).toBe('in');
    expect(Math.max(...xs(store.doc).map(([x]) => x!))).toBeCloseTo(254 * 25.4, 6);
    // and an mm one, shown in inches, keeps its numbers
    const mmStore = new EditorStore();
    await loadDxfText(mmStore, dxfForHost(storeWithBox()).text, 'mm.dxf', 'mm', 'in');
    expect(mmStore.units).toBe('in');
    expect(Math.max(...xs(mmStore.doc).map(([x]) => x!))).toBeCloseTo(254, 9);
  });
});

describe('host@1 numbers are mm whatever the display units', () => {
  it('view and geometry say mm on an inch-shown sheet, and validate', () => {
    const store = storeWithBox();
    store.units = 'in';
    const view = viewForHost(store, { left: 0, top: 0, width: 800, height: 600 });
    expect(view.units).toBe('mm');
    expect(validateMessage(schema, 'toHost', { protocol: schema['x-protocol'], type: 'view', ...view })).toEqual([]);
    const geometry = geometryForHost(store, []);
    expect(geometry.units).toBe('mm');
    expect(validateMessage(schema, 'toHost', { protocol: schema['x-protocol'], type: 'geometry', ...geometry })).toEqual([]);
  });
});
