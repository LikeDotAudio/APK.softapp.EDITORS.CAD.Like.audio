// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CadSpace, Layer } from '../../core/types';
import { Doc } from '../../model/Doc';
import type { EditorStore } from '../../state/EditorStore';
import { cycleWallLoadBearing, parseRating, promptWallRating, toggleWallLayer, cycleWallExternal } from '../../state/actions/roomsAndWalls';
import { ensureHostLayer, parseLayerIfc } from '../../shell/hostBridge/hostLayer';
import { exportIfc } from '../../io/ifc/exportIfc';
import { importIfc } from '../../io/ifc/importIfc';
import type { SavedSession } from '../../io/browserStorage/SavedSession';
import { entitiesByType, getPsets, parseStep } from '../../vendor/ifc/step';
import { validateMessage } from '../../../contract/validate.mjs';
import { Viewport } from '../../viewport/Viewport';
import type { Scene } from '../Scene';
import { CANVAS } from '../palette';
import { drawRoomFloors, drawRoomLabels } from './drawRooms';
import { formatArea, ringCentroid, roomLabel } from './roomLabel';

/*
 * ROAD-3581 (CAD leftovers): a declared room is drawn on the canvas — outline,
 * floor tint, name and area — and a wall layer carries the Pset_WallCommon
 * facts the user states (LoadBearing, AcousticRating, FireRating, IsExternal),
 * from the layer menu or a host's `layer { ifc }`, into the .ifc and back.
 * `CAD_IFC_OUT=<dir>` writes walls-psets.ifc for IfcOpenShell's validate.
 */

const schema = JSON.parse(readFileSync(join(__dirname, '../../../contract/host@1/host.schema.json'), 'utf8'));

afterEach(() => vi.unstubAllGlobals());

const STUDIO: CadSpace = { key: 'studio', name: 'Studio', layerId: 'Rooms', points: [{ x: 0, y: 0 }, { x: 3500, y: 0 }, { x: 3500, y: 4000 }, { x: 0, y: 4000 }] };

describe('a declared room says its name and area', () => {
  it('m² for a room, mm² for something smaller than a tenth of a square metre', () => {
    expect(formatArea(14e6)).toBe('14.00 m²');
    expect(formatArea(-14e6)).toBe('14.00 m²');
    expect(formatArea(1e5)).toBe('0.10 m²');
    expect(formatArea(99_999)).toBe('99,999 mm²');
    expect(formatArea(600 * 400)).toBe('0.24 m²');
    expect(formatArea(300 * 200)).toBe('60,000 mm²');
  });

  it('the label sits at the area centre of the ring, and falls back to the key', () => {
    expect(roomLabel(STUDIO)).toEqual({ name: 'Studio', area: '14.00 m²', areaMm2: 14e6, at: { x: 1750, y: 2000 } });
    // an L: the centre of area, not the vertex mean
    const l = [{ x: 0, y: 0 }, { x: 2000, y: 0 }, { x: 2000, y: 1000 }, { x: 1000, y: 1000 }, { x: 1000, y: 2000 }, { x: 0, y: 2000 }];
    const c = ringCentroid(l);
    expect(c.x).toBeCloseTo(5000 / 6, 9);
    expect(c.y).toBeCloseTo(5000 / 6, 9);
    expect(roomLabel({ key: 'room-7', points: l }).name).toBe('room-7');
    expect(roomLabel({ key: 'room-7', points: l }).area).toBe('3.00 m²');
  });
});

/** A canvas context that records what is drawn. */
function recordingCtx() {
  const calls: { op: string; args: unknown[]; fillStyle?: unknown; strokeStyle?: unknown; font?: unknown }[] = [];
  const ctx: Record<string, unknown> = { fillStyle: '', strokeStyle: '', font: '', lineWidth: 1, textAlign: 'left', textBaseline: 'alphabetic' };
  for (const op of ['save', 'restore', 'beginPath', 'moveTo', 'lineTo', 'closePath', 'fill', 'stroke', 'setLineDash', 'fillRect', 'fillText']) {
    ctx[op] = (...args: unknown[]) => calls.push({ op, args, fillStyle: ctx.fillStyle, strokeStyle: ctx.strokeStyle, font: ctx.font });
  }
  ctx.measureText = (t: string) => ({ width: t.length * 6 });
  return { ctx: ctx as unknown as CanvasRenderingContext2D, calls };
}

function sceneOf(ctx: CanvasRenderingContext2D): Scene {
  const view = new Viewport();
  view.zoom = 0.1; // px per mm
  view.panX = 10;
  view.panY = 500;
  return { ctx, view, doc: new Doc(), units: 'mm', gridSize: 10, pointer: { world: { x: 0, y: 0 }, rawWorld: { x: 0, y: 0 }, screen: { x: 0, y: 0 } } };
}

