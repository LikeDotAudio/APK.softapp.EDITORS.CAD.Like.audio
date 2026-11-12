// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { describe, expect, it } from 'vitest';
import type { BlockDefinition, SchematicModel } from '../core/types';
import { partToDefinition } from './bimPart';
import { connectorDirection, connectorFamily, dropConnector, nextPortLabel, sameFamily } from './dropConnector';
import { definitionFor, portsOf, portWorldPoint } from './Schematic';

/** The owner's sheet: an "Unidentified NMOS node", RECEIVER 0 in and SENDER 0 out, both `RJ45?`. */
const NMOS: BlockDefinition = partToDefinition({
  id: 'nmos/unidentified-node', name: 'Unidentified NMOS node',
  ports: [
    { group: 'RECEIVER 0', side: 'input', domain: 'network', connector: 'RJ45', connector_guess: true },
    { group: 'SENDER 0', side: 'output', domain: 'network', connector: 'RJ45', connector_guess: true },
  ],
});

const model = (): SchematicModel => ({
  definitions: [NMOS],
  placements: [
    { id: 1, definitionId: NMOS.id, at: { x: 0, y: 0 }, layerId: '0', refdes: 'U57 · Unidentified NMOS node' },
    { id: 2, definitionId: NMOS.id, at: { x: 1000, y: 0 }, layerId: '0', refdes: 'U58' },
  ],
  connectors: [], groups: [], nextPlacementId: 3, nextConnectorId: 1, nextGroupId: 1,
});

const portAt = (m: SchematicModel, placementId: number, portId: string) => portWorldPoint(m, { placementId, portId })!;

