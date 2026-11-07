// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { BlockPlacement } from '../core/types';
import type { EditorStore } from '@state/EditorStore';
import { Doc } from '../model/Doc';
import type { SavedSession } from '../io/browserStorage/SavedSession';
import { exportIfc } from '../io/ifc/exportIfc';
import { importIfc } from '../io/ifc/importIfc';
import { applyHostSchematic } from '../shell/hostBridge/hostSchematic';
import { placeBimPart, bimPartOfDrop } from '../state/actions/dropBimPart';
import { ifcGuid } from '../vendor/ifc/guid';
import { entitiesByType, getPsets, parseStep, type StepValue } from '../vendor/ifc/step';
import { createSchematic } from './Schematic';
import { withGlobalId } from './bimPart';

/*
 * ROAD-3576: the library's ref carries the part's IFC type GlobalId (DATABASE.server.BIM
 * part.ref → ifc.guid('part', <id>)), whatever is placed from a pick or a drop stores it, and
 * the placed element resolves back to BIM — by url, and in the drawing's IFC by the type its
 * occurrence is typed by. One GlobalId rule: the fixture is BIM's own .ifc twin of the part.
 */

const fixture = (name: string) => readFileSync(join(__dirname, '../io/ifc/fixtures', name), 'utf8');
const PART = 'keithley/2400';
/** what DATABASE.server.BIM answers today for keithley/2400 (python3 -c "from bim import part; print(part.global_id('keithley/2400'))") */
const BIM_GID = '3YEEVTh25N6g7DS0SNAr5a';
const SMU = { id: PART, manufacturer: 'Keithley', model: '2400', ports: [{ group: 'INPUT/OUTPUT HI', side: 'input', domain: 'signal' }] };
const LIVE = { bim: SMU, ref: { part: PART, url: 'http://apk.local:8160/api/bim/parts/keithley/2400', rev: '0123456789abcdef', globalId: BIM_GID, source: 'live' } };

function store() {
  const s = {
    schematic: createSchematic([]), activeLayerId: '0', changes: 0, hints: [] as string[],
    layers: new Map([['0', { id: '0', name: '0', color: '#fff', visible: true }]]),
    editFlow(fn: () => boolean) { if (fn()) s.changes++; },
    showHint(t: string) { s.hints.push(t); },
    addLayer(name: string) { s.layers.set(name, { id: name, name, color: '#fff', visible: true }); },
    markDocChanged() {}, requestDraw() {}, emit() {},
  };
  return s;
}

function session(placements: BlockPlacement[], defs = createSchematic([]).definitions): SavedSession {
  return {
    version: 2, timestamp: Date.UTC(2026, 10, 6), docSnapshot: new Doc().snapshot(), currentFileName: 'pick.dxf', units: 'mm',
    gridSize: 10, gridMode: 'dots', snapToGrid: true, shapeMode: false, activeLayerId: '0',
    layers: [{ id: '0', name: '0', color: '#ffffff', visible: true }], tracing: null, docKey: '1a2b3c4d-0000-4000-8000-0000000003576',
    schematic: { ...createSchematic([]), definitions: defs, placements, nextPlacementId: placements.length + 1 },
  } as unknown as SavedSession;
}

describe('a placed element resolves back to BIM (ROAD-3576)', () => {
  it('the one GlobalId rule: what BIM sends is the part\'s IFC type id, and the CAD derives the same', () => {
    expect(ifcGuid('part', PART)).toBe(BIM_GID);
    expect(fixture('keithley--2400.ifc')).toContain(`TYPE('${BIM_GID}'`);
    expect(withGlobalId({ part: PART, url: '/api/bim/parts/keithley/2400', rev: '' }).globalId).toBe(BIM_GID);
  });

  it('a drop of application/x-apk-bim stores the ref, GlobalId and all, on the placement', () => {
    const s = store();
    const p = placeBimPart(s as unknown as EditorStore, bimPartOfDrop(JSON.stringify(LIVE))!, { x: 100, y: 50 })!;
    expect(p.bimRef).toEqual({ part: PART, url: LIVE.ref.url, rev: LIVE.ref.rev, globalId: BIM_GID });
  });

  it('a ref without one (an old snapshot, a saved drawing\'s block) gets it by the same rule', () => {
    const s = store();
    const old = { bim: SMU, ref: { part: PART, url: 'https://apk.audio/OS/system/bim/library/test-measurement.json#keithley/2400', rev: 'r1' } };
    const p = placeBimPart(s as unknown as EditorStore, bimPartOfDrop(JSON.stringify(old))!, { x: 0, y: 0 })!;
    expect(p.bimRef?.globalId).toBe(BIM_GID);
    // a definition stored before ROAD-3576 still places a resolvable element
    const def = s.schematic.definitions[0]!;
    delete def.bimRef!.globalId;
    const again = placeBimPart(s as unknown as EditorStore, SMU, { x: 200, y: 0 })!;
    expect(again.bimRef?.globalId).toBe(BIM_GID);
  });

  it('a host@1 box (the Simulation\'s) whose part came with its ref stores it too', () => {
    const s = store();
    applyHostSchematic(s as unknown as EditorStore, {
      key: 'simulation', hash: 'h1', parts: [{ ...SMU, ref: { part: PART, url: '/api/bim/parts/keithley/2400', rev: 'r2' } }, { id: 'simulation/x1', ports: [] }],
      placements: [{ ref: 'U1', part: PART, at: [0, 0] }, { ref: 'X1', part: 'simulation/x1', at: [100, 0] }],
    } as never);
    const [u1, x1] = s.schematic.placements;
    expect(u1!.bimRef).toEqual({ part: PART, url: '/api/bim/parts/keithley/2400', rev: 'r2', globalId: BIM_GID });
    expect(x1!.bimRef, 'a hand-declared part with no ref claims no BIM record').toBeUndefined();
  });

  it('in the drawing\'s IFC the placement\'s occurrence is typed by that GlobalId, and the ref comes back', () => {
    const s = store();
    const p = placeBimPart(s as unknown as EditorStore, bimPartOfDrop(JSON.stringify(LIVE))!, { x: 100, y: 50 })!;
    const saved = session(s.schematic.placements, s.schematic.definitions);
    for (const types of [{ [PART]: fixture('keithley--2400.ifc') }, undefined]) {   // with BIM's twin, and a stub
      const text = exportIfc(saved, types ? { types } : {});
      const f = parseStep(text);
      const rel = entitiesByType(f, 'IFCRELDEFINESBYTYPE')[0]!;
      const typeOf = f.byId.get((rel.args[5] as { id: number }).id)!;
      expect(typeOf.args[0], 'the occurrence\'s type is the part, by BIM\'s GlobalId').toBe(p.bimRef!.globalId);
      const occ = f.byId.get(((rel.args[4] as StepValue[])[0] as { id: number }).id)!;
      expect(occ.args[0]).not.toBe(p.bimRef!.globalId);   // the occurrence has its own id; the ref is the type's
      expect(JSON.parse(String(getPsets(f, occ).APK_Placement!.BimRef))).toEqual(p.bimRef);
      expect(importIfc(text).schematic!.placements[0]!.bimRef).toEqual(p.bimRef);
    }
  });
});
