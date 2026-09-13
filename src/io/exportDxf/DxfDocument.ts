// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Units } from '../../core/types';
import { DxfGeometry, type HandleSource } from './DxfGeometry';
import { pair } from './pair';

/**
 * An R2000 DXF: handles, subclass markers, and a real BLOCK_RECORD table.
 *
 * The block definitions are the point. A box placed by one INSERT moves as one
 * thing in whatever package opens the file, which is the difference between a
 * drawing somebody can work with and a picture of one.
 *
 * Ported from `.apk.scripts/dxf_writer.py` (PLAN-36.03), which was itself lifted
 * out of `build_interfaces_drawing.py` — the sheet that audits at 0 errors and
 * round-trips. Conformance is three separate things and all three are here:
 * every entity carries a handle (5) and an owner (330); every entity declares
 * AcDbEntity and then its own subclass; and the TABLES section carries a
 * BLOCK_RECORD table naming *Model_Space, *Paper_Space and every block, which
 * is what lets a reader resolve an INSERT to the geometry it names.
 */
export class DxfDocument implements HandleSource {
  private next = 0x100;
  private readonly blocks: { name: string; geometry: DxfGeometry; record: string }[] = [];
  private readonly modelRecord: string;
  private readonly paperRecord: string;
  readonly sheet: DxfGeometry;

  constructor(private readonly layers: { name: string; color: number }[]) {
    this.modelRecord = this.handle();
    this.paperRecord = this.handle();
    this.sheet = new DxfGeometry(this, this.modelRecord);
  }

  handle(): string {
    this.next += 1;
    return this.next.toString(16).toUpperCase();
  }

  /** Open a block definition. Draw into the returned geometry, then INSERT it. */
  block(name: string): DxfGeometry {
    const record = this.handle();
    const geometry = new DxfGeometry(this, record);
    this.blocks.push({ name, geometry, record });
    return geometry;
  }

  hasBlock(name: string): boolean {
    return this.blocks.some((b) => b.name === name);
  }

  private tables(): string {
    let out = pair('  0', 'SECTION') + pair('  2', 'TABLES');

    // LTYPE, because every layer below names CONTINUOUS and a layer whose
    // linetype does not exist is a dangling reference.
    const ltypeTable = this.handle();
    out +=
      pair('  0', 'TABLE') +
      pair('  2', 'LTYPE') +
      pair('  5', ltypeTable) +
      pair('330', '0') +
      pair('100', 'AcDbSymbolTable') +
      pair(' 70', 1);
    out +=
      pair('  0', 'LTYPE') +
      pair('  5', this.handle()) +
      pair('330', ltypeTable) +
      pair('100', 'AcDbSymbolTableRecord') +
      pair('100', 'AcDbLinetypeTableRecord') +
      pair('  2', 'CONTINUOUS') +
      pair(' 70', 0) +
      pair('  3', 'Solid line') +
      pair(' 72', 65) +
      pair(' 73', 0) +
      pair(' 40', '0.0');
    out += pair('  0', 'ENDTAB');

    const layerTable = this.handle();
    const layers = [{ name: '0', color: 7 }, ...this.layers.filter((l) => l.name !== '0')];
    out +=
      pair('  0', 'TABLE') +
      pair('  2', 'LAYER') +
      pair('  5', layerTable) +
      pair('330', '0') +
      pair('100', 'AcDbSymbolTable') +
      pair(' 70', layers.length);
    for (const layer of layers) {
      out +=
        pair('  0', 'LAYER') +
        pair('  5', this.handle()) +
        pair('330', layerTable) +
        pair('100', 'AcDbSymbolTableRecord') +
        pair('100', 'AcDbLayerTableRecord') +
        pair('  2', layer.name) +
        pair(' 70', 0) +
        pair(' 62', layer.color) +
        pair('  6', 'CONTINUOUS') +
        pair('370', 25) +
        pair('390', 'F');
    }
    out += pair('  0', 'ENDTAB');

    const recordTable = this.handle();
    out +=
      pair('  0', 'TABLE') +
      pair('  2', 'BLOCK_RECORD') +
      pair('  5', recordTable) +
      pair('330', '0') +
      pair('100', 'AcDbSymbolTable') +
      pair(' 70', this.blocks.length + 2);
    const records: [string, string][] = [
      ['*Model_Space', this.modelRecord],
      ['*Paper_Space', this.paperRecord],
      ...this.blocks.map((b): [string, string] => [b.name, b.record]),
    ];
    for (const [name, record] of records) {
      out +=
        pair('  0', 'BLOCK_RECORD') +
        pair('  5', record) +
        pair('330', recordTable) +
        pair('100', 'AcDbSymbolTableRecord') +
        pair('100', 'AcDbBlockTableRecord') +
        pair('  2', name) +
        pair('340', '0') +
        pair(' 70', 0);
    }
    out += pair('  0', 'ENDTAB');

    return out + pair('  0', 'ENDSEC');
  }

  private blockSection(name: string, geometry: DxfGeometry | null, record: string): string {
    let out =
      pair('  0', 'BLOCK') +
      pair('  5', this.handle()) +
      pair('330', record) +
      pair('100', 'AcDbEntity') +
      pair('  8', '0') +
      pair('100', 'AcDbBlockBegin') +
      pair('  2', name) +
      pair(' 70', 0) +
      pair(' 10', '0.0') +
      pair(' 20', '0.0') +
      pair(' 30', '0.0') +
      pair('  3', name) +
      pair('  1', '');
    if (geometry) out += geometry.entities;
    return (
      out +
      pair('  0', 'ENDBLK') +
      pair('  5', this.handle()) +
      pair('330', record) +
      pair('100', 'AcDbEntity') +
      pair('  8', '0') +
      pair('100', 'AcDbBlockEnd')
    );
  }

  dxf(units: Units): string {
    let body = this.tables() + pair('  0', 'SECTION') + pair('  2', 'BLOCKS');
    // Model and paper space are blocks like any other, and R2000 wants both
    // declared even though only one of them is drawn in.
    body += this.blockSection('*Model_Space', null, this.modelRecord);
    body += this.blockSection('*Paper_Space', null, this.paperRecord);
    for (const b of this.blocks) body += this.blockSection(b.name, b.geometry, b.record);
    body += pair('  0', 'ENDSEC');

    body +=
      pair('  0', 'SECTION') +
      pair('  2', 'ENTITIES') +
      this.sheet.entities +
      pair('  0', 'ENDSEC');

    // $HANDSEED has to be past every handle issued, so the header is written
    // last and put first.
    const insunits = units === 'mm' ? 4 : 1;
    const measurement = units === 'mm' ? 1 : 0;
    const header =
      pair('  0', 'SECTION') +
      pair('  2', 'HEADER') +
      pair('  9', '$ACADVER') +
      pair('  1', 'AC1015') +
      pair('  9', '$HANDSEED') +
      pair('  5', (this.next + 16).toString(16).toUpperCase()) +
      pair('  9', '$INSUNITS') +
      pair(' 70', insunits) +
      pair('  9', '$MEASUREMENT') +
      pair(' 70', measurement) +
      pair('  9', '$LUNITS') +
      pair(' 70', 2) +
      pair('  0', 'ENDSEC');

    return header + body + pair('  0', 'EOF');
  }
}
