// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { describe, expect, it } from 'vitest';
import { Doc } from '../Doc';
import { reflectAcrossMirror } from './reflectAcrossMirror';
import { mirrorNewlyAddedEntities } from './mirrorNewlyAddedEntities';

describe('reflectAcrossMirror', () => {
  it('mirrors a line horizontally across a vertical mirror line at x=0', () => {
    const doc = new Doc();
    // Add line from (10, 5) to (20, 15)
    const lineId = doc.addLine({ x: 10, y: 5 }, { x: 20, y: 15 });
    expect(lineId).not.toBeNull();

    // Mirror across x = 0: (10, 5) -> (-10, 5), (20, 15) -> (-20, 15)
    const result = reflectAcrossMirror(doc, [lineId!], 0);
    expect(result.edgeIds.length).toBe(1);

    const reflectedEdge = doc.edge(result.edgeIds[0]);
    expect(reflectedEdge).toBeDefined();

    const [v1, v2] = doc.endpointsOf(reflectedEdge!);
    expect(v1.x).toBeCloseTo(-10);
    expect(v1.y).toBeCloseTo(5);
    expect(v2.x).toBeCloseTo(-20);
    expect(v2.y).toBeCloseTo(15);
  });

  it('mirrors a line horizontally across an arbitrary mirror line at x=50', () => {
    const doc = new Doc();
    // Add line from (30, 10) to (40, 20)
    // Distance to mirror: 30 is 20 units left -> reflected should be 50 + 20 = 70
    // 40 is 10 units left -> reflected should be 50 + 10 = 60
    const lineId = doc.addLine({ x: 30, y: 10 }, { x: 40, y: 20 });
    const result = reflectAcrossMirror(doc, [lineId!], 50);
    expect(result.edgeIds.length).toBe(1);

    const [v1, v2] = doc.endpointsOf(doc.edge(result.edgeIds[0])!);
    expect(v1.x).toBeCloseTo(70);
    expect(v1.y).toBeCloseTo(10);
    expect(v2.x).toBeCloseTo(60);
    expect(v2.y).toBeCloseTo(20);
  });

  it('mirrors text and block instances horizontally across mirror line', () => {
    const doc = new Doc();
    const textId = doc.addText('Left Channel', 20, 30, 1.0);
    const blockId = doc.addBlockInstance('INPUT_JACK', 15, 25, 1.0);

    const result = reflectAcrossMirror(doc, [textId, blockId], 0);
    expect(result.textIds.length).toBe(1);
    expect(result.blockIds.length).toBe(1);

    const reflectedText = doc.texts.get(result.textIds[0]);
    expect(reflectedText).toBeDefined();
    expect(reflectedText?.x).toBeCloseTo(-20);
    expect(reflectedText?.y).toBeCloseTo(30);

    const reflectedBlock = doc.blockInstances.get(result.blockIds[0]);
    expect(reflectedBlock).toBeDefined();
    expect(reflectedBlock?.x).toBeCloseTo(-15);
    expect(reflectedBlock?.y).toBeCloseTo(25);
  });

  it('live mirrors newly added entities using mirrorNewlyAddedEntities', () => {
    const doc = new Doc();
    const before = doc.snapshot();

    // User draws line on left side
    doc.addLine({ x: -100, y: 50 }, { x: -50, y: 80 });

    // Live symmetry across mirror at x = 0
    mirrorNewlyAddedEntities(doc, before, 0);

    // Total edges should now be 2
    expect(doc.edges.size).toBe(2);

    // One edge should have x coordinates in the positive domain
    const allEdges = Array.from(doc.edges.values());
    const endpoints = allEdges.map((e) => doc.endpointsOf(e));

    const rightEdge = endpoints.find(([v1]) => v1.x > 0);
    expect(rightEdge).toBeDefined();
    expect(rightEdge![0].x).toBeCloseTo(100);
    expect(rightEdge![0].y).toBeCloseTo(50);
    expect(rightEdge![1].x).toBeCloseTo(50);
    expect(rightEdge![1].y).toBeCloseTo(80);
  });

  it('reflects a virtual mirror across another virtual mirror (a mirror mirrors a mirror)', async () => {
    const { createMirror, reflectMirrorAcross } = await import('../../core/mirror');
    const mirrorA = createMirror(20, 'Mirror A');
    const mirrorB = createMirror(50, 'Mirror B');

    // Reflect Mirror A across Mirror B (axis at x = 50)
    // Reflected position = 2 * 50 - 20 = 80
    const reflected = reflectMirrorAcross(mirrorA, mirrorB.x, mirrorB.name);

    expect(reflected.x).toBeCloseTo(80);
    expect(reflected.selected).toBe(true); // glowing CAD edge
    expect(reflected.reflectedFrom).toBe(mirrorA.id);
    expect(reflected.glowColor).toBe('#f43f5e'); // Distinct radiant glow
  });
});
