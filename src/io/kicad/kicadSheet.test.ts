// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { partToDefinition, type BimPart } from '../../flow/bimPart';
import { connectPorts, createSchematic, placeBlock } from '../../flow/Schematic';
import { klcCheck } from '../../vendor/kicad/kicadLibrary.js';
import { symbolFromPart } from '../../vendor/kicad/kicadLibrary.js';
import { KICAD_PER_CAD, kicadProject, partOfDefinition } from './kicadSheet';
import { resolveHostConnections } from '../../shell/hostBridge/hostSchematic';

/* The Meyer Sound 09.314.001.01 as the BIM library gives it (DATABASE.server.BIM library/meyer-sound). */
const MEYER: BimPart = {
  id: 'meyer-sound/09-314-001-01', manufacturer: 'Meyer Sound', model: '09.314.001.01', name: 'Meyer Sound 09.314.001.01',
  description: 'Eight-channel IntelligentDC power supply and audio distribution unit for Meyer Sound loudspeakers; North America variant.',
  category: 'Audio', class: 'Audio', stage: 'seeded',
  ports: [
    { group: 'NETWORK', block: 'Networking-Control', side: 'input', connector: 'RJ45', domain: 'network', count: 1 },
    { group: 'AUDIO INPUT 1–8', block: 'Audio Analog', side: 'input', connector: 'DSUB-25-F', domain: 'audio', count: 8, labels: ['CH-1', 'CH-2', 'CH-3', 'CH-4', 'CH-5', 'CH-6', 'CH-7', 'CH-8'] },
    { group: 'AUDIO THRU 1–8', block: 'Audio Analog', side: 'output', connector: 'DSUB-25-F', domain: 'audio', count: 8, labels: ['THRU-1', 'THRU-2', 'THRU-3', 'THRU-4', 'THRU-5', 'THRU-6', 'THRU-7', 'THRU-8'] },
    { group: 'AC MAINS', block: 'Power', side: 'input', connector: 'IEC-C14', domain: 'power', count: 1 },
  ],
};

function sheet() {
  const def = partToDefinition(MEYER, { part: MEYER.id, url: '', rev: '' });
  const model = createSchematic([def]);
  const a = placeBlock(model, def.id, { x: 0, y: 0 }, '0', 'U8')!;
  const b = placeBlock(model, def.id, { x: 400, y: 0 }, '0', 'U9')!;
  const thru1 = def.ports.find((p) => p.label?.includes('THRU-1'))!.id;
  const in1 = def.ports.filter((p) => p.side === 'input')[1]!.id;
  connectPorts(model, { placementId: a.id, portId: thru1 }, { placementId: b.id, portId: in1 });
  return { model, def, thru1, in1 };
}

describe('the sheet as a KiCad project', () => {
  it('a BIM block definition becomes a KLC symbol with one pin per CAD port, in order', () => {
    const def = partToDefinition(MEYER);
    const part = partOfDefinition(def);
    expect(part.id).toBe(MEYER.id);
    expect(part.manufacturer).toBe('Meyer Sound');
    expect(part.model).toBe('09.314.001.01');
    const sym = symbolFromPart(part);
    expect(sym.pins.length).toBe(def.ports.length);
    expect(sym.pins.map((p) => p.number)).toEqual(def.ports.map((_, i) => String(i + 1)));
    expect(klcCheck(sym).filter((f) => f.level !== 'info')).toEqual([]);
  });

  it('writes the sheet, a library per KLC library name, and a sym-lib-table', () => {
    const { model } = sheet();
    const p = kicadProject(model, 'bench');
    expect(Object.keys(p.files).sort()).toEqual(['bench.kicad_pro', 'bench.kicad_sch', 'bench.kicad_sym', 'sym-lib-table']);
    expect(p.placed).toBe(2);
    expect(p.nets).toBe(1);
    expect(p.skipped).toEqual([]);
    const sch = p.files['bench.kicad_sch']!;
    expect(sch).toMatch(/\(version 20250114\)/);
    expect(sch).toContain('(lib_id "bench:09.314.001.01")');
    expect(sch).toContain('(reference "U8")');
    expect(sch).toContain('(label "U8_THRU-1"');
    expect(p.files['bench.kicad_sym']).toContain('(name "AC_MAINS"');
    expect(p.files['sym-lib-table']).toContain('${KIPRJMOD}/bench.kicad_sym');
    expect(KICAD_PER_CAD).toBeCloseTo(0.254);
    // the same sheet writes the same bytes
    expect(kicadProject(model, 'bench').files['bench.kicad_sch']).toBe(sch);
    if (process.env.KICAD_OUT) {
      mkdirSync(process.env.KICAD_OUT, { recursive: true });
      for (const [f, t] of Object.entries(p.files)) writeFileSync(join(process.env.KICAD_OUT, f), t);
    }
  });

  it('a wire\'s label names its net', () => {
    const { model } = sheet();
    model.connectors[0]!.label = 'FOH LEFT';
    expect(kicadProject(model, 'bench').files['bench.kicad_sch']).toContain('(label "FOH_LEFT"');
  });

  it('a host\'s own wires (the Simulation\'s routes) join the nets, found by ref and terminal', () => {
    const { model, def } = sheet();
    model.connectors.length = 0;
    model.placements[0]!.hostRef = 'U8';
    model.placements[1]!.hostRef = 'U9';
    const thru = def.ports.find((p) => p.label?.includes('THRU-2'))!.label!;
    const into = def.ports.filter((p) => p.side === 'input')[2]!.label!;
    const extra = resolveHostConnections(model, [
      { a: { ref: 'U8', terminal: thru }, b: { ref: 'U9', terminal: into }, label: 'MON 2' },
      { a: { ref: 'U8', terminal: thru }, b: { ref: 'NOWHERE', terminal: into } },
    ]);
    expect(extra.length).toBe(1);
    const p = kicadProject(model, 'bench', { connections: extra });
    expect(p.nets).toBe(1);
    expect(p.files['bench.kicad_sch']).toContain('(label "MON_2"');
  });
});
