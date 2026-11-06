// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { enumv, real, ref, typed, writeStep, type StepEntity, type StepRecord, type StepRef, type StepValue } from '../../vendor/ifc/step';
import { ifcGuid } from '../../vendor/ifc/guid';

/**
 * A STEP file being written, one entity at a time, numbered in the order they
 * are added — so the same session always writes the same bytes. The codec is
 * the contracts one (src/vendor/ifc, byte copies of contracts/src/ifc).
 */
export class StepBuilder {
  readonly entities: StepEntity[] = [];
  private nextId = 1;
  /** Entities written once per file, keyed by their text (units, directions). */
  private readonly shared = new Map<string, StepRef>();

  add(type: string, args: StepValue[]): StepRef {
    const id = this.nextId++;
    this.entities.push({ id, type, args });
    return ref(id);
  }

  /** The same entity once: a second `once` with equal type and args returns the first. */
  once(type: string, args: StepValue[]): StepRef {
    const key = JSON.stringify([type, args]);
    const hit = this.shared.get(key);
    if (hit) return hit;
    const r = this.add(type, args);
    this.shared.set(key, r);
    return r;
  }

  entity(r: StepRef): StepEntity {
    return this.entities[r.id - 1]!;
  }

  write(header: StepRecord[]): string {
    return writeStep({ header, entities: this.entities });
  }
}

/** A REAL; -0 is written as 0 so a mirrored coordinate cannot print '-0.'. */
export const R = (x: number): StepValue => real(Object.is(x, -0) ? 0 : x);
export const E = enumv;
export const label = (s: string): StepValue => typed('IFCLABEL', s);
export const text = (s: string): StepValue => typed('IFCTEXT', s);
export const ident = (s: string): StepValue => typed('IFCIDENTIFIER', s);
export const int = (n: number): StepValue => typed('IFCINTEGER', Math.trunc(n));
export const bool = (b: boolean): StepValue => typed('IFCBOOLEAN', enumv(b ? 'T' : 'F'));
export const realv = (x: number): StepValue => typed('IFCREAL', R(x));
export const length = (x: number): StepValue => typed('IFCLENGTHMEASURE', R(x));
export const positiveLength = (x: number): StepValue => typed('IFCPOSITIVELENGTHMEASURE', R(x));

/** The GlobalId of one role of this drawing (contracts guid.ts grammar: cad/<docKey>/…). */
export const gid = (...roles: (string | number)[]): string => ifcGuid(...roles.map(String));

/** A property for a set: absent values are left out, so the set says only what the drawing says. */
export type PropValue = StepValue | undefined;