describe('declared rooms are drawn on the canvas', () => {
  const layers = new Map<string, Layer>([
    ['Rooms', { id: 'Rooms', name: 'Rooms', color: '#fff', visible: true }],
    ['Hidden', { id: 'Hidden', name: 'Hidden', color: '#fff', visible: false }],
  ]);

  it('outline and floor tint along its points, on screen', () => {
    const { ctx, calls } = recordingCtx();
    drawRoomFloors(sceneOf(ctx), [STUDIO], layers);
    const path = calls.filter((c) => c.op === 'moveTo' || c.op === 'lineTo').map((c) => c.args);
    expect(path).toEqual([[10, 500], [360, 500], [360, 100], [10, 100]]);
    expect(calls.find((c) => c.op === 'fill')!.fillStyle).toBe(CANVAS.roomFill);
    expect(calls.find((c) => c.op === 'stroke')!.strokeStyle).toBe(CANVAS.room);
    expect(calls.find((c) => c.op === 'setLineDash')!.args[0]).toEqual([6, 4]);
  });

  it('its name and area at its centre, in the room colour', () => {
    const { ctx, calls } = recordingCtx();
    drawRoomLabels(sceneOf(ctx), [STUDIO], layers);
    const texts = calls.filter((c) => c.op === 'fillText');
    expect(texts.map((c) => c.args[0])).toEqual(['Studio', '14.00 m²']);
    expect(texts[0]!.args[1]).toBe(185); // x of the centre: 10 + 1750 × 0.1
    expect(texts.every((c) => c.fillStyle === CANVAS.roomText)).toBe(true);
  });

  it('a room on a hidden layer, or with fewer than three points, is not drawn', () => {
    const { ctx, calls } = recordingCtx();
    drawRoomFloors(sceneOf(ctx), [{ ...STUDIO, layerId: 'Hidden' }, { ...STUDIO, points: STUDIO.points.slice(0, 2) }], layers);
    drawRoomLabels(sceneOf(ctx), [{ ...STUDIO, layerId: 'Hidden' }], layers);
    drawRoomFloors(sceneOf(ctx), undefined, layers);
    expect(calls).toEqual([]);
  });
});

/** The smallest store the wall actions use. */
function fakeStore(layers: Layer[]) {
  const store = {
    doc: new Doc(),
    selection: new Set<number>(),
    layers: new Map(layers.map((l) => [l.id, { ...l }])),
    spaces: [],
    changed: 0,
    markDocChanged() { this.changed++; },
    requestDraw() {},
    emit() {},
    showHint() {},
    setLayerColor() {},
    setLayerFinish() {},
    addLayer() {},
    activeLayerId: "0",
  };
  return store as unknown as EditorStore & { changed: number };
}

function answer(...replies: (string | null)[]) {
  const prompt = vi.fn(() => (replies.length ? replies.shift()! : null));
  vi.stubGlobal('window', { prompt });
  return prompt;
}

