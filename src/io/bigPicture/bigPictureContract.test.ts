// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import schemaV1 from '../../../contract/big-picture@1/big-picture.schema.json';
import samplesV1 from '../../../contract/big-picture@1/samples.json';
import schema from '../../../contract/big-picture@2/big-picture.schema.json';
// @ts-expect-error — plain JS shipped with the contract, no .d.ts on purpose
import { checkSamples, validate } from '../../../contract/validate.mjs';
import type { SchematicSnapshot } from '../../flow/Schematic';
import { entitiesByType, parseStep } from '../../vendor/ifc/step';
import { BIG_PICTURE_ENDPOINT, BIG_PICTURE_SCHEMA, V1_ENDPOINT, fetchBigPicture, isBigPictureRead, isBigPictureReadV2, saveBigPicture } from './bigPictureApi';
import { bigPictureIfc, bigPictureIfcOffline, sheetFromIfc } from './bigPictureIfc';

/*
 * The CUSTOMER side of contract/big-picture@2. WEB.OsApi (server.py) is the
 * supplier; its http_routes_test.py posts these same samples. The samples'
 * STEP is written here, from `$sheet`, by the code that files the sheet —
 * `BIG_PICTURE_SAMPLES=write npx vitest run src/io/bigPicture` rewrites them
 * after a change to the IFC writer; otherwise this test fails until they agree.
 * For IfcOpenShell: the `write` sample's ifc passes validate(express_rules)
 * with 0 errors (DATABASE.server.BIM SRC/tools/ifc/oracle.py).
 */

const DIR = join(__dirname, '..', '..', '..', 'contract', 'big-picture@2');
const SAMPLES = join(DIR, 'samples.json');
const samples = JSON.parse(readFileSync(SAMPLES, 'utf8'));
const def = (name: string) => schema.$defs[name as keyof typeof schema.$defs];
const check = (name: string, value: unknown) => validate(def(name), value, schema);

/** A rack of two NICs inside a bench group with a third, two connectors (one routed). */
const SHEET: SchematicSnapshot = {
  placements: [
    { id: 1, definitionId: 'SHOP_NIC', at: { x: 0, y: 0 }, layerId: '0', refdes: 'enp12s0' },
    { id: 2, definitionId: 'SHOP_NIC', at: { x: 4000, y: 0 }, rotation: 180, layerId: '0', refdes: 'enp5s0f0' },
    { id: 3, definitionId: 'SHOP_NIC', at: { x: 8000, y: 0 }, layerId: '0', refdes: 'eno1' },
  ],
  connectors: [
    { id: 1, from: { placementId: 1, portId: 'ETH' }, to: { placementId: 2, portId: 'ETH' }, layerId: '0' },
    { id: 2, from: { placementId: 3, portId: 'ETH' }, to: { placementId: 1, portId: 'ETH' }, layerId: '0', label: 'uplink', route: [{ x: 8000, y: 500 }, { x: 0, y: 500 }] },
  ],
  groups: [
    { id: 1, name: 'Rack A', children: [], members: [1, 2], layerId: '0', source: { kind: 'rack', id: 'rack-a' } },
    { id: 2, name: 'Bench', children: [1], members: [3], layerId: '0', pad: 200 },
  ],
  nextPlacementId: 4,
  nextConnectorId: 3,
  nextGroupId: 3,
};

/** What WEB.OsApi big_picture_ifc.py says when an occurrence is held twice (its big_picture_ifc_test.py). */
const TWO_OWNERS = 'placement 1 is held by group 1 (Rack A) and group 2 (Bench) (IfcRelAssignsToGroup) — an occurrence has one IfcRelAssignsToGroup or IfcRelAggregates owner at most';

function expectedSamples() {
  const ifc = bigPictureIfcOffline(SHEET);
  const empty = { schema: BIG_PICTURE_SCHEMA, ifc: null, digest: null, exists: false, saved_at: null };
  return {
    $comment: 'Written by src/io/bigPicture/bigPictureContract.test.ts from $sheet (BIG_PICTURE_SAMPLES=write). One of every body of cad.like.audio/big-picture@2; WEB.OsApi http_routes_test.py posts `write` and checks every answer against these shapes.',
    $sheet: SHEET,
    read: { schema: BIG_PICTURE_SCHEMA, ifc, digest: '9c41e7', exists: true, saved_at: '2026-11-06T18:00:00', bytes: new TextEncoder().encode(ifc).length },
    readEmpty: empty,
    write: { schema: BIG_PICTURE_SCHEMA, ifc, base: '9c41e7' },
    saved: { saved: true, digest: '5e0b2a', saved_at: '2026-11-06T18:05:00', placements: 3, connectors: 2, groups: 2, bytes: new TextEncoder().encode(ifc).length },
    conflict: { error: 'big-picture.ifc changed while this sheet was being edited — another window saved first.', digest: '5e0b2a' },
    invalid: { error: TWO_OWNERS, problems: [TWO_OWNERS] },
  };
}

function respond(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body, text: async () => JSON.stringify(body) } as Response;
}

afterEach(() => vi.unstubAllGlobals());

