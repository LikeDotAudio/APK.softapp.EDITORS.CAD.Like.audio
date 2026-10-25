// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '../../state/EditorStore';
import { parsePalette } from '../../model/palette/parsePalette';
import type { SavedSession } from '../../io/browserStorage/SavedSession';
import { buildSavedSession } from '../../state/actions/autoSaveSession';
import { applySavedSession } from '../../state/actions/restoreBrowserSession';
import { currentHost } from '../entrance';
import { applyHostMarks, marksInDoc } from './hostMarks';
import { placeHostItems } from './hostPlace';
import { moveHostItems, removeHostItems, repaintHostItems } from './hostMove';
import { ensureHostLayer } from './hostLayer';
import { showHostSheet } from './hostSheet';
import { applyHostLayers, applyHostSelect, applyHostWalls, selectionForHost } from './hostWalls';
import { pickedOutline, sceneForHost, wallsForHost } from './sceneForHost';

/**
 * THE DOOR FOR SOFTAPPS BUILT ON THIS ONE
 *
 * When this editor runs inside another softapp's iframe, it tells the parent
 * three things over `postMessage`, and nothing more:
 *
 *   `view`      the world→screen transform and where the canvas sits in this
 *               window — so the host can lay its own layer exactly over ours.
 *               Sent whenever pan, zoom or the canvas box moves.
 *   `geometry`  the visible sheet as walls, closed rooms and palette patches
 *               (sceneForHost). Sent whenever the drawing, its units or its
 *               layers change. `patches` is every fill and block placed from
 *               the host's palette: { id: 'fill:<n>' | 'block:<n>',
 *               paletteId, layerId, points } in drawing units.
 *   `mirror`    the Virtual Mirror — whether Symmetrical Mode is on and every
 *               axis x. A host that places things in pairs (the acoustic
 *               overlay's L/R speakers) mirrors across THIS axis rather than
 *               keeping one of its own, so the sheet and the overlay agree on
 *               where the centre line is.
 *
 * The host may send `hello` (resend all three now), `fit` (zoom to the
 * drawing), `mirror` { x, enabled } (put the primary axis there) and `sheet`
 * { layer, color?, seed? } (jump to the drawing on that layer and make it
 * current, drawing `seed` there first if the layer is empty — hostSheet.ts)
 * and `palette` { title, items } — the host's materials (model/palette):
 * each item { id, name, category, color, hatch?, size?: [w, h] metres, note? }.
 * The Palette panel appears with it; an item with a size is placed as a
 * true-size block (`PAL:<id>`, base point at its centre, attribute paletteId),
 * one without is painted as a region (a fill with paletteId). A new palette
 * replaces the last. `arm` { paletteId } picks one of those items for the
 * user to place next, as if they had clicked it in the panel (null disarms) —
 * the host's "＋ Desk" button is this.
 *
 * `place` { layer, items: [{ paletteId, at, rotation? }] } puts palette
 * products on the sheet as the user's own blocks, one undo step (hostPlace.ts)
 * — the furniture a library room comes with. `move` { items: [{ id, at,
 * rotation? }] } sets where one of those placed products sits (hostMove.ts),
 * off the undo stack: the acoustic overlay keeps the console at the mixer's nose.
 * `remove` { ids } takes placed products out, one undo step (hostMove.ts).
 *
 * `layer` { name, color?, finish? } makes sure a layer exists (without making
 * it current) and sets its finish — a palette id, or null (hostLayer.ts).
 * Geometry carries each layer's finish, and the rooms found three ways —
 * one clean loop, a drawing's outline, or a selection that closed a loop,
 * remembered for the session as "these are walls" (sceneForHost).
 *
 * `walls` { op, … } reshapes the room from the host's plan — a corner or a
 * whole wall dragged, a wall added (hostWalls.ts); `layers` { visible }
 * switches layers on and off by name; `select` { edges, blocks } selects
 * here what the host picked. Every change of selection here goes back as
 * `selection` { edges, blocks } (selectionForHost), so the host can call out
 * what the user picked on the sheet.
 *
 * `marks` { key, hash, items } is the host's own line work and panels, drawn
 * into the sheet and kept current (hostMarks.ts); `geometry` carries `marks`
 * { key: hash } back, so the host knows what is on the sheet.
 *
 * SAVING A SESSION. `session` asks for the whole drawing — the same object
 * the browser autosaves (SavedSession), without the user's sign-in — and
 * gets `session` { session } back; `open` { session } puts one on the sheet,
 * replacing what is there (one undo step). The host bundles it with its own
 * state into a file that can be carried to another machine.
 * Same-origin only, both ways: a softapp is served from the same OS as we are,
 * and a stranger's page has no business reading the sheet.
 *
 * Popped out: a host may open this editor in a window of its own instead of
 * its iframe (`window.open` of the same `#/drawing?host=…` address). Then
 * the host is `window.opener`, and the same protocol runs over that — but
 * only when the address names a host, so a window some page merely opened
 * says nothing to it. `view` still describes this window's canvas; a host
 * whose overlay is no longer over it ignores that.
 *
 * Standalone (no parent, no opening host), every call here is a no-op.
 */

export const HOST_PROTOCOL = 'cad.like.audio/host@1';

let installed = false;
let lastView = '';
let lastGeometry = '';
let lastMirror = '';
/** Every set of edges the user has selected that closed a loop, this session: "these are walls", taken without asking. */
const picked = new Map<string, number[]>();
let lastSelection = '';

