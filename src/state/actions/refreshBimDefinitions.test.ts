// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { describe, expect, it } from 'vitest';
import type { BlockDefinition } from '../../core/types';
import { refreshBimDefinitions, standInBimDefinitions } from './refreshBimDefinitions';

const PART = { id: 'acme/box', name: 'Box', ports: [{ group: 'IN', side: 'input', connector: 'XLR3-F' }, { group: 'OUT', side: 'output', connector: 'XLR3-M' }] };

describe('ROAD-3689: a reopened drawing gets its BIM blocks back', () => {
  it('a stand-in per missing bim.* definition (saved size, ref), rebuilt from its part', async () => {
    const model = {
      definitions: [{ id: 'flow.source', name: 'Source', size: { w: 1, h: 1 }, glyph: [], ports: [] }] as BlockDefinition[],
      placements: [
        { definitionId: 'bim.acme/box', bimRef: { part: 'acme/box', url: '/api/bim/parts/acme/box', rev: 'r1' } },
        { definitionId: 'bim.acme/box' },
        { definitionId: 'flow.source' },
      ],
    };
    expect(standInBimDefinitions(model, { 'bim.acme/box': { w: 140, h: 80 } })).toEqual(['bim.acme/box']);
    expect(standInBimDefinitions(model)).toEqual([]);   // once
    const def = model.definitions.find((d) => d.id === 'bim.acme/box')!;
    expect(def).toMatchObject({ size: { w: 140, h: 80 }, ports: [], bimRef: { part: 'acme/box' } });
    const store = { schematic: model, requestDraw() {}, emit() {} };
    const n = await refreshBimDefinitions(store, async (url) => {
      expect(url).toBe('/api/bim/parts/acme/box');
      return new Response(JSON.stringify(PART));
    });
    expect(n).toBe(1);
    expect(def.ports.map((p) => p.id)).toEqual(['IN', 'OUT']);
    expect(def.hat).toBeTruthy();
  });
});
