// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '../EditorStore';
import { createMirror, reflectMirrorAcross, type VirtualMirror } from '../../core/mirror';

/**
 * "A mirror can mirror another mirror!"
 * Reflects mirrors across other mirrors, creating new mirrored reflection planes
 * that also replicate any CAD geometry across them.
 */
export function mirrorAnotherMirror(store: EditorStore): VirtualMirror[] {
  // Ensure we have mirrors to work with
  if (store.mirror.mirrors.length === 0) {
    // If no mirrors exist yet, create initial mirror at store.mirror.x or 0
    const m1 = createMirror(store.mirror.x, 'Mirror Alpha', undefined, '#00f7ff');
    store.mirror.mirrors.push(m1);
  }

  if (store.mirror.mirrors.length === 1) {
    // With one mirror at X1, create a secondary mirror at offset and reflect
    const m1 = store.mirror.mirrors[0];
    const offset = store.gridSize * 16 || 4;
    const m2 = createMirror(m1.x + offset, 'Mirror Beta', undefined, '#38bdf8');
    store.mirror.mirrors.push(m2);

    // Now mirror M2 across M1 -> creates M3 at 2*m1.x - m2.x
    const m3 = reflectMirrorAcross(m2, m1.x, m1.name);
    store.mirror.mirrors.push(m3);

    // Also reflect selection or all doc geometry across the new mirror!
    store.doc.reflectAcrossMirror(store.selection, m3.x);

    store.mirror.enabled = true;
    store.mirror.selected = true;
    store.requestDraw();
    store.emit();

    store.showHint(
      `Mirrored "${m2.name}" across "${m1.name}" ➔ New Virtual Mirror at X = ${m3.x.toFixed(2)} (CAD edge glowing)!`,
      4000,
    );
    return [m3];
  }

  // With 2 or more mirrors: find the active axis and reflect the other mirrors across it
  const selectedMirrors = store.mirror.mirrors.filter((m) => m.selected);
  const activeAxis = selectedMirrors.length === 1 ? selectedMirrors[0] : store.mirror.mirrors[0];
  const targets = store.mirror.mirrors.filter((m) => m.id !== activeAxis.id);

  const newlyCreated: VirtualMirror[] = [];
  for (const target of targets) {
    // Avoid creating duplicates at the same X coordinate
    const targetReflectedX = 2 * activeAxis.x - target.x;
    const alreadyExists = store.mirror.mirrors.some(
      (m) => Math.abs(m.x - targetReflectedX) < 1e-4,
    );
    if (!alreadyExists) {
      const newMirror = reflectMirrorAcross(target, activeAxis.x, activeAxis.name);
      store.mirror.mirrors.push(newMirror);
      newlyCreated.push(newMirror);

      // Reflect current geometry across the newly reflected mirror
      store.doc.reflectAcrossMirror(store.selection, newMirror.x);
    }
  }

  if (newlyCreated.length === 0) {
    // If all positions exist, create an opposite reflection
    const mReflected = reflectMirrorAcross(activeAxis, activeAxis.x + 10, 'Offset Plane');
    store.mirror.mirrors.push(mReflected);
    newlyCreated.push(mReflected);
    store.doc.reflectAcrossMirror(store.selection, mReflected.x);
  }

  store.mirror.enabled = true;
  store.mirror.selected = true;
  store.requestDraw();
  store.emit();

  store.showHint(
    `Reflected mirror(s) across "${activeAxis.name}"! Created ${newlyCreated.length} mirrored mirror(s) with glowing CAD edges.`,
    4000,
  );
  return newlyCreated;
}
