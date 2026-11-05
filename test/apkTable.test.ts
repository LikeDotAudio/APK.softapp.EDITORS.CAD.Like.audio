// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
// THE ONE TABLE (ROAD-3494): the elements and spreadsheet lists are APKTables
// drawn by components/common/ApkTable.tsx on the vendored public/vendor/apk-table
// (in a stub DOM, apk-table-shim.cjs), each under its own id, and no component
// writes a <table> itself.
import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { apkOptions, inputNode, type ApkTableProps } from '../src/components/common/ApkTable';

const require = createRequire(import.meta.url);
const { loadApkTable, rowsOf } = require('./apk-table-shim.cjs');
const ROOT = join(__dirname, '..');
const walk = (d: string): string[] => readdirSync(d).flatMap((n: string) => {
  const p = join(d, n);
  return statSync(p).isDirectory() ? walk(p) : [p];
});

describe('ApkTable in the CAD', () => {
  it('registers under its id; an input cell commits through onChange', () => {
    const { window, document } = loadApkTable(join(ROOT, 'public/vendor/apk-table/apk-table.js'));
    (globalThis as unknown as { document: unknown }).document = document;
    const texts = [{ id: 7, text: 'MAIN <PA>' }];
    const props: ApkTableProps<{ id: number; text: string }> = {
      id: 'cad-elements-texts',
      rows: texts,
      columns: [
        { key: 'id', label: 'ID', text: (t) => `#${t.id}` },
        { key: 'text', label: 'Content', node: (t) => inputNode(t.text, (v) => { t.text = v; }) },
      ],
    };
    const t = window.APKTable.create(document.createElement('div'), apkOptions({ current: props }));
    expect(window.APKTable.get('cad-elements-texts')).toBe(t);
    expect(rowsOf(t)[0][0]).toBe('#7');
    const input = t.el.querySelector('tbody').children[0].children[1].children[0];
    expect(input.value).toBe('MAIN <PA>');
    input.value = 'FOH';
    input.onchange();
    expect(texts[0].text).toBe('FOH');
    delete (globalThis as unknown as { document?: unknown }).document;
  });

  it('seven ids, unique, and no <table under src/', () => {
    const files = walk(join(ROOT, 'src')).filter((f) => /\.tsx?$/.test(f));
    const ids = files.flatMap((f) => [...readFileSync(f, 'utf8').matchAll(/<ApkTable\s+id="([^"]+)"/g)].map((m) => m[1]));
    expect(ids.sort()).toEqual(['cad-elements-block-instances', 'cad-elements-fills', 'cad-elements-texts',
      'cad-sheet-bom', 'cad-sheet-connectors', 'cad-sheet-groups', 'cad-sheet-placements']);
    for (const f of files) expect(readFileSync(f, 'utf8'), f).not.toMatch(/<table|createElement\(['"]table/);
    const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
    expect(html.indexOf('vendor/apk-table/apk-table.js')).toBeLessThan(html.indexOf('src/main.tsx'));
  });
});
