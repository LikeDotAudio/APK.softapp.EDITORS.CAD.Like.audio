// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Units } from '../../core/types';
import { DxfGeometry, type HandleSource } from './DxfGeometry';
import { dxfLayerName, dxfLineweight, standardLinetype, type DxfLinetype } from './dxfLinetypes';
import { pair } from './pair';

/** One layer as the LAYER table writes it. */
export interface DxfLayerSpec {
  /** What entities call the layer by (`layerId`); defaults to `name`. */
  id?: string;
  name: string;
  /** ACI colour, 1–255. */
  color: number;
  /** Linetype name; absent is CONTINUOUS. */
  linetype?: string;
  /** The pattern of a linetype that is not one of the standard names. */
  linetypePattern?: number[];
  /** Hundredths of a millimetre; absent is the reader's default. */
  lineweight?: number;
  /** Switched off: written as a negative colour, which is how DXF says it. */
  off?: boolean;
  locked?: boolean;
}

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
 *
 * Layers are the fourth. Every entity names its layer by the layer's DXF name,
 * every name an entity uses is in the LAYER table — one an entity reaches that
 * the sheet never declared is added there in white, CONTINUOUS — and every
 * linetype a layer names is in the LTYPE table with its dash pattern, so no
 * reference in the file dangles.
 */
export class DxfDocument implements HandleSource {
  private next = 0x100;
  private readonly blocks: { name: string; geometry: DxfGeometry; record: string }[] = [];
  private readonly modelRecord: string;
  private readonly paperRecord: string;
  /** The LAYER table, in order, keyed by DXF name. Layer 0 is always first. */
  private readonly layers = new Map<string, DxfLayerSpec>();
  /** A `layerId` (or a layer's own name) to the DXF name it was written under. */
  private readonly layerNames = new Map<string, string>();
  readonly sheet: DxfGeometry;

  constructor(layers: DxfLayerSpec[]) {
    const zero = layers.find((l) => dxfLayerName(l.name) === '0');
    this.layers.set('0', { ...zero, name: '0', color: zero?.color ?? 7 });
    this.layerNames.set('0', '0');
    if (zero?.id) this.layerNames.set(zero.id, '0');
    for (const l of layers) {
      if (l === zero) continue;
      // Two names that clean to the same DXF name stay two layers.
      let name = dxfLayerName(l.name);
      for (let n = 2; this.layers.has(name); n++) name = `${dxfLayerName(l.name)}_${n}`;
      this.layers.set(name, { ...l, name });
      this.layerNames.set(l.id ?? l.name, name);
      if (!this.layerNames.has(l.name)) this.layerNames.set(l.name, name);
    }

    this.modelRecord = this.handle();
    this.paperRecord = this.handle();
    this.sheet = new DxfGeometry(this, this.modelRecord);
  }

  handle(): string {
    this.next += 1;
    return this.next.toString(16).toUpperCase();
  }

  /**
   * The DXF name of the layer an entity is on. A layer the sheet never
   * declared — a block's own layer, a schematic's — is declared now, so the
   * entity does not point at a layer the file does not have.
   */
  layer(ref: string): string {
    const known = this.layerNames.get(ref || '0');
    if (known) return known;
    const name = dxfLayerName(ref);
    if (!this.layers.has(name)) this.layers.set(name, { name, color: 7 });
    this.layerNames.set(ref, name);
    return name;
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

  /** Every linetype the layers name, by DXF name, with its pattern in drawing units. */
  private linetypes(units: Units): Map<string, DxfLinetype> {
    const out = new Map<string, DxfLinetype>([
      ['ByBlock', { description: '', pattern: [] }],
      ['ByLayer', { description: '', pattern: [] }],
      ['CONTINUOUS', { description: 'Solid line', pattern: [] }],
    ]);
    for (const layer of this.layers.values()) {
      const name = layerLinetype(layer);
      if (out.has(name)) continue;
      const standard = standardLinetype(name, units);
      // A name nobody knows and no pattern came with it: still declared, as a
      // solid line, because a layer naming a missing LTYPE is refused outright.
      out.set(
        name,
        standard ?? { description: name, pattern: layer.linetypePattern ?? [] },
      );
    }
    return out;
  }

  private tables(units: Units): string {
    let out = pair('  0', 'SECTION') + pair('  2', 'TABLES');

    // LTYPE first, because every layer below names one and a layer whose
    // linetype does not exist is a dangling reference.
    const linetypes = this.linetypes(units);
    const ltypeTable = this.handle();
    out +=
      pair('  0', 'TABLE') +
      pair('  2', 'LTYPE') +
      pair('  5', ltypeTable) +
      pair('330', '0') +
      pair('100', 'AcDbSymbolTable') +
      pair(' 70', linetypes.size);
    for (const [name, lt] of linetypes) {
      const total = lt.pattern.reduce((sum, v) => sum + Math.abs(v), 0);
      out +=
        pair('  0', 'LTYPE') +
        pair('  5', this.handle()) +
        pair('330', ltypeTable) +
        pair('100', 'AcDbSymbolTableRecord') +
        pair('100', 'AcDbLinetypeTableRecord') +
        pair('  2', name) +
        pair(' 70', 0) +
        pair('  3', lt.description) +
        pair(' 72', 65) +
        pair(' 73', lt.pattern.length) +
        pair(' 40', total.toFixed(6));
      for (const v of lt.pattern) out += pair(' 49', v.toFixed(6)) + pair(' 74', 0);
    }
    out += pair('  0', 'ENDTAB');

    const layerTable = this.handle();
    out +=
      pair('  0', 'TABLE') +
      pair('  2', 'LAYER') +
      pair('  5', layerTable) +
      pair('330', '0') +
      pair('100', 'AcDbSymbolTable') +
      pair(' 70', this.layers.size);
    for (const layer of this.layers.values()) {
      const aci = Math.min(255, Math.max(1, Math.round(Math.abs(layer.color)) || 7));
      out +=
        pair('  0', 'LAYER') +
        pair('  5', this.handle()) +
        pair('330', layerTable) +
        pair('100', 'AcDbSymbolTableRecord') +
        pair('100', 'AcDbLayerTableRecord') +
        pair('  2', layer.name) +
        pair(' 70', layer.locked ? 4 : 0) +
        pair(' 62', layer.off ? -aci : aci) +
        pair('  6', layerLinetype(layer)) +
        // No 390 (plot-style handle): it must point at an ACDBPLACEHOLDER in
        // an OBJECTS section this writer does not emit, and an optional
        // pointer left out is valid where a dangling one is not.
        pair('370', dxfLineweight(layer.lineweight));
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
    let body = this.tables(units) + pair('  0', 'SECTION') + pair('  2', 'BLOCKS');
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

/** The DXF linetype name a layer is drawn with: a standard one upper-cased, any other cleaned. */
function layerLinetype(layer: DxfLayerSpec): string {
  const name = layer.linetype?.trim();
  // ByLayer/ByBlock mean something on an entity and nothing on a layer
  if (!name || /^by(layer|block)$/i.test(name)) return 'CONTINUOUS';
  return standardLinetype(name, 'in') ? name.toUpperCase() : dxfLayerName(name);
}
