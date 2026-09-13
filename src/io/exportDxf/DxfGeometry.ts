// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Point } from '../../core/types';
import { pair } from './pair';

/** Issues the handles. `DxfDocument` implements it; a block only needs this much. */
export interface HandleSource {
  handle(): string;
}

/**
 * Somewhere to put entities — a block definition, or the sheet itself.
 *
 * Every entity is written with a handle, an owner and its AcDb subclass
 * markers. R2000 requires all three, and a file missing them loads in forgiving
 * viewers and is REFUSED outright by strict ones, which is the same as not
 * having a drawing, only harder to notice.
 *
 * This is `.apk.scripts/dxf_writer.py`'s `Geometry` class in TypeScript, group
 * code for group code. That module is this repository's one conformant writer
 * (PLAN-36.03); a second convention here would be a third dialect of DXF in a
 * tree that has just finished getting down to one.
 */
export class DxfGeometry {
  entities = '';

  constructor(
    private readonly doc: HandleSource,
    private readonly owner: string,
  ) {}

  private head(kind: string, layer: string, subclass: string): string {
    return (
      pair('  0', kind) +
      pair('  5', this.doc.handle()) +
      pair('330', this.owner) +
      pair('100', 'AcDbEntity') +
      pair('  8', layer || '0') +
      pair('100', subclass)
    );
  }

  line(x1: number, y1: number, x2: number, y2: number, layer: string): void {
    this.entities +=
      this.head('LINE', layer, 'AcDbLine') +
      pair(' 10', x1.toFixed(6)) +
      pair(' 20', y1.toFixed(6)) +
      pair(' 30', '0.0') +
      pair(' 11', x2.toFixed(6)) +
      pair(' 21', y2.toFixed(6)) +
      pair(' 31', '0.0');
  }

  /**
   * A true arc, counter-clockwise from `a1` to `a2` in degrees — the same
   * convention the `ArcEdge` in this app already stores, so the angles map
   * across without a reversal.
   */
  arc(cx: number, cy: number, r: number, a1: number, a2: number, layer: string): void {
    this.entities +=
      this.head('ARC', layer, 'AcDbCircle') +
      pair(' 10', cx.toFixed(6)) +
      pair(' 20', cy.toFixed(6)) +
      pair(' 30', '0.0') +
      pair(' 40', r.toFixed(6)) +
      pair('100', 'AcDbArc') +
      pair(' 50', a1.toFixed(6)) +
      pair(' 51', a2.toFixed(6));
  }

  circle(cx: number, cy: number, r: number, layer: string): void {
    this.entities +=
      this.head('CIRCLE', layer, 'AcDbCircle') +
      pair(' 10', cx.toFixed(6)) +
      pair(' 20', cy.toFixed(6)) +
      pair(' 30', '0.0') +
      pair(' 40', r.toFixed(6));
  }

  polyline(points: Point[], layer: string, closed = false): void {
    if (points.length < 2) return;
    this.entities +=
      this.head('LWPOLYLINE', layer, 'AcDbPolyline') +
      pair(' 90', points.length) +
      pair(' 70', closed ? 1 : 0);
    for (const p of points) {
      this.entities += pair(' 10', p.x.toFixed(6)) + pair(' 20', p.y.toFixed(6));
    }
  }

  /** One placement of a block: the INSERT that makes it move as one thing. */
  insert(
    name: string,
    x: number,
    y: number,
    layer: string,
    rotationDeg = 0,
    scale = 1,
  ): void {
    this.entities +=
      this.head('INSERT', layer, 'AcDbBlockReference') +
      pair('  2', name) +
      pair(' 10', x.toFixed(6)) +
      pair(' 20', y.toFixed(6)) +
      pair(' 30', '0.0') +
      pair(' 41', scale.toFixed(6)) +
      pair(' 42', scale.toFixed(6)) +
      pair(' 43', scale.toFixed(6)) +
      pair(' 50', rotationDeg.toFixed(6));
  }
}
