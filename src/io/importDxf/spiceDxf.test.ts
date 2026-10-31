// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { Doc } from '../../model/Doc';
import { buildDxf } from '../exportDxf/buildDxf';
import { layersFromDxf } from './layersFromDxf';
import { loadDxfIntoDoc } from './loadDxfIntoDoc';
import { parseDxf } from './parseDxf';

/*
 * A DXF written by EDITOR.simulator.SPICE (dxf_io.py) opens here with its
 * embedded deck intact, and survives being saved again by this editor.
 *
 * fixtures/spice/sample_plant.{dxf,cir} are copies of that repo's
 * fixtures/ (its test_io_roundtrip.py pins them to what its writer writes
 * today). The deck travels as TEXT on the APK_SPICE layer between two marker
 * lines; `!EMPTY!` stands for a blank line, `!B64!` prefixes a base64 one.
 */

const here = dirname(fileURLToPath(import.meta.url));
const fixture = (name: string) => readFileSync(join(here, 'fixtures/spice', name), 'utf8');

/** The deck back out of a set of texts on APK_SPICE, read top-down as dxf_io.py lays them. */
function deckFrom(texts: { text: string; y: number; layer: string }[]): string | null {
  const lines = texts.filter((t) => t.layer === 'APK_SPICE').sort((a, b) => b.y - a.y).map((t) => t.text);
  const begin = lines.indexOf('APK-SPICE-DECK-BEGIN');
  const end = lines.indexOf('APK-SPICE-DECK-END');
  if (begin < 0 || end < begin) return null;
  const decode = (l: string) => (l === '!EMPTY!' ? '' : l.startsWith('!B64!') ? Buffer.from(l.slice(5), 'base64').toString('utf8') : l);
  return `${lines.slice(begin + 1, end).map(decode).join('\n')}\n`;
}

describe('a SPICE-written DXF', () => {
  const dxf = fixture('sample_plant.dxf');
  const cir = fixture('sample_plant.cir');

  it('parses, with the APK_SPICE layer and the deck on it', () => {
    const parsed = parseDxf(dxf);
    expect(parsed.layers.some((l) => l.name === 'APK_SPICE')).toBe(true);
    const texts = parsed.entities.filter((e) => e.type === 'TEXT').map((e) => ({ text: e.text ?? '', y: e.y1 ?? 0, layer: e.layer ?? '0' }));
    expect(deckFrom(texts)).toBe(cir);
  });

  it('opens on the sheet and saves back out with the deck intact', async () => {
    const parsed = parseDxf(dxf);
    const doc = new Doc();
    await loadDxfIntoDoc(doc, parsed);
    const onSheet = [...doc.texts.values()].map((t) => ({ text: t.text, y: t.y, layer: t.layerId }));
    expect(deckFrom(onSheet)).toBe(cir);
    expect(doc.edgeCount).toBeGreaterThan(0);

    const again = parseDxf(buildDxf(doc, 'mm', layersFromDxf(parsed)));
    const texts = again.entities.filter((e) => e.type === 'TEXT').map((e) => ({ text: e.text ?? '', y: e.y1 ?? 0, layer: e.layer ?? '0' }));
    expect(deckFrom(texts)).toBe(cir);
  });

  it('is still the file EDITOR.simulator.SPICE writes (when it is checked out beside us)', () => {
    const source = resolve(here, '../../../../EDITOR.simulator.SPICE/fixtures');
    if (!existsSync(join(source, 'sample_plant.dxf'))) return;
    expect(readFileSync(join(source, 'sample_plant.dxf'), 'utf8'), 'cp ../EDITOR.simulator.SPICE/fixtures/sample_plant.* src/io/importDxf/fixtures/spice/').toBe(dxf);
    expect(readFileSync(join(source, 'sample_plant.cir'), 'utf8')).toBe(cir);
  });
});
