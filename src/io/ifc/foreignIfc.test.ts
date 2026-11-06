// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import type { SavedSession } from '../browserStorage/SavedSession';
import { exportIfc } from './exportIfc';
import { importIfc } from './importIfc';
import { ifcOrigin, openAnyIfc, planFromMeshes, type IfcMeshes, type WebIfcEngine } from './foreignIfc';

/**
 * A foreign .ifc goes to web-ifc, ours stays with the codec (ROAD-3598, answer 1).
 * foreign-room.ifc is an IfcOpenShell-written room (scripts/foreignIfcFixture.py);
 * foreign-room.meshes.json is what web-ifc 0.0.78 gave for it through the shared
 * loader's meshes() (the engine's node build; the browser build is the same engine
 * and is rendered headless by scripts/webifc-headless.mjs).
 */
const FIX = join(__dirname, 'fixtures');
const foreign = readFileSync(join(FIX, 'foreign-room.ifc'), 'utf8');
const meshes = JSON.parse(readFileSync(join(FIX, 'foreign-room.meshes.json'), 'utf8')) as IfcMeshes & { bounds: number[] };
const library = readFileSync(join(FIX, 'keithley--2400.ifc'), 'utf8');

const drawing: SavedSession = {
  version: 2, timestamp: Date.UTC(2026, 10, 6), units: 'mm', gridSize: 10, snapToGrid: true, shapeMode: false, activeLayerId: '0', tracing: null,
  layers: [{ id: '0', name: '0', color: '#e5e7eb', visible: true }],
  docSnapshot: {
    vertices: [{ id: 1, x: 0, y: 0 }, { id: 2, x: 1000, y: 0 }], edges: [{ id: 1, v1: 1, v2: 2, groupId: 0, layerId: '0', type: 'line' }],
    groupPrimitives: [], groupIntact: [], nextVertexId: 3, nextEdgeId: 2, nextGroupId: 1,
  },
};

const engineOf = (m: IfcMeshes | Error) => {
  const meshesFn = vi.fn(async () => { if (m instanceof Error) throw m; return m; });
  const engine = vi.fn(async (): Promise<WebIfcEngine> => ({ meshes: meshesFn }));
  return { engine, meshesFn };
};

describe('which reader a file is for', () => {
  it('the CAD\'s own, another APK writer\'s, someone else\'s', () => {
    expect(ifcOrigin(exportIfc(drawing)).origin).toBe('cad');
    expect(ifcOrigin(library).origin).toBe('apk');
    expect(ifcOrigin(foreign).origin).toBe('foreign');
    expect(ifcOrigin('not a step file').origin).toBe('foreign');
  });
});

describe('our own files keep the small codec', () => {
  it('a CAD drawing and a library part never load the engine', async () => {
    for (const text of [exportIfc(drawing), library]) {
      const { engine } = engineOf(meshes);
      const r = await openAnyIfc(text, engine);
      expect(r.via).toBe('codec');
      expect(r.session).toEqual(importIfc(text));
      expect(engine).not.toHaveBeenCalled();
    }
  });
});

describe('a foreign file through web-ifc', () => {
  it('the room\'s meshes as a plan: wall outlines, the slab edge, the rack footprint, in mm', async () => {
    const { engine, meshesFn } = engineOf(meshes);
    const r = await openAnyIfc(foreign, engine);
    expect(engine).toHaveBeenCalledTimes(1);
    expect(meshesFn).toHaveBeenCalledWith(foreign);
    expect(r.via).toBe('web-ifc');
    expect(r.products).toBe(6);
    const s = r.session;
    expect(s.units).toBe('mm');
    expect(s.currentFileName).toBe('Foreign room');
    expect(s.layers.map((l) => l.name).sort()).toEqual(['0', 'IfcAudioVisualAppliance', 'IfcSlab', 'IfcWall']);
    // drawing layers, not IfcWall classification: saving does not call the outlines walls
    expect(s.layers.some((l) => l.ifc)).toBe(false);
    const v = new Map(s.docSnapshot.vertices.map((x) => [x.id, x]));
    const on = (layer: string) => s.docSnapshot.edges.filter((e) => e.layerId === layer).map((e) => [v.get(e.v1)!, v.get(e.v2)!]);
    // every wall is a 200 mm thick rectangle: 4 walls x 4 sides, the top and bottom faces' copies kept once
    const walls = on('IfcWall');
    expect(walls.length).toBe(16);
    for (const [a, b] of walls) {
      const len = Math.hypot(b.x - a.x, b.y - a.y);
      expect([200, 4000, 6000].some((x) => Math.abs(len - x) < 0.2)).toBe(true);
    }
    // the floor's outline, no diagonal across it
    const slab = on('IfcSlab');
    expect(slab.length).toBe(4);
    const xs = slab.flatMap(([a, b]) => [a.x, b.x]), ys = slab.flatMap(([a, b]) => [a.y, b.y]);
    expect([Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)]).toEqual([0, 6000, 0, 4000]);
    // the rack: a 600 x 900 footprint turned 0.3 rad, centred on (4500, 2500)
    const rack = on('IfcAudioVisualAppliance');
    expect(rack.length).toBe(4);
    const cx = rack.reduce((t, [a, b]) => t + a.x + b.x, 0) / 8, cy = rack.reduce((t, [a, b]) => t + a.y + b.y, 0) / 8;
    expect(cx).toBeCloseTo(4500, 0);
    expect(cy).toBeCloseTo(2500, 0);
    expect(rack.map(([a, b]) => Math.round(Math.hypot(b.x - a.x, b.y - a.y))).sort()).toEqual([600, 600, 900, 900]);
  });

  it('without the engine, a foreign file the codec can parse still opens the codec\'s way', async () => {
    const { engine } = engineOf(new Error('the IFC engine loader did not load'));
    const r = await openAnyIfc(foreign, engine);
    expect(r.via).toBe('codec');
    expect(r.session).toEqual(importIfc(foreign));
  });

  it('a file neither can read says the engine\'s reason', async () => {
    const { engine } = engineOf(new Error('web-ifc could not open the file'));
    await expect(openAnyIfc('ISO-10303-21; garbage', engine)).rejects.toThrow(/web-ifc could not open/);
  });

  it('a mesh-less model is not a plan', () => {
    const r = planFromMeshes({ meshes: [] });
    expect(r.edges).toBe(0);
    expect(r.session.docSnapshot.edges).toEqual([]);
  });
});
