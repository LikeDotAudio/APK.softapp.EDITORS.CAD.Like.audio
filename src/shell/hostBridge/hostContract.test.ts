// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { describe, expect, it } from 'vitest';
import schema from '../../../contract/host@1/host.schema.json';
import samples from '../../../contract/host@1/samples.json';
// @ts-expect-error — plain JS shipped with the contract, no .d.ts on purpose (hosts vendor it as-is)
import { messageTypes, validateMessage } from '../../../contract/validate.mjs';
import type { Layer } from '../../core/types';
import { Doc } from '../../model/Doc';
import { addPaletteFill } from '../../model/palette/addPaletteFill';
import { parsePalette } from '../../model/palette/parsePalette';
import { placePaletteBlock } from '../../model/palette/placePaletteBlock';
import type { EditorStore } from '@state/EditorStore';
import { geometryForHost, HOST_HANDLERS, HOST_OUTBOUND_TYPES, HOST_PROTOCOL, mirrorForHost, viewForHost } from './hostBridge';
import { parseHostSpaces } from './hostSpaces';
import { applyHostLayers, applyHostSelect, applyHostWalls, selectionForHost } from './hostWalls';

/*
 * The SUPPLIER side of the published contract (contract/host@1/). A host —
 * EDITORS.Acoustic.Like.audio — vendors that directory and runs the same
 * samples against cadLink.js; this file proves THIS side matches it, so a
 * renamed field fails here before it breaks an overlay in a browser.
 */

type Msg = { protocol: string; type: string; [k: string]: unknown };
const toCad = samples.toCad as Msg[];
const toHost = samples.toHost as Msg[];
const sampleOf = (list: Msg[], type: string) => list.find((m) => m.type === type)!;
const wrap = (type: string, body: object) => ({ protocol: HOST_PROTOCOL, type, ...body });

describe('cad.like.audio/host@1 — the published schema is this bridge', () => {
  it('names the protocol this bridge speaks', () => {
    expect(schema['x-protocol']).toBe(HOST_PROTOCOL);
    expect(schema.title).toBe(HOST_PROTOCOL);
  });

  it('lists exactly the messages the bridge answers, and exactly the ones it sends', () => {
    expect(messageTypes(schema, 'toCad')).toEqual(Object.keys(HOST_HANDLERS).sort());
    expect(messageTypes(schema, 'toHost')).toEqual([...HOST_OUTBOUND_TYPES].sort());
  });

  it('carries one valid sample of every message, both ways', () => {
    expect(toCad.map((m) => m.type).sort()).toEqual(messageTypes(schema, 'toCad'));
    expect(toHost.map((m) => m.type).sort()).toEqual(messageTypes(schema, 'toHost'));
    for (const m of toCad) expect(validateMessage(schema, 'toCad', m), m.type).toEqual([]);
    for (const m of toHost) expect(validateMessage(schema, 'toHost', m), m.type).toEqual([]);
  });

  it('refuses a message with a renamed field or an unknown type', () => {
    const { patches, ...rest } = sampleOf(toHost, 'geometry');
    expect(validateMessage(schema, 'toHost', { ...rest, patchList: patches })).toContain('$: missing "patches"');
    expect(validateMessage(schema, 'toCad', wrap('teleport', {}))[0]).toMatch(/not a toCad message/);
  });
});

describe('cad.like.audio/host@1 — what this side really emits validates', () => {
  const layers = new Map<string, Layer>([
    ['0', { id: '0', name: '0', color: '#ffffff', visible: true }],
    ['Furniture', { id: 'Furniture', name: 'Furniture', color: '#fde047', visible: true, finish: 'carpet' }],
  ]);
  const carpet = { id: 'carpet', name: 'Carpet', category: 'Floor', color: '#884422' };
  const panel = { id: 'abs-1200', name: 'Absorber', category: 'Absorber', color: '#336699', size: [1.2, 0.6] as [number, number] };

  function store() {
    const doc = new Doc();
    const pts = [{ x: 0, y: 0 }, { x: 6000, y: 0 }, { x: 6000, y: 4500 }, { x: 0, y: 4500 }];
    pts.forEach((p, i) => doc.addLine(p, pts[(i + 1) % 4]!, 0, '0'));
    addPaletteFill(doc, carpet, pts, '0');
    const block = placePaletteBlock(doc, panel, 'mm', { x: 3000, y: 1800 }, 90, 'Furniture');
    return {
      doc,
      layers,
      units: 'mm' as const,
      currentFileName: 'Studio A.cad',
      view: { zoom: 0.12, panX: 40, panY: -12 },
      mirror: { enabled: true, x: 3000, mirrors: [{ x: 3000 }] },
      selection: new Set<number>([1, ...(typeof block === 'number' ? [block] : [])]),
    } as unknown as EditorStore;
  }

  it('geometry (sceneForHost + marks)', () => {
    const g = wrap('geometry', geometryForHost(store(), []));
    expect(validateMessage(schema, 'toHost', g)).toEqual([]);
    expect((g as unknown as { patches: unknown[] }).patches.length).toBeGreaterThan(0);
  });

  it('view, mirror and selection', () => {
    const s = store();
    expect(validateMessage(schema, 'toHost', wrap('view', viewForHost(s, { left: 0, top: 32, width: 1280, height: 800 })))).toEqual([]);
    expect(validateMessage(schema, 'toHost', wrap('mirror', mirrorForHost(s)))).toEqual([]);
    expect(validateMessage(schema, 'toHost', wrap('selection', selectionForHost(s)))).toEqual([]);
  });
});

describe('cad.like.audio/host@1 — the published samples are understood here', () => {
  it('palette: every sample item is kept, sized items as blocks', () => {
    const p = parsePalette(sampleOf(toCad, 'palette'))!;
    expect(p.items.map((i) => i.id)).toEqual(['carpet-heavy', 'panel-1200x600']);
    expect(p.items[1]!.size).toEqual([1.2, 0.6]);
  });

  it('spaces: the sample window onto the sheet is read', () => {
    expect(parseHostSpaces(sampleOf(toCad, 'spaces') as { items?: unknown })).toHaveLength(1);
  });

  it('layers, select and walls act on a sheet the samples name', () => {
    const doc = new Doc();
    const pts = [{ x: 0, y: 0 }, { x: 6000, y: 0 }, { x: 6000, y: 4500 }, { x: 0, y: 4500 }];
    pts.forEach((p, i) => doc.addLine(p, pts[(i + 1) % 4]!, 0, '0'));
    const ls = new Map([
      ['0', { id: '0', name: '0', color: '#fff', visible: true }],
      ['Blow-up', { id: 'Blow-up', name: 'Blow-up', color: '#fff', visible: true }],
    ]);
    doc.layerHidden = (id) => ls.get(id)?.visible === false;
    const s = {
      doc, layers: ls, activeLayerId: '0', selection: new Set<number>(),
      history: { push() {} }, markDocChanged() {}, requestDraw() {}, emit() {},
    } as unknown as EditorStore;
    expect(applyHostLayers(s, sampleOf(toCad, 'layers'))).toBe(true);
    expect(ls.get('Blow-up')!.visible).toBe(false);
    applyHostSelect(s, sampleOf(toCad, 'select'));
    expect([...s.selection].sort()).toEqual([1, 2]);
    expect(applyHostWalls(s, sampleOf(toCad, 'walls'))).toBe(true);
  });
});
