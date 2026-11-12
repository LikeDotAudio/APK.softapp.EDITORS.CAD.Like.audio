// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { describe, expect, it } from 'vitest';
import type { BlockPlacement } from '../core/types';
import { currentSheet, diffOccurrences, dragPayload, importBody, installInstancePortsSync, libraryEndpoints, occurrencesOn, portWrites } from './bimProjects';
import { bimPartOfDrop, occurrenceOfDrop } from '../state/actions/dropBimPart';

const occ = (instance: string) => ({ project: 'stadium', instance, globalId: `G-${instance}` });
const pl = (id: number, instance?: string): BlockPlacement =>
  ({ id, definitionId: 'bim.acme/mixer-8', at: { x: 0, y: 0 }, layerId: '0', ...(instance ? { occurrence: occ(instance) } : {}) });

describe('ROAD-3577 project palette', () => {
  it('a palette row drags its part, ref and occurrence; a library row only its part', () => {
    const row = { bim: { id: 'acme/mixer-8', name: 'Mixer' }, ref: { part: 'acme/mixer-8', url: '/api/bim/parts/acme/mixer-8', rev: 'r' }, occurrence: occ('D1') };
    const text = dragPayload(row);
    expect(bimPartOfDrop(text)?.ref?.part).toBe('acme/mixer-8');
    expect(occurrenceOfDrop(text)).toEqual(occ('D1'));
    expect(occurrenceOfDrop(dragPayload({ bim: row.bim, ref: row.ref }))).toBeNull();
  });

  it('placed and removed occurrences are what moved, by GlobalId', () => {
    const before = occurrencesOn([pl(1, 'D1'), pl(2, 'D2'), pl(3)]);
    expect([...before.keys()]).toEqual(['G-D1', 'G-D2']);
    const { placed, removed } = diffOccurrences(before, occurrencesOn([pl(2, 'D2'), pl(4, 'D3')]));
    expect(placed.map((p) => p.occurrence!.instance)).toEqual(['D3']);
    expect(removed.map((p) => p.occurrence!.instance)).toEqual(['D1']);
  });

  it('the sheet, the socket and an import body', () => {
    expect(currentSheet({ activeViewportId: 'ALL', viewports: [] })).toBe('Model');
    expect(currentSheet({ activeViewportId: 'v2', viewports: [{ id: 'v2', name: 'Sheet A1' }] })).toBe('Sheet A1');
    expect(libraryEndpoints('http://bench:8160/library')).toEqual({ api: 'http://bench:8160/api/bim', socket: 'ws://bench:8160/library/ws' });
    expect(libraryEndpoints('https://apk.local/library/').socket).toBe('wss://apk.local/library/ws');
    expect(importBody('rig.csv', 'make,model\n', 'rig')).toEqual({ name: 'rig', source: 'rig.csv', csv: 'make,model\n' });
    expect(importBody('rig.json', '[{"make":"a"}]', 'rig').devices).toEqual([{ make: 'a' }]);
  });
});

describe('ROAD-3688 an occurrence\'s own ports written back to BIM', () => {
  const own = (p: BlockPlacement, conn: Record<string, string>) => ({ ...p, portConnectors: conn });

  it('on open only those with own ports; after, every change (back to none included); never one taken off', () => {
    const first = portWrites(null, [own(pl(1, 'D1'), { R0: 'DANTE-RX2' }), pl(2, 'D2'), pl(3)]);
    expect(first.writes.map((w) => [w.occ.instance, w.body])).toEqual([['D1', { ports: [], port_connectors: { R0: 'DANTE-RX2' } }]]);
    const same = portWrites(first.seen, [own(pl(1, 'D1'), { R0: 'DANTE-RX2' }), pl(2, 'D2')]);
    expect(same.writes).toEqual([]);
    const port = { id: 'RECEIVER_1', side: 'input' as const, connector: 'DANTE-RX2' };
    const next = portWrites(same.seen, [pl(1, 'D1'), { ...pl(2, 'D2'), ports: [port] }]);
    expect(next.writes.map((w) => [w.occ.instance, w.body])).toEqual([
      ['D1', { ports: [], port_connectors: {} }], ['D2', { ports: [port], port_connectors: {} }]]);
    expect(portWrites(next.seen, []).writes).toEqual([]);
  });

  it('the sync PUTs /projects/<p>/instances/<i>/ports through the gateway, debounced', async () => {
    const calls: Array<[string, RequestInit | undefined]> = [];
    const f = (async (url: string, init?: RequestInit) => { calls.push([url, init]); return new Response('{}', { status: 200 }); }) as unknown as typeof fetch;
    const listeners = new Set<() => void>();
    const store = {
      currentFileName: 'FOH.dxf', schematic: { placements: [pl(1, 'D1')] }, hints: [] as string[],
      subscribe(fn: () => void) { listeners.add(fn); return () => listeners.delete(fn); },
      showHint(t: string) { this.hints.push(t); },
    };
    const off = installInstancePortsSync(store, f, 0, () => 'http://gw/api/bim');
    expect(calls).toEqual([]);
    store.schematic.placements = [own(pl(1, 'D1'), { R0: 'DANTE-RX2' })];
    listeners.forEach((fn) => fn());
    await new Promise((r) => setTimeout(r, 5));
    expect(calls).toHaveLength(1);
    expect(calls[0]![0]).toMatch(/\/api\/bim\/projects\/stadium\/instances\/D1\/ports$/);
    expect(calls[0]![1]).toMatchObject({ method: 'PUT' });
    expect(JSON.parse(String(calls[0]![1]!.body))).toEqual({ ports: [], port_connectors: { R0: 'DANTE-RX2' } });
    off();
  });
});
