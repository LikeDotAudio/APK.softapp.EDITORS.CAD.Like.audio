// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '@state/EditorStore';
import { buildDxf } from '@io/exportDxf/buildDxf';
import { dxfFileName } from '@io/exportDxf/dxfFileName';
import type { ToolId } from '../../core/types';
import { getTool } from '../../tools/registry';
import { hostPickAt } from './hostDrag';
import { DOC_UNITS } from '../../model/units/docUnits';
import { sessionIfc } from '@io/ifc/sessionIfc';
import { buildSavedSession } from '@state/actions/autoSaveSession';

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
 *   host    on one of the host's own `schematic` blocks: { key, ref, terminal? }
 *           (terminal: the caption of the port clicked), or { key, group } inside
 *           one of its groups — the CAD knows its ports, so it says (hostDrag.ts).
 *
 * A press that travelled more than a few pixels before it was released was a
 * drag (a block moved, a marquee), not a click, and says nothing.
 */
export const PICK_SLOP_PX = 4;

export function pickForHost(
  store: Pick<EditorStore, 'view' | 'tool'> & Partial<Pick<EditorStore, 'schematic'>>,
  rect: { left: number; top: number },
  e: Pick<MouseEvent, 'clientX' | 'clientY' | 'shiftKey' | 'ctrlKey' | 'metaKey'>,
  count: 1 | 2,
) {
  const w = store.view.toWorld(e.clientX - rect.left, e.clientY - rect.top);
  const host = store.schematic ? hostPickAt(store.schematic, w, (PICK_SLOP_PX + 2) / (store.view.zoom || 1)) : null;
  return {
    ...(host ? { host } : {}),
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
export function dxfForHost(
  store: Pick<EditorStore, 'doc' | 'units' | 'layers' | 'schematic' | 'currentFileName'>,
  ifc?: string,
) {
  return {
    fileName: dxfFileName(DOC_UNITS, store.currentFileName),
    // in mm, $INSUNITS 4 (cad-1); with `ifc` its objects ride on the hidden APK_IFC layer (ROAD-3598)
    text: buildDxf(store.doc, DOC_UNITS, store.layers.values(), store.schematic, ifc),
  };
}

/**
 * The host@1 `dxf` answer: the sheet as Download DXF writes it, WITH the drawing's model
 * (the same .ifc Save Model writes) on the hidden APK_IFC layer — so a host's own "dxf"
 * button (the Simulation's) hands over what File › Download DXF would (ROAD-3598 answer 2).
 * A model that cannot be made leaves the DXF the drawing alone.
 */
export async function dxfForHostWithIfc(store: EditorStore): Promise<ReturnType<typeof dxfForHost>> {
  let ifc: string | undefined;
  try {
    ifc = await sessionIfc(buildSavedSession(store), undefined, store.viewports);
  } catch {
    ifc = undefined;
  }
  return dxfForHost(store, ifc);
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
