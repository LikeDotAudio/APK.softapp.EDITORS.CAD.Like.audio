// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '../EditorStore';
import { createMirror } from '../../core/mirror';

export function setVirtualMirror(
  store: EditorStore,
  x: number,
  enabled = true,
  selected = true,
): void {
  store.mirror.x = x;
  store.mirror.enabled = enabled;
  store.mirror.selected = selected;

  if (!store.mirror.mirrors) {
    store.mirror.mirrors = [];
  }
  if (store.mirror.mirrors.length === 0) {
    store.mirror.mirrors.push(createMirror(x, 'Mirror Alpha', undefined, '#00f7ff'));
  } else {
    const sel = store.mirror.mirrors.find((m) => m.selected);
    if (sel) {
      sel.x = x;
    } else {
      store.mirror.mirrors[0].x = x;
      store.mirror.mirrors[0].selected = selected;
    }
  }

  store.requestDraw();
  store.emit();
  store.showHint(
    `Virtual Mirror placed at X = ${x.toFixed(2)}. CAD edge glowing · Symmetrical Mode active.`,
    3500,
  );
}
