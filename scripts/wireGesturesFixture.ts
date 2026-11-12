// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
/**
 * THE DRAWING scripts/wire-gestures-headless.mjs FLIES (ROAD-3689), written by this app's own
 * exporter — four of one real BIM part (its JSON as /api/bim/parts/<id> answers, argv[2]) in a row:
 *
 *   U1 ──W1 (two bends)──▶ U2 ──W2──▶ U3   a drawn line U3 → U4 (a wire in fact, not declared)
 *
 * and a frame of plain lines so File ▸ Open fits the whole sheet. Beside the .ifc it writes the
 * plan (world mm): each wire's path, the line's ends, and the frame — what the flight aims at.
 *
 *   node <bundle> <part.json> <out.ifc> <out.plan.json>
 */
import { readFileSync, writeFileSync } from 'node:fs';
import type { BlockDefinition } from '../src/core/types';
import { partToDefinition, type BimPart } from '../src/flow/bimPart';
import { createSchematic, placeBlock, snapshotSchematic } from '../src/flow/Schematic';
import { connect, endPoint, pathOf } from '../src/flow/wires';
import { exportIfc } from '../src/io/ifc/exportIfc';
import type { SavedSession } from '../src/io/browserStorage/SavedSession';
import { Doc } from '../src/model/Doc';

const [partFile, outIfc, outPlan] = process.argv.slice(2);
if (!partFile || !outIfc || !outPlan) throw new Error('usage: <part.json> <out.ifc> <out.plan.json>');
const part = JSON.parse(readFileSync(partFile, 'utf8')) as BimPart & { ref?: { part: string; url: string; rev: string } };
const def: BlockDefinition = partToDefinition(part, part.ref ?? null);
const input = def.ports.find((p) => p.side === 'input' && p.domain !== 'power')!;
const output = def.ports.find((p) => p.side === 'output' && p.domain !== 'power')!;
if (!input || !output) throw new Error(`${part.id}: wants a signal input and output`);

const model = createSchematic([def]);
const pitch = Math.ceil((def.size.w + 260) / 20) * 20;
const U = [0, 1, 2, 3].map((i) => placeBlock(model, def.id, { x: i * pitch, y: i === 1 ? -120 : 0 }, '0', `U${i + 1}`)!);
const P = (i: number, portId: string) => ({ placementId: U[i]!.id, portId });
const a = endPoint(model, P(0, output.id))!, b = endPoint(model, P(1, input.id))!;
const midX = Math.round((a.x + b.x) / 2 / 10) * 10;
const w1 = connect(model, P(0, output.id), P(1, input.id), '0', [{ x: midX, y: a.y }, { x: midX, y: b.y }])!;
const w2 = connect(model, P(1, output.id), P(2, input.id), '0')!;

const doc = new Doc();
const l0 = endPoint(model, P(2, output.id))!, l1 = endPoint(model, P(3, input.id))!;
doc.addLine({ ...l0 }, { ...l1 }, 0, '0');
const xs = U.map((u) => u.at.x), ys = U.map((u) => u.at.y);
const pad = Math.max(def.size.w, def.size.h) + 200;
const box = { x1: Math.min(...xs) - pad, y1: Math.min(...ys) - pad, x2: Math.max(...xs) + pad, y2: Math.max(...ys) + pad };
doc.addLine({ x: box.x1, y: box.y1 }, { x: box.x2, y: box.y1 }, 0, '0');
doc.addLine({ x: box.x2, y: box.y1 }, { x: box.x2, y: box.y2 }, 0, '0');
doc.addLine({ x: box.x2, y: box.y2 }, { x: box.x1, y: box.y2 }, 0, '0');
doc.addLine({ x: box.x1, y: box.y2 }, { x: box.x1, y: box.y1 }, 0, '0');

const session: SavedSession = {
  version: 2, timestamp: Date.UTC(2026, 10, 11, 12, 0, 0), docSnapshot: doc.snapshot(), currentFileName: 'wire-gestures',
  units: 'mm', gridSize: 10, gridMode: 'dots', snapToGrid: false, shapeMode: false, activeLayerId: '0',
  layers: [{ id: '0', name: '0', color: '#ffffff', visible: true }], tracing: null,
  docKey: '3689f1e5-0000-4000-8000-00000000a1b2', schematic: snapshotSchematic(model),
};
writeFileSync(outIfc, exportIfc(session));
writeFileSync(outPlan, JSON.stringify({
  part: part.id, definition: def.id, size: def.size, input: input.id, output: output.id,
  placements: U.map((u) => ({ id: u.id, refdes: u.refdes, at: u.at })),
  wires: { W1: { id: w1.id, path: pathOf(model, w1) }, W2: { id: w2.id, path: pathOf(model, w2) } },
  line: [l0, l1], frame: box,
}, null, 1));
