// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '../../state/EditorStore';
import { applyPuck, foldPuck, puckMoveOf, type PuckMove } from './puckFrame';

/**
 * Listen for the OS shell's puck frames (puckFrame.ts) and pan/zoom the sheet.
 * Only the window that holds this one (the shell, or the page it docks us in)
 * is listened to. Frames fold until the next animation frame, then the view
 * changes once and draws once, as a wheel turn does. Returns the detach.
 */
export function installPuck(store: Pick<EditorStore, 'view' | 'requestDraw' | 'emit'> & Partial<Pick<EditorStore, 'entrance'>>): () => void {
  // the Big Picture door is the schematic canvas: its own switch (ROAD-3624)
  const consumer = store.entrance?.entrance === 'big-picture' ? 'schematic' : 'cad';
  let pending: PuckMove | null = null;
  let frame = 0;
  const flush = () => {
    frame = 0;
    const move = pending;
    pending = null;
    if (!move) return;
    applyPuck(store.view, move);
    store.requestDraw();
    store.emit();
  };
  const onMessage = (e: MessageEvent) => {
    if (window.parent === window || (e.source !== window.parent && e.source !== window.top)) return;
    const move = puckMoveOf(e.data, consumer);
    if (!move) return;
    pending = foldPuck(pending, move);
    if (!frame) frame = requestAnimationFrame(flush);
  };
  window.addEventListener('message', onMessage);
  return () => {
    window.removeEventListener('message', onMessage);
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    pending = null;
  };
}