describe('a connector dropped on a device', () => {
  it('which way a connector faces', () => {
    expect(connectorDirection('DANTE-RX2')).toBe('input');
    expect(connectorDirection('DANTE-TX8')).toBe('output');
    expect(connectorDirection('RJ45')).toBe('both');
  });

  it('dropped on a "?" port: that port gets the connector, no new port', () => {
    const m = model();
    const before = definitionFor(m, m.placements[0]!)!.ports.length;
    const o = dropConnector(m, 'RJ45', portAt(m, 1, 'SENDER_0'), 8);
    expect(o).toMatchObject({ kind: 'assigned', placementId: 1, portId: 'SENDER_0', was: 'RJ45?' });
    const def = definitionFor(m, m.placements[0]!)!;
    expect(def.ports).toHaveLength(before);
    expect(def.ports.find((p) => p.id === 'SENDER_0')).toMatchObject({ connector: 'RJ45' });
    expect(def.ports.find((p) => p.id === 'SENDER_0')!.connectorGuess).toBeUndefined();
    // the device's own fact: the other node of the same type is untouched
    expect(definitionFor(m, m.placements[1]!)!.ports.find((p) => p.id === 'SENDER_0')).toMatchObject({ connectorGuess: true });
  });

  it('dropped on the body: fills the first fitting unknown port (a receiver → RECEIVER 0)', () => {
    const m = model();
    const o = dropConnector(m, 'DANTE-RX2', { x: 0, y: 0 }, 8);
    expect(o).toMatchObject({ kind: 'assigned', portId: 'RECEIVER_0', was: 'RJ45?' });
    expect(m.placements[0]!.portConnectors).toEqual({ RECEIVER_0: 'DANTE-RX2' });
  });

  it('dropped on the body with no unknown port that fits: a NEW port of that connector, on its side, numbered after its kind', () => {
    const m = model();
    dropConnector(m, 'DANTE-RX2', { x: 0, y: 0 }, 8);              // RECEIVER 0 takes it
    const o = dropConnector(m, 'DANTE-RX2', { x: 0, y: 0 }, 8);    // now a new one
    expect(o).toMatchObject({ kind: 'added', side: 'input', label: 'RECEIVER 1', portId: 'RECEIVER_1' });
    const def = definitionFor(m, m.placements[0]!)!;
    const added = def.ports.find((p) => p.id === 'RECEIVER_1')!;
    expect(added).toMatchObject({ side: 'input', connector: 'DANTE-RX2', domain: 'audio' });
    // under RECEIVER 0 on the block's pitch, on the left edge, on the grid
    const r0 = portAt(m, 1, 'RECEIVER_0'), r1 = portAt(m, 1, 'RECEIVER_1');
    expect(r1.x).toBe(r0.x);
    expect(r0.y - r1.y).toBe(10);
    expect(Math.abs(r1.y % 10)).toBe(0);
    expect(portsOf(m, 1).map((r) => r.port.id)).toContain('RECEIVER_1');
  });

  it('a two-way connector with no place on the device goes on the side nearest the drop; a sender goes right', () => {
    const m = model();
    dropConnector(m, 'RJ45', portAt(m, 1, 'RECEIVER_0'), 8);
    dropConnector(m, 'RJ45', portAt(m, 1, 'SENDER_0'), 8);
    const left = dropConnector(m, 'RJ45', { x: -20, y: 0 }, 1);
    const right = dropConnector(m, 'RJ45', { x: 20, y: 0 }, 1);
    expect(left).toMatchObject({ kind: 'added', side: 'input', label: 'RECEIVER 1' });
    expect(right).toMatchObject({ kind: 'added', side: 'output', label: 'SENDER 1' });
    const tx = dropConnector(m, 'DANTE-TX2', { x: -20, y: 0 }, 1);
    expect(tx).toMatchObject({ kind: 'added', side: 'output' });
  });

  it('the block grows in whole grid steps when the side runs out of room', () => {
    const m = model();
    const h0 = definitionFor(m, m.placements[0]!)!.size.h;
    for (let i = 0; i < 6; i++) dropConnector(m, 'DANTE-RX2', { x: -20, y: 0 }, 1);
    const def = definitionFor(m, m.placements[0]!)!;
    expect(def.size.h).toBeGreaterThan(h0);
    expect(def.size.h % 20).toBe(0);
    expect(NMOS.size.h).toBe(h0);   // the type is not touched
  });

  it('off any device: nothing', () => {
    expect(dropConnector(model(), 'RJ45', { x: 500, y: 500 }, 8)).toBeNull();
  });

  it('a label after the ports of its kind', () => {
    expect(nextPortLabel([{ id: 'A', side: 'input', label: 'Ch 7', domain: 'audio' }], 'input', 'DANTE-RX2')).toBe('Ch 8');
    expect(nextPortLabel([], 'output', 'BNC')).toBe('BNC 1');
  });

  it('ROAD-3688: a guessed port takes only a connector of its family (DANTE-RX2 never fills an XLR3-F? input)', () => {
    expect(connectorFamily('XLR3-F')).toMatchObject({ family: 'XLR', network: false });
    expect(connectorFamily('DANTE-RX2')).toMatchObject({ network: true, carried: true });
    expect(connectorFamily('RJ45')).toMatchObject({ family: 'RJ', network: true, carried: false });
    expect(sameFamily('XLR3-F', 'XLR3-M')).toBe(true);
    expect(sameFamily('RJ45', 'DANTE-RX2')).toBe(true);
    expect(sameFamily('DANTE', 'AES67')).toBe(true);
    expect(sameFamily('XLR3-F', 'DANTE-RX2')).toBe(false);
    expect(sameFamily('RJ45', 'SFP')).toBe(false);   // two network plugs are two connectors
    const MIC: BlockDefinition = partToDefinition({
      id: 'acme/box', name: 'Box',
      ports: [
        { group: 'IN', side: 'input', domain: 'audio', connector: 'XLR3-F', connector_guess: true },
        { group: 'NET', side: 'input', domain: 'network', connector: 'RJ45', connector_guess: true },
      ],
    });
    const m: SchematicModel = {
      definitions: [MIC], placements: [{ id: 1, definitionId: MIC.id, at: { x: 0, y: 0 }, layerId: '0', refdes: 'U1' }],
      connectors: [], groups: [], nextPlacementId: 2, nextConnectorId: 1, nextGroupId: 1,
    };
    expect(dropConnector(m, 'DANTE-RX2', { x: 0, y: 0 }, 1)).toMatchObject({ kind: 'assigned', portId: 'NET', was: 'RJ45?' });
    expect(dropConnector(m, 'DANTE-RX2', { x: 0, y: 0 }, 1)).toMatchObject({ kind: 'added', side: 'input' });   // IN stays XLR3-F?
    expect(definitionFor(m, m.placements[0]!)!.ports.find((p) => p.id === 'IN')).toMatchObject({ connector: 'XLR3-F', connectorGuess: true });
    expect(dropConnector(m, 'XLR3-F', { x: 0, y: 0 }, 1)).toMatchObject({ kind: 'assigned', portId: 'IN', was: 'XLR3-F?' });
  });

  it('ROAD-3688: an XLR fills an XLR guess of the other gender; a BNC adds a port', () => {
    const BOX: BlockDefinition = partToDefinition({
      id: 'acme/box2', name: 'Box 2', ports: [{ group: 'IN', side: 'input', domain: 'audio', connector: 'XLR3-F', connector_guess: true }],
    });
    const m: SchematicModel = {
      definitions: [BOX], placements: [{ id: 1, definitionId: BOX.id, at: { x: 0, y: 0 }, layerId: '0' }],
      connectors: [], groups: [], nextPlacementId: 2, nextConnectorId: 1, nextGroupId: 1,
    };
    expect(dropConnector(m, 'BNC', { x: 0, y: 0 }, 1)).toMatchObject({ kind: 'added' });
    expect(dropConnector(m, 'XLR3-M', { x: 0, y: 0 }, 1)).toMatchObject({ kind: 'assigned', portId: 'IN' });
  });
});