/** The window driving this one: the parent frame, else the softapp that popped us out. */
function host(): Window | null {
  if (typeof window === 'undefined') return null;
  if (window.parent !== window) return window.parent;
  const opener = window.opener as Window | null;
  return opener && !opener.closed && currentHost() !== null ? opener : null;
}

function post(type: string, body: object): void {
  host()?.postMessage({ protocol: HOST_PROTOCOL, type, ...body }, window.location.origin);
}

function install(store: EditorStore): void {
  installed = true;
  window.addEventListener('message', (e: MessageEvent) => {
    if (e.source !== host() || e.origin !== window.location.origin) return;
    const msg = e.data as { protocol?: string; type?: string } | null;
    if (!msg || msg.protocol !== HOST_PROTOCOL) return;
    if (msg.type === 'hello') {
      lastView = '';
      lastGeometry = '';
      lastMirror = '';
      publishToHost(store);
    } else if (msg.type === 'fit') {
      store.zoomToFit();
    } else if (msg.type === 'mirror') {
      const { x, enabled } = msg as { x?: unknown; enabled?: unknown };
      if (typeof x === 'number' && Number.isFinite(x)) store.setVirtualMirror(x, enabled !== false, false);
    } else if (msg.type === 'sheet') {
      const { layer, color, seed } = msg as { layer?: unknown; color?: unknown; seed?: unknown };
      if (typeof layer === 'string' && layer.trim()) showHostSheet(store, layer.trim(), color, seed);
    } else if (msg.type === 'palette') {
      const palette = parsePalette(msg);
      if (palette) store.setPalette(palette);
    } else if (msg.type === 'arm') {
      const { paletteId } = msg as { paletteId?: unknown };
      store.armPaletteItem(typeof paletteId === 'string' ? paletteId : null);
    } else if (msg.type === 'place') {
      placeHostItems(store, msg as { layer?: unknown; items?: unknown });
    } else if (msg.type === 'layer') {
      ensureHostLayer(store, msg as { name?: unknown; color?: unknown; finish?: unknown });
    } else if (msg.type === 'move') {
      moveHostItems(store, msg as { items?: unknown });
    } else if (msg.type === 'remove') {
      removeHostItems(store, msg as { ids?: unknown });
    } else if (msg.type === 'repaint') {
      repaintHostItems(store, msg as { ids?: unknown; paletteId?: unknown });
    } else if (msg.type === 'walls') {
      applyHostWalls(store, msg as Parameters<typeof applyHostWalls>[1]);
    } else if (msg.type === 'layers') {
      applyHostLayers(store, msg as { visible?: unknown });
    } else if (msg.type === 'select') {
      applyHostSelect(store, msg as { edges?: unknown; blocks?: unknown });
    } else if (msg.type === 'marks') {
      applyHostMarks(store, msg as { key?: unknown; hash?: unknown; items?: unknown });
    } else if (msg.type === 'session') {
      post('session', { session: { ...buildSavedSession(store), userAuth: undefined } });
    } else if (msg.type === 'open') {
      const { session } = msg as { session?: SavedSession };
      if (session && Array.isArray(session.docSnapshot?.edges)) void openSession(store, session);
    }
  });
  post('ready', {});
}

async function openSession(store: EditorStore, session: SavedSession): Promise<void> {
  store.history.push(store.doc.snapshot());
  await applySavedSession(store, { ...session, userAuth: undefined });
  await store.autoSaveSession(false);
  store.showHint(`Opened ${session.currentFileName ?? 'the session'} from the host's file.`, 4000);
}

/** Called after every frame; sends only what changed since the last one. */
export function publishToHost(store: EditorStore): void {
  if (!host() || !store.canvas) return;
  if (!installed) install(store);

  const r = store.canvas.getBoundingClientRect();
  const { zoom, panX, panY } = store.view;
  const rect = { left: r.left, top: r.top, width: r.width, height: r.height };
  const viewKey = [zoom, panX, panY, rect.left, rect.top, rect.width, rect.height].join();
  if (viewKey !== lastView) {
    lastView = viewKey;
    post('view', { zoom, panX, panY, rect, units: store.units });
  }

  // a selection that closes a loop is remembered as walls
  const selKey = [...store.selection].sort((a, b) => a - b).join();
  if (selKey !== lastSelection) {
    lastSelection = selKey;
    const ids = [...store.selection].filter((id) => store.doc.edge(id));
    // only the selection's own lines, so the test is cheap: a pile of walls or a single outline
    if (ids.length >= 3 && pickedOutline(wallsForHost(store.doc, store.layers), ids)) picked.set(ids.sort((a, b) => a - b).join(), ids);
    post('selection', selectionForHost(store));
  }
  const layerKey = [...store.layers.values()].map((l) => `${l.id}:${l.visible ? 1 : 0}:${l.color}:${l.finish ?? ''}`).join();
  const geometryKey = `${store.docVersion}|${store.units}|${layerKey}|${store.doc.edgeCount}|${[...picked.keys()].join(';')}`;
  if (geometryKey !== lastGeometry) {
    lastGeometry = geometryKey;
    post('geometry', { fileName: store.currentFileName, ...sceneForHost(store.doc, store.units, store.layers, [...picked.values()]), marks: marksInDoc(store.doc) });
  }

  const { enabled, x } = store.mirror;
  const axes = (store.mirror.mirrors ?? []).map((m) => m.x);
  const mirrorKey = `${enabled}|${x}|${axes.join()}`;
  if (mirrorKey !== lastMirror) {
    lastMirror = mirrorKey;
    post('mirror', { enabled, x, axes });
  }
}
