// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '@state/EditorStore';
import { buildDxf } from '@io/exportDxf/buildDxf';
import { dxfFileName } from '@io/exportDxf/dxfFileName';
import type { ToolId } from '../../core/types';
import { getTool } from '../../tools/registry';

/**
 * A CLICK ON THE SHEET, FOR A HOST THAT KNOWS WHAT IS UNDER IT.
 *
 * `selection` says which block was picked; it cannot say which pin of a
 * host's drawing the click landed on, because inside a `marks` block the pins
 * are only lines and fills. The host drew them and knows where they are, so
 * this side says WHERE the click landed and lets the host hit-test its own
 * model: `pick` { at, count, tool, shift, ctrl, client }.
 *
 *   at      [x, y] in drawing units, unsnapped.
 *   count   1 for a click, 2 for a double-click (which follows two clicks).
 *   tool    the tool that was active; a host acts on 'select' only.
 *   client  [x, y] in this window's client pixels, to anchor a card near it
 *           (the host adds its iframe's offset).
 *
 * A press that travelled more than a few pixels before it was released was a
 * drag (a block moved, a marquee), not a click, and says nothing.
 */
export const PICK_SLOP_PX = 4;

export function pickForHost(
  store: Pick<EditorStore, 'view' | 'tool'>,
  rect: { left: number; top: number },
  e: Pick<MouseEvent, 'clientX' | 'clientY' | 'shiftKey' | 'ctrlKey' | 'metaKey'>,
  count: 1 | 2,
) {
  const w = store.view.toWorld(e.clientX - rect.left, e.clientY - rect.top);
  return {
    at: [w.x, w.y],
    count,
    tool: String(store.tool.id),
    shift: !!e.shiftKey,
    ctrl: !!(e.ctrlKey || e.metaKey),
    client: [e.clientX, e.clientY],
  };
}

/** Listen for clicks on the editor's canvas (whichever canvas it has now) and hand each one to `post`. */
export function installHostPick(store: EditorStore, post: (body: ReturnType<typeof pickForHost>) => void): void {
  let down: { x: number; y: number } | null = null;
  const onCanvas = (e: Event) => !!store.canvas && e.target === store.canvas;
  window.addEventListener('mousedown', (e) => {
    down = onCanvas(e) && e.button === 0 ? { x: e.clientX, y: e.clientY } : null;
  }, true);
  const send = (e: MouseEvent, count: 1 | 2) => {
    if (!onCanvas(e) || e.button !== 0 || !store.canvas) return;
    if (count === 1 && (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > PICK_SLOP_PX)) return;
    post(pickForHost(store, store.canvas.getBoundingClientRect(), e, count));
  };
  window.addEventListener('click', (e) => send(e, 1));
  window.addEventListener('dblclick', (e) => send(e, 2));
}

/**
 * `dxf` asks for the sheet as the File menu's Download DXF would write it, and
 * gets `dxf` { fileName, text } back — so a host's own "dxf" button exports
 * what is on the CAD sheet (where the blocks are now), not a copy it keeps.
 */
export function dxfForHost(store: Pick<EditorStore, 'doc' | 'units' | 'layers' | 'schematic' | 'currentFileName'>) {
  return {
    fileName: dxfFileName(store.units, store.currentFileName),
    text: buildDxf(store.doc, store.units, store.layers.values(), store.schematic),
  };
}

/**
 * `tool` { id } puts a tool in the user's hand, as its toolbar button would.
 * The drawing door opens holding Line, which is right for a host whose sheet
 * is drawn on (the acoustic room) and wrong for one whose sheet is read and
 * rearranged (the Simulation): there the first click should select, so a
 * group drags and a `pick` is acted on. An id this editor does not have is
 * ignored.
 */
export function applyHostTool(store: Pick<EditorStore, 'setTool'>, { id }: Record<string, unknown>): boolean {
  if (typeof id !== 'string') return false;
  try { getTool(id as ToolId); } catch { return false; }
  store.setTool(id as ToolId);
  return true;
}
