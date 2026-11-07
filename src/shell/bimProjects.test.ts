// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { describe, expect, it } from 'vitest';
import type { BlockPlacement } from '../core/types';
import { currentSheet, diffOccurrences, dragPayload, importBody, libraryEndpoints, occurrencesOn } from './bimProjects';
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
