// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { describe, expect, it } from 'vitest';
import { createSchematic } from '../../flow/Schematic';
import { hostPicked, pickHost } from '../../flow/hostSelection';
import { Viewport } from '../../viewport/Viewport';
import { hostLineWidth } from '../../render/edges/layerStroke';
import { bimPartOfDrop, placeBimPart } from '@state/actions/dropBimPart';
import type { EditorStore } from '@state/EditorStore';
import { applyHostSchematic, hostPlacementsOf } from './hostSchematic';
import { applyHostSelect, selectionForHost } from './hostWalls';

/*
 * THE OWNER COULD NOT TOUCH THE BLOCKS (2026-11-06). A host block pressed with
 * Select is picked here and named back on `selection`; a host can pick one from
 * its own list (`select` host); `fit` frames around a sash and never below a
 * legible zoom; a part dragged in from the BIM library is placed where it drops.
 */

function fakeStore() {
  const layers = new Map([['0', { id: '0', name: '0', color: '#fff', visible: true }]]);
  const store = {
    schematic: createSchematic([]),
    layers,
    activeLayerId: '0',
    selection: new Set<number>(),
    doc: { edge: () => undefined, blockInstances: new Map() },
    hints: [] as string[],
    addLayer(name: string) { layers.set(name, { id: name, name, color: '#3b82f6', visible: true }); },
    markDocChanged() {},
    requestDraw() {},
    emit() {},
    editFlow(mutate: () => boolean) { return mutate(); },
    showHint(m: string) { store.hints.push(m); },
  };
  return store;
}
const part = { id: 'acme/amp', manufacturer: 'Acme', model: 'Amp', ports: [{ group: 'IN', side: 'input', domain: 'audio' }] };

describe('touching a host\'s blocks', () => {
  it('a pick is drawn and named back by the host\'s own key and ref; a host picks from its list', () => {
    const s = fakeStore();
    applyHostSchematic(s as unknown as EditorStore, { key: 'lib', hash: 'h1', parts: [part],
      placements: [{ ref: 'acme/amp', part: 'acme/amp', at: [0, 0] }, { ref: 'b', part: 'acme/amp', at: [300, 0] }] });
    const [a, b] = s.schematic.placements;
    expect(pickHost(s.schematic, [a!.id])).toBe(true);
    expect(selectionForHost(s as unknown as EditorStore).host).toEqual([{ key: 'lib', ref: 'acme/amp' }]);
    expect(pickHost(s.schematic, [b!.id], true)).toBe(true);
    expect(hostPicked(s.schematic)).toEqual([a!.id, b!.id]);
    applyHostSelect(s as unknown as EditorStore, { edges: [], blocks: [], host: [{ key: 'lib', ref: 'b' }] });
    expect(hostPicked(s.schematic)).toEqual([b!.id]);
    // the host resends its sheet: the old ids are gone, and so is the pick
    applyHostSchematic(s as unknown as EditorStore, { key: 'lib', hash: 'h2', parts: [part], placements: [{ ref: 'b', part: 'acme/amp', at: [0, 0] }] });
    expect(hostPicked(s.schematic)).toEqual([]);
    expect(selectionForHost(s as unknown as EditorStore).host).toBeUndefined();
  });

  it('fit frames the box in what the sash leaves, and never below the least legible zoom', () => {
    const v = new Viewport();
    v.resize(1000, 800);
    v.zoomToFit({ x1: 0, y1: 0, x2: 100, y2: 100 }, { inset: { left: 400 } });
    // centred in the uncovered 600 px, not the whole canvas
    expect(v.toScreen(50, 50).x).toBeCloseTo(700);
    // a tall page that would be unreadable whole: shown from its top-left at minZoom
    v.zoomToFit({ x1: 0, y1: -100000, x2: 1000, y2: 0 }, { inset: { left: 400 }, minZoom: 0.5 });
    expect(v.zoom).toBe(0.5);
    const tl = v.toScreen(0, 0);
    expect(tl.x).toBeGreaterThan(400);
    expect(tl.x).toBeLessThan(500);
    expect(tl.y).toBeGreaterThanOrEqual(0);
    expect(tl.y).toBeLessThan(100);
  });

  it('a layer lineweight thickens and thins host line work in proportion', () => {
    expect(hostLineWidth(undefined, 1.4)).toBe(1.4);
    expect(hostLineWidth({ lineweight: 50 }, 1.4)).toBeCloseTo(2.8);
    expect(hostLineWidth({ lineweight: 13 }, 1.4)).toBeCloseTo(0.728);
    expect(hostLineWidth({ lineweight: 0 }, 1.4)).toBe(0.5);
  });

  it('a part dropped from the BIM library is placed where it was let go', () => {
    const s = fakeStore();
    expect(bimPartOfDrop('not json')).toBeNull();
    const got = bimPartOfDrop(JSON.stringify({ bim: part, ref: { part: part.id } }));
    expect(got?.id).toBe('acme/amp');
    const placed = placeBimPart(s as unknown as EditorStore, got!, { x: 120, y: -40 });
    expect(placed?.at).toEqual({ x: 120, y: -40 });
    expect(s.schematic.definitions.some((d) => d.id === placed!.definitionId)).toBe(true);
    expect(s.hints[0]).toMatch(/Placed/);
  });

  it('geometry says how big each block is drawn: at least its seat, bigger when the part needs it (ROAD-3593)', () => {
    const s = fakeStore();
    const many = { ...part, id: 'acme/desk', ports: Array.from({ length: 40 }, (_, i) => ({ group: `IN ${i}`, side: 'input', domain: 'audio' })) };
    applyHostSchematic(s as unknown as EditorStore, { key: 'sim', hash: 'h', parts: [part, many], placements: [
      { ref: 'small', part: 'acme/amp', at: [0, 0], size: [500, 300] },
      { ref: 'big', part: 'acme/desk', at: [0, 0], size: [10, 10] }] });
    const sizes = Object.fromEntries(hostPlacementsOf(s.schematic).map((p) => [p.ref, p.size]));
    expect(sizes.small).toEqual([500, 300]);
    expect(sizes.big![0]).toBeGreaterThan(10);
    expect(sizes.big![1]).toBeGreaterThan(10);
  });
});
