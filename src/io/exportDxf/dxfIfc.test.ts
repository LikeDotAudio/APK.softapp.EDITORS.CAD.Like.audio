// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { Layer } from '../../core/types';
import { Doc } from '../../model/Doc';
import type { SavedSession } from '../browserStorage/SavedSession';
import { exportIfc } from '../ifc/exportIfc';
import { parseStep } from '../../vendor/ifc/step';
import { IFC_DXF_LAYER, ifcDxfBlobs, readIfcDxf } from '../../vendor/ifc/dxf';
import { parseDxf } from '../importDxf/parseDxf';
import { buildDxf } from './buildDxf';

/*
 * ROAD-3598 answer 2: the DXF is still the drawing, and every object of the drawing's
 * model (its .ifc twin) rides on the hidden APK_IFC layer (apk-ifc-dxf/1,
 * src/vendor/ifc/dxf.ts). `CAD_IFC_OUT=<dir>` writes the DXF there too, for ezdxf.
 */

const LAYERS: Layer[] = [
  { id: '0', name: '0', color: '#ffffff', visible: true },
  { id: 'Devices', name: 'Devices', color: '#ef4444', visible: true },
];

function session(): { s: SavedSession; doc: Doc } {
  const doc = new Doc();
  doc.addLine({ x: 0, y: 0 }, { x: 4000, y: 0 }, 0, '0');
  doc.addLine({ x: 4000, y: 0 }, { x: 4000, y: 3000 }, 0, '0');
  doc.addText('Rack A', 500, 2500, 120, 0, '0');
  const s: SavedSession = {
    version: 2,
    timestamp: Date.UTC(2026, 10, 6, 12, 0, 0),
    docSnapshot: doc.snapshot(),
    currentFileName: 'rack-a.dxf',
    units: 'mm',
    gridSize: 10,
    gridMode: 'dots',
    snapToGrid: true,
    shapeMode: false,
    activeLayerId: '0',
    layers: LAYERS.map((l) => ({ ...l })),
    tracing: null,
    docKey: '1a2b3c4d-0000-4000-8000-0000000d0f00',
    schematic: {
      placements: [
        { id: 1, definitionId: 'bim.keithley/2400', at: { x: 1000, y: 1000 }, layerId: 'Devices', refdes: 'SMU1', serial: '4084512' },
        { id: 2, definitionId: 'bim.genelec/8050bpm', at: { x: 2500, y: 1500 }, rotation: 90, layerId: 'Devices', refdes: 'SPK-L' },
      ],
      connectors: [],
      groups: [],
      nextPlacementId: 3,
      nextConnectorId: 1,
      nextGroupId: 1,
    },
  } as SavedSession;
  return { s, doc };
}

describe('the DXF carries the model on the hidden APK_IFC layer', () => {
  const { s, doc } = session();
  const ifc = exportIfc(s);
  const plain = buildDxf(doc, 'mm', LAYERS);
  const dxf = buildDxf(doc, 'mm', LAYERS, undefined, ifc);
  if (process.env.CAD_IFC_OUT) {
    mkdirSync(process.env.CAD_IFC_OUT, { recursive: true });
    writeFileSync(join(process.env.CAD_IFC_OUT, 'rack-a.dxf'), dxf);
    writeFileSync(join(process.env.CAD_IFC_OUT, 'rack-a.ifc'), ifc);
  }

  it('without a model the DXF is byte for byte what it was', () => {
    expect(buildDxf(doc, 'mm', LAYERS, undefined)).toBe(plain);
    expect(plain).not.toContain(IFC_DXF_LAYER);
  });

  it('every object of the .ifc twin reads back out of the DXF, GlobalId, entity, psets and STEP line', () => {
    const back = readIfcDxf(dxf);
    const want = ifcDxfBlobs(ifc);
    expect(back.length).toBe(want.length);
    expect(back.map((b) => b.guid)).toEqual(want.map((b) => b.guid));
    const file = parseStep(ifc);
    for (const b of back) {
      const e = file.entities.find((x) => x.args[0] === b.guid)!;
      expect(e.type).toBe(b.ifc);
      expect(ifc).toContain(b.step!);
    }
    // the placed devices are there (occurrences, beside their sheet symbols), each at its placement
    const devices = back.filter((b) => (b.name === 'SMU1' || b.name === 'SPK-L') && b.ifc !== 'IFCANNOTATION');
    expect(devices.map((b) => b.name).sort()).toEqual(['SMU1', 'SPK-L']);
    const smu = devices.find((b) => b.name === 'SMU1')!;
    expect(smu.at).toEqual({ x: 1000, y: 1000 });
  });

  it('the layer is declared frozen and off, and the drawing itself is unchanged for a reader', () => {
    const layer = /  0\nLAYER\n(?:(?!  0\n)[\s\S])*?  2\nAPK_IFC\n(?:(?!  0\n)[\s\S])*/.exec(dxf)?.[0] ?? '';
    expect(layer).toMatch(/ 70\n1\n/);
    expect(layer).toMatch(/ 62\n-8\n/);
    expect(layer).toMatch(/290\n0\n/);
    const a = parseDxf(plain);
    const b = parseDxf(dxf);
    // the CAD's own reader skips the carrier POINTs and sees the same sheet
    expect(b.skipped).toEqual({ ...a.skipped, POINT: readIfcDxf(dxf).length });
    expect(b.entities).toEqual(a.entities);
    expect(b.blocks).toEqual(a.blocks);
    expect(b.layers.filter((l) => l.name !== IFC_DXF_LAYER)).toEqual(a.layers);
  });
});