describe('cad.like.audio/big-picture@2', () => {
  it('the samples are what this editor writes from $sheet', () => {
    const want = expectedSamples();
    if (process.env.BIG_PICTURE_SAMPLES === 'write') writeFileSync(SAMPLES, JSON.stringify(want, null, 2) + '\n');
    expect(JSON.parse(readFileSync(SAMPLES, 'utf8'))).toEqual(want);
  });

  it('every sample fits its schema', () => {
    expect(schema['x-protocol']).toBe(BIG_PICTURE_SCHEMA);
    expect(checkSamples(schema, samples)).toEqual([]);
    expect(check('read', samples.read)).toEqual([]);
    expect(check('read', samples.readEmpty)).toEqual([]);
    expect(check('write', samples.write)).toEqual([]);
    expect(check('saved', samples.saved)).toEqual([]);
    expect(check('refused', samples.conflict)).toEqual([]);
    expect(check('refused', samples.invalid)).toEqual([]);
  });

  it('the STEP is IFC4X3_ADD2: the sheet as occurrences, connections, an assembly and a group, and back', () => {
    const file = parseStep(samples.write.ifc);
    expect(samples.write.ifc).toContain("FILE_SCHEMA(('IFC4X3_ADD2'))");
    expect(entitiesByType(file, 'IFCRELCONNECTSPORTS')).toHaveLength(2);
    expect(entitiesByType(file, 'IFCELEMENTASSEMBLY')).toHaveLength(1);
    expect(entitiesByType(file, 'IFCGROUP').filter((g) => g.args[2] === 'Bench')).toHaveLength(1);
    expect(sheetFromIfc(samples.write.ifc)).toEqual(SHEET);
    // the same sheet is the same bytes (every GlobalId from docKey 'big-picture')
    expect(bigPictureIfcOffline(sheetFromIfc(samples.write.ifc))).toBe(samples.write.ifc);
  });

  it('the v1 sheet comes through IFC unchanged', () => {
    const v1 = samplesV1.write.sheet as unknown as SchematicSnapshot;
    expect(sheetFromIfc(bigPictureIfcOffline(v1))).toEqual(v1);
  });

  it('the client accepts both read samples and refuses other shapes', () => {
    expect(isBigPictureReadV2(samples.read)).toBe(true);
    expect(isBigPictureReadV2(samples.readEmpty)).toBe(true);
    expect(isBigPictureReadV2({ ...samples.read, schema: 'cad.like.audio/big-picture@1' })).toBe(false);
    expect(isBigPictureReadV2({ ...samples.readEmpty, exists: true })).toBe(false);
    expect(isBigPictureReadV2(samplesV1.read)).toBe(false);
  });

  it('reads the IFC from v2 as the sheet, with its digest', async () => {
    const calls: string[] = [];
    vi.stubGlobal('fetch', async (url: string) => (calls.push(url), respond(200, samples.read)));
    const read = await fetchBigPicture();
    expect(calls).toEqual([BIG_PICTURE_ENDPOINT]);
    expect(read?.digest).toBe(samples.read.digest);
    expect(read?.sheet).toEqual({ ...SHEET, saved_at: samples.read.saved_at, exists: true });
  });

  it('with no IFC filed, opens a sheet still filed as JSON (v1, until 2027-01-01) and quotes no digest', async () => {
    const calls: string[] = [];
    vi.stubGlobal('fetch', async (url: string) => {
      calls.push(url);
      return url === V1_ENDPOINT ? respond(200, samplesV1.read) : respond(200, samples.readEmpty);
    });
    const read = await fetchBigPicture();
    expect(calls).toEqual([BIG_PICTURE_ENDPOINT, V1_ENDPOINT]);
    expect(read?.digest).toBeNull();
    expect(read?.sheet.placements).toEqual(samplesV1.read.sheet.placements);
    expect(read?.sheet.exists).toBe(false);

    vi.stubGlobal('fetch', async (url: string) => (url === V1_ENDPOINT ? respond(200, samplesV1.readEmpty) : respond(200, samples.readEmpty)));
    expect(await fetchBigPicture()).toEqual({ sheet: expect.objectContaining({ placements: [], exists: false }), digest: null });
  });

  it('no server, or a server that answers something else, is no sheet', async () => {
    vi.stubGlobal('fetch', async () => { throw new TypeError('offline'); });
    expect(await fetchBigPicture()).toBeNull();
    vi.stubGlobal('fetch', async () => respond(404, {}));
    expect(await fetchBigPicture()).toBeNull();
  });

  it('writes the schema\'s write body as IFC, and reads a 409 as a conflict', async () => {
    let sent: { url: string; body: unknown } | null = null;
    vi.stubGlobal('fetch', async (url: string, init?: RequestInit) => {
      if (!init?.method) return respond(404, null); // the BIM library: offline, a stub type
      sent = { url, body: JSON.parse(String(init.body)) };
      return respond(409, samples.conflict);
    });
    const outcome = await saveBigPicture(SHEET, samples.write.base, { timestamp: 0 });
    expect(sent!.url).toBe(BIG_PICTURE_ENDPOINT);
    expect(check('write', sent!.body)).toEqual([]);
    expect(sent!.body).toEqual(samples.write);
    expect(outcome).toMatchObject({ ok: false, conflict: true });
    expect(await bigPictureIfc(SHEET, { fetcher: (async () => respond(404, null)) as typeof fetch })).toBe(samples.write.ifc);
  });
});

describe('cad.like.audio/big-picture@1 (read-only until 2027-01-01)', () => {
  it('every v1 sample still fits its schema, and the client reads it', () => {
    expect(schemaV1['x-protocol']).toBe('cad.like.audio/big-picture@1');
    expect(checkSamples(schemaV1, samplesV1)).toEqual([]);
    expect(isBigPictureRead(samplesV1.read)).toBe(true);
    expect(isBigPictureRead(samplesV1.readEmpty)).toBe(true);
    expect(isBigPictureRead({ sheet: { placements: [] }, digest: null })).toBe(false);
    expect(isBigPictureRead({ sheet: { placements: [{ id: 'x' }], connectors: [] }, digest: null })).toBe(false);
  });
});
