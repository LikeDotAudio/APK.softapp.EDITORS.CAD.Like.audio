// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
// ROAD-3583: File → Save Model is APKSoftapp.saveModel — the drawing's native session .json AND its .ifc twin.
import { describe, expect, it } from 'vitest';
import { saveDrawingModel, sessionFromJson, type ModelClient } from './ifcFile';
import type { SavedSession } from '../../io/browserStorage/SavedSession';

const SESSION = { version: 2, timestamp: 0, docSnapshot: { edges: [{ id: 1 }], vertices: [] } } as unknown as SavedSession;

describe('Save Model from the CAD', () => {
  it('hands the session and a toIfc to saveModel under the drawing\'s stem; the twin is the session\'s .ifc', async () => {
    const seen: { name?: string; model?: unknown; ifc?: string } = {};
    const S: ModelClient = {
      async saveModel(model, opts) {
        seen.name = opts.name;
        seen.model = model;
        seen.ifc = await opts.toIfc(model);
        return { ok: true, via: 'download', files: [`${opts.name}.ifc`, `${opts.name}.json`] };
      },
    };
    const r = await saveDrawingModel(S, SESSION, 'studio.ifc', async (s) => `ISO-10303-21;\n/* ${s.docSnapshot.edges.length} */`);
    expect(r).toEqual({ ok: true, files: ['studio.ifc', 'studio.json'], cancelled: false, problem: undefined });
    expect(seen.name).toBe('studio');
    expect(seen.model).toBe(SESSION);
    expect(seen.ifc).toBe('ISO-10303-21;\n/* 1 */');
  });

  it('a cancelled picker is no problem; a failure carries the client\'s problem', async () => {
    const cancel: ModelClient = { saveModel: async () => ({ ok: false, cancelled: true }) };
    expect(await saveDrawingModel(cancel, SESSION, 'a.ifc', async () => '')).toEqual({ ok: false, files: [], cancelled: true, problem: undefined });
    const fail: ModelClient = { saveModel: async () => ({ ok: false, problem: { code: 'save_failed' } }) };
    expect((await saveDrawingModel(fail, SESSION, 'a.ifc', async () => '')).problem).toEqual({ code: 'save_failed' });
  });

  it('the native .json opens back only when it is a drawing', () => {
    expect(sessionFromJson(JSON.parse(JSON.stringify(SESSION)))).toEqual(SESSION);
    expect(() => sessionFromJson({ wires: [] })).toThrow(/not a CAD drawing/);
    expect(() => sessionFromJson(null)).toThrow(/not a CAD drawing/);
  });
});
