// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { describe, expect, it } from 'vitest';
import schema from '../../../contract/host@1/host.schema.json';
import samples from '../../../contract/host@1/samples.json';
// @ts-expect-error — plain JS shipped with the contract, no .d.ts on purpose
import { checkSamples, validateMessage } from '../../../contract/validate.mjs';
import { BLOCK_EDITOR_INBOUND_TYPES, blockEditorMessage, postToEditor, toEditor } from './blockHost';
import { HOST_PROTOCOL } from './hostBridge';

/* The CAD as the PARENT of a block editor (SoftappBlockBridgeModal), held to host@1. */

const ORIGIN = 'http://bench:8080';
const frame = { postMessage: () => {} } as unknown as Window;
const stranger = { postMessage: () => {} } as unknown as Window;
const ev = (data: unknown, source: unknown = frame, origin = ORIGIN) => ({ data, source, origin }) as unknown as MessageEvent;

describe('host@1 block editor messages', () => {
  it('what the CAD sends an editor validates as toEditor', () => {
    const load = toEditor('load', { block: { name: 'B' }, meta: { blockName: 'B', source: 'CAD.Like.audio' } });
    expect(validateMessage(schema, 'toEditor', load)).toEqual([]);
    expect(validateMessage(schema, 'toEditor', toEditor('request'))).toEqual([]);
  });

  it('posts only to the given origin, never "*"', () => {
    const posted: [unknown, string][] = [];
    const f = { postMessage: (m: unknown, o: string) => posted.push([m, o]) } as unknown as Window;
    postToEditor(f, toEditor('request'), ORIGIN);
    expect(posted).toEqual([[{ protocol: HOST_PROTOCOL, type: 'request' }, ORIGIN]]);
  });

  it('takes every toCad block sample from its own iframe', () => {
    const blockSamples = (samples.toCad as { type: string }[]).filter((m) => (BLOCK_EDITOR_INBOUND_TYPES as readonly string[]).includes(m.type));
    expect(blockSamples.map((m) => m.type).sort()).toEqual([...BLOCK_EDITOR_INBOUND_TYPES].sort());
    for (const m of blockSamples) expect(blockEditorMessage(ev(m), frame, ORIGIN)?.type).toBe(m.type);
    const save = blockEditorMessage(ev(blockSamples.find((m) => m.type === 'blockSave')), frame, ORIGIN)!;
    expect(save.meta?.blockName).toBe('SAMPLE_BLOCK');
    expect(Array.isArray(save.block?.lines)).toBe(true);
  });

  it('drops another window, another origin, another protocol, the old private names and host-only types', () => {
    const ok = { protocol: HOST_PROTOCOL, type: 'blockSave', block: {} };
    expect(blockEditorMessage(ev(ok, stranger), frame, ORIGIN)).toBeNull();
    expect(blockEditorMessage(ev(ok, frame, 'http://evil'), frame, ORIGIN)).toBeNull();
    expect(blockEditorMessage(ev(ok), null, ORIGIN)).toBeNull();
    expect(blockEditorMessage(ev({ ...ok, protocol: 'other@1' }), frame, ORIGIN)).toBeNull();
    expect(blockEditorMessage(ev({ type: 'APK_' + 'SAVE_BLOCK', block: {} }), frame, ORIGIN)).toBeNull();
    expect(blockEditorMessage(ev({ protocol: HOST_PROTOCOL, type: 'fit' }), frame, ORIGIN)).toBeNull();
  });

  it('keeps block and meta only when they are objects', () => {
    const m = blockEditorMessage(ev({ protocol: HOST_PROTOCOL, type: 'blockSave', block: [1], meta: 'x', editor: 3 }), frame, ORIGIN)!;
    expect(m).toEqual({ protocol: HOST_PROTOCOL, type: 'blockSave' });
  });

  it('validate.mjs checkSamples passes the published samples and catches a missing one', () => {
    expect(checkSamples(schema, samples)).toEqual([]);
    const fewer = { ...samples, toEditor: (samples.toEditor as unknown[]).slice(0, 1) };
    expect(checkSamples(schema, fewer).join()).toMatch(/toEditor: samples/);
  });
});
