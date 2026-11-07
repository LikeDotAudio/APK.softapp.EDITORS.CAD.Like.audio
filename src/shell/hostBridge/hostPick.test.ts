// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { describe, expect, it } from 'vitest';
import schema from '../../../contract/host@1/host.schema.json';
// @ts-expect-error — plain JS shipped with the contract, no .d.ts on purpose
import { validateMessage } from '../../../contract/validate.mjs';
import { Doc } from '../../model/Doc';
import { Viewport } from '../../viewport/Viewport';
import { dxfForHost, dxfForHostWithIfc, pickForHost } from './hostPick';
import { EditorStore } from '@state/EditorStore';
import { IFC_DXF_LAYER, readIfcDxf } from '../../vendor/ifc/dxf';
import { HOST_PROTOCOL } from './hostBridge';

describe('pick: a click on the sheet says where it landed, in drawing units', () => {
  it('maps client pixels through the view, and validates as toHost.pick', () => {
    const view = new Viewport();
    view.zoom = 2;
    view.panX = 100;
    view.panY = 300;
    const body = pickForHost({ view, tool: { id: 'select' } as never }, { left: 10, top: 20 },
      { clientX: 210, clientY: 120, shiftKey: true, ctrlKey: false, metaKey: true }, 2);
    expect(body.at).toEqual([50, 100]);
    expect(body).toMatchObject({ count: 2, tool: 'select', shift: true, ctrl: true, client: [210, 120] });
    expect(validateMessage(schema, 'toHost', { protocol: HOST_PROTOCOL, type: 'pick', ...body })).toEqual([]);
  });
});

describe('dxf: the sheet as Download DXF writes it', () => {
  it('carries a DXF text and a file name, and validates as toHost.dxf', () => {
    const doc = new Doc();
    doc.addLine({ x: 0, y: 0 }, { x: 1000, y: 0 }, 0, '0');
    const body = dxfForHost({ doc, units: 'mm', layers: new Map(), schematic: undefined as never, currentFileName: 'Simulation — Bench' });
    expect(body.text).toContain('SECTION');
    expect(body.text.trim().endsWith('EOF')).toBe(true);
    expect(body.fileName).toMatch(/\.dxf$/);
    expect(validateMessage(schema, 'toHost', { protocol: HOST_PROTOCOL, type: 'dxf', ...body })).toEqual([]);
  });
});

describe('dxf: a host hand-off carries the drawing\'s IFC on the hidden layer (ROAD-3598 answer 2)', () => {
  it('answers with the same .ifc Save Model writes, on APK_IFC, and still validates as toHost.dxf', async () => {
    const store = new EditorStore();
    store.doc.addLine({ x: 0, y: 0 }, { x: 254, y: 0 });
    store.doc.addLine({ x: 254, y: 0 }, { x: 254, y: 127 });
    const body = await dxfForHostWithIfc(store);
    expect(body.text).toContain(IFC_DXF_LAYER);
    const blobs = readIfcDxf(body.text);
    expect(blobs.length).toBeGreaterThan(0);
    expect(blobs.some((b) => /IFCPROJECT/.test(JSON.stringify(b)))).toBe(true);
    expect(body.text.trim().endsWith('EOF')).toBe(true);
    expect(validateMessage(schema, 'toHost', { protocol: HOST_PROTOCOL, type: 'dxf', ...body })).toEqual([]);
    // the plain writer is the drawing alone
    expect(dxfForHost(store).text).not.toContain(IFC_DXF_LAYER);
  });
});

describe('tool: a host puts a tool in the hand', () => {
  it('sets a tool the editor has, and ignores one it does not', async () => {
    const { applyHostTool } = await import('./hostPick');
    const set: string[] = [];
    const store = { setTool: (id: string) => void set.push(id) } as never;
    expect(applyHostTool(store, { id: 'select' })).toBe(true);
    expect(applyHostTool(store, { id: 'teleport' })).toBe(false);
    expect(applyHostTool(store, {})).toBe(false);
    expect(set).toEqual(['select']);
  });
});
