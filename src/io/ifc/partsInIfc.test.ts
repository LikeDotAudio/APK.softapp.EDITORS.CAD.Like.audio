// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseStep } from '../../vendor/ifc/step';
import { partToDefinition } from '../../flow/bimPart';
import { exportIfc } from './exportIfc';
import { openAnyIfc } from './foreignIfc';
import { partOfType, partsInIfc } from './partsInIfc';
import { partTypeEntity } from './partTypes';
import { refreshBimDefinitions, standInBimDefinitions } from '../../state/actions/refreshBimDefinitions';
import type { SavedSession } from '../browserStorage/SavedSession';
import type { BlockDefinition } from '../../core/types';

const fixture = (name: string) => readFileSync(join(__dirname, 'fixtures', name), 'utf8');
const TYPES = { 'keithley/2400': fixture('keithley--2400.ifc'), 'genelec/8050bpm': fixture('genelec--8050bpm.ifc') };

function sheet(): SavedSession {
  return {
    version: 2, timestamp: 0, units: 'mm', gridSize: 10, snapToGrid: true, shapeMode: false, activeLayerId: '0',
    layers: [{ id: '0', name: '0', color: '#ffffff', visible: true }], tracing: null, docKey: 'road-3709',
    docSnapshot: { vertices: [], edges: [], groupPrimitives: [], groupIntact: [], nextVertexId: 1, nextEdgeId: 1, nextGroupId: 1 },
    schematic: {
      placements: [
        { id: 1, definitionId: 'bim.keithley/2400', at: { x: 0, y: 0 }, layerId: '0', refdes: 'U1' },
        { id: 2, definitionId: 'bim.genelec/8050bpm', at: { x: 400, y: 0 }, layerId: '0', refdes: 'U2' },
        { id: 3, definitionId: 'bim.acme/never-fetched', at: { x: 800, y: 0 }, layerId: '0', refdes: 'U3' },
      ],
      connectors: [], groups: [], nextPlacementId: 4, nextConnectorId: 1, nextGroupId: 1,
      sizes: { 'bim.keithley/2400': { w: 160, h: 120 } },
    } as unknown as SavedSession['schematic'],
  } as SavedSession;
}

describe('ROAD-3709: a drawing reopened from its own .ifc has its BIM blocks\' ports offline', () => {
  it('the part type a BIM part file holds reads back as the part, terminals folded into rows', () => {
    const f = parseStep(TYPES['keithley/2400']);
    const part = partOfType(f, partTypeEntity(f)!)!;
    expect(part.id).toBe('keithley/2400');
    expect(part.ports!.length).toBeGreaterThan(0);
    // one row per APK_Terminal set, every terminal of the file in some row
    const terminals = (TYPES['keithley/2400'].match(/IFCDISTRIBUTIONPORT\(/g) ?? []).length;
    expect(part.ports!.reduce((n, p) => n + (p.count ?? 1), 0)).toBe(terminals);
    expect(partToDefinition(part).ports.length).toBe(terminals);
  });

  it('opened with BIM unreachable: the stand-ins are built from the drawing\'s types, ports and hat; a stub stays a stand-in', async () => {
    const text = exportIfc(sheet(), { types: TYPES });   // acme/never-fetched gets a stub type
    const opened = await openAnyIfc(text, async () => { throw new Error('no engine'); });
    expect(Object.keys(opened.parts ?? {}).sort()).toEqual(['genelec/8050bpm', 'keithley/2400']);
    const model = { definitions: [] as BlockDefinition[], placements: opened.session.schematic!.placements };
    const added = standInBimDefinitions(model, opened.session.schematic!.sizes, opened.parts);
    expect(added.sort()).toEqual(['bim.acme/never-fetched', 'bim.genelec/8050bpm', 'bim.keithley/2400']);
    const def = (id: string) => model.definitions.find((d) => d.id === id)!;
    const k = def('bim.keithley/2400');
    expect(k.ports.map((p) => p.id)).toEqual(partToDefinition(opened.parts!['keithley/2400']!).ports.map((p) => p.id));
    expect(k.ports.length).toBeGreaterThan(0);
    expect(k.hat).toBeTruthy();
    expect(k.size.w).toBeGreaterThanOrEqual(160);   // the saved size is kept as a floor
    expect(def('bim.genelec/8050bpm').ports.length).toBeGreaterThan(0);
    expect(def('bim.acme/never-fetched').ports).toEqual([]);

    // BIM still down: nothing changes, nothing throws
    const store = { schematic: model, requestDraw() {}, emit() {} };
    expect(await refreshBimDefinitions(store, async () => { throw new TypeError('Failed to fetch'); }, added)).toBe(0);
    expect(k.ports.length).toBeGreaterThan(0);

    // BIM answers: the IFC-built ones are rebuilt from it too (not only the stand-in with no hat)
    const asked: string[] = [];
    const n = await refreshBimDefinitions(store, async (url) => {
      asked.push(url);
      const id = decodeURIComponent(url.replace('/api/bim/parts/', ''));
      return new Response(JSON.stringify({ id, name: `${id} live`, ports: [{ group: 'LIVE IN', side: 'input' }] }));
    }, added);
    expect(n).toBe(3);
    expect(asked.sort()).toEqual(['/api/bim/parts/acme/never-fetched', '/api/bim/parts/genelec/8050bpm', '/api/bim/parts/keithley/2400']);
    expect(k.ports.map((p) => p.id)).toEqual(['LIVE_IN']);
  });

  it('a file with no BIM blocks carries no parts', async () => {
    const s = sheet();
    s.schematic!.placements = [];
    const opened = await openAnyIfc(exportIfc(s, { types: TYPES }), async () => { throw new Error('no engine'); });
    expect(opened.parts).toBeUndefined();
    expect(partsInIfc(parseStep(exportIfc(s)))).toEqual({});
  });
});