describe('Pset_WallCommon on a wall layer is what the user says', () => {
  const LAYERS: Layer[] = [
    { id: '0', name: '0', color: '#ffffff', visible: true },
    { id: 'Walls', name: 'Walls', color: '#94a3b8', visible: true },
  ];

  it('a rating is a label as written; empty is not said; too long or cancelled changes nothing', () => {
    expect(parseRating('  STC   52 ')).toBe('STC 52');
    expect(parseRating('')).toBeUndefined();
    expect(parseRating('   ')).toBeUndefined();
    expect(parseRating(null)).toBeNull();
    expect(parseRating('x'.repeat(256))).toBeNull();
    expect(parseRating('x'.repeat(255))).toHaveLength(255);
  });

  it('Load Bearing steps yes → no → not said; Acoustic and Fire Rating are prompted; each change autosaves', () => {
    const store = fakeStore(LAYERS);
    // nothing to say about a layer that is not walls
    cycleWallLoadBearing(store, 'Walls');
    answer('STC 52');
    promptWallRating(store, 'Walls', 'acousticRating');
    expect(store.layers.get('Walls')!.ifc).toBeUndefined();
    expect(store.changed).toBe(0);

    toggleWallLayer(store, 'Walls');
    cycleWallLoadBearing(store, 'Walls');
    expect(store.layers.get('Walls')!.ifc!.loadBearing).toBe(true);
    cycleWallLoadBearing(store, 'Walls');
    expect(store.layers.get('Walls')!.ifc!.loadBearing).toBe(false);
    cycleWallLoadBearing(store, 'Walls');
    expect('loadBearing' in store.layers.get('Walls')!.ifc!).toBe(false);

    const prompt = answer('STC 52', 'EI 60');
    promptWallRating(store, 'Walls', 'acousticRating');
    promptWallRating(store, 'Walls', 'fireRating');
    expect(prompt.mock.calls[0]![0]).toContain('Acoustic rating of the walls on Walls');
    cycleWallLoadBearing(store, 'Walls');
    cycleWallExternal(store, 'Walls');
    expect(store.layers.get('Walls')!.ifc).toEqual({ entity: 'IfcWall', predefinedType: 'STANDARD', loadBearing: true, isExternal: true, acousticRating: 'STC 52', fireRating: 'EI 60' });

    // the offered answer is what is there; cancelling keeps it, empty takes it off
    const again = answer(null, '');
    promptWallRating(store, 'Walls', 'fireRating');
    expect(store.layers.get('Walls')!.ifc!.fireRating).toBe('EI 60');
    promptWallRating(store, 'Walls', 'fireRating');
    expect(again.mock.calls[0]![1]).toBe('EI 60');
    expect('fireRating' in store.layers.get('Walls')!.ifc!).toBe(false);
  });

  it('a host states them in `layer { ifc }` (host@1 2.11.0), read strictly', () => {
    const msg = { protocol: schema['x-protocol'], type: 'layer', name: 'Walls', ifc: { entity: 'IfcWall', predefinedType: 'PARTITIONING', height_mm: 2700, thickness_mm: 150, isExternal: false, loadBearing: true, acousticRating: 'Rw 45 dB', fireRating: '2 HR' } };
    expect(validateMessage(schema, 'toCad', msg)).toEqual([]);
    expect(validateMessage(schema, 'toCad', { ...msg, ifc: { ...msg.ifc, loadBearing: 'yes' } })).not.toEqual([]);
    expect(validateMessage(schema, 'toCad', { ...msg, ifc: { ...msg.ifc, fireRating: 60 } })).not.toEqual([]);
    expect(parseLayerIfc(msg.ifc)).toEqual(msg.ifc);
    expect(parseLayerIfc({ entity: 'IfcWall', loadBearing: 'yes', isExternal: 1, acousticRating: '  ', fireRating: 60 })).toEqual({ entity: 'IfcWall' });
    const store = fakeStore(LAYERS);
    expect(ensureHostLayer(store, msg)).toBe(true);
    expect(store.layers.get('Walls')!.ifc).toEqual(msg.ifc);
    expect(ensureHostLayer(store, msg)).toBe(false); // the same again changes nothing
  });

  it('into the .ifc as Pset_WallCommon, and back on the layer', () => {
    const doc = new Doc();
    doc.addLine({ x: 0, y: 0 }, { x: 5000, y: 0 }, 0, 'Walls');
    doc.addLine({ x: 5000, y: 0 }, { x: 5000, y: 3000 }, 0, 'Walls');
    const ifc = { entity: 'IfcWall' as const, predefinedType: 'STANDARD', height_mm: 2700, thickness_mm: 200, isExternal: true, loadBearing: false, acousticRating: 'STC 52', fireRating: 'EI 60' };
    const session: SavedSession = {
      version: 2, timestamp: Date.UTC(2026, 10, 6, 12, 0, 0), docSnapshot: doc.snapshot(), currentFileName: 'walls-psets.dxf', units: 'in',
      gridSize: 6.35, snapToGrid: true, shapeMode: false, activeLayerId: 'Walls', tracing: null,
      layers: [LAYERS[0]!, { ...LAYERS[1]!, ifc }], docKey: '00000000-0000-4000-8000-00000000a11e',
      spaces: [{ key: 'r1', name: 'Booth', layerId: '0', points: [{ x: 0, y: 0 }, { x: 5000, y: 0 }, { x: 5000, y: 3000 }, { x: 0, y: 3000 }], height_mm: 2400 }],
    };
    const text = exportIfc(session);
    if (process.env.CAD_IFC_OUT) {
      mkdirSync(process.env.CAD_IFC_OUT, { recursive: true });
      writeFileSync(join(process.env.CAD_IFC_OUT, 'walls-psets.ifc'), text);
    }
    const f = parseStep(text);
    const walls = entitiesByType(f, 'IFCWALL');
    expect(walls).toHaveLength(2);
    for (const w of walls) {
      expect(getPsets(f, w).Pset_WallCommon).toEqual({ IsExternal: true, LoadBearing: false, AcousticRating: 'STC 52', FireRating: 'EI 60' });
    }
    // a version 2 session shown in inches still writes mm
    expect(text).toContain('IFCCARTESIANPOINT((5000.,0.))');
    const back = importIfc(text);
    expect(back.layers.find((l) => l.id === 'Walls')!.ifc).toEqual(ifc);
    expect(back).toEqual(session);
    expect(exportIfc(back)).toBe(text);
  });
});
