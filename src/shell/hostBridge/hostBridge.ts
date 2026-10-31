// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '@state/EditorStore';
import { parsePalette } from '../../model/palette/parsePalette';
import type { SavedSession } from '@io/browserStorage/SavedSession';
import { buildSavedSession } from '@state/actions/autoSaveSession';
import { applySavedSession } from '@state/actions/restoreBrowserSession';
import { currentHost } from '../entrance';
import { handoverFromHash, offerHandover, receiveHandover } from './hostHandover';
import { applyHostMarks, marksInDoc } from './hostMarks';
import { placeHostItems } from './hostPlace';
import { moveHostItems, removeHostItems, repaintHostItems } from './hostMove';
import { ensureHostLayer } from './hostLayer';
import { showHostSheet } from './hostSheet';
import { applyHostSpaces } from './hostSpaces';
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
 *
 * `floorplan` { file } opens a floor plan the user picked in the host, as
 * File → Open does here: a .dxf replaces the drawing (its own units, mm when
 * it names none, brought to this sheet's), an image goes under a cleared sheet
 * to trace, scaled by two points the user knows the distance between. Either way the drawing takes the file's name, so the host starts a
 * fresh overlay for it.
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
 * MOVING THE DRAWING to that window is CAD to CAD (hostHandover.ts): the host
 * opens it at `…&resume&handover=<token>` and sends the docked CAD `handover`
 * { token }; the two pass the session over a BroadcastChannel and the host
 * never holds it. The new window says `ready` only once it has the drawing
 * (or, with nobody answering, the browser's autosave) — so a host blanks its
 * iframe after the move, not before. `session` above is for the host's own
 * file, not for this.
 *
 * Standalone (no parent, no opening host), every call here is a no-op.
 */

export const HOST_PROTOCOL = 'cad.like.audio/host@1';

/*
 * THE PUBLISHED SHAPE. The protocol above is written down as a JSON Schema with
 * sample messages in `contract/host@1/` at the root of this repository — that,
 * not this comment, is what a host builds against. `hostContract.test.ts`
 * holds this file to it both ways: every type `HOST_HANDLERS` answers and every
 * type `post` sends is in the schema, and what sceneForHost / selectionForHost
 * actually emit validates. A host (EDITORS.Acoustic.Like.audio) vendors the same
 * directory and runs the same samples against its own side.
 *
 * CHANGING IT. A new optional field or a new message type is still `@1`: a
 * host that does not know it ignores it. Renaming or removing a field, or
 * changing what one means, is `@2` — and for one release this bridge answers
 * BOTH `@1` and `@2` (the hosts move over in that window), then drops `@1`.
 * Every change to `contract/` bumps `version` in package.json.
 */

/** What this side sends a host. */
export const HOST_OUTBOUND_TYPES = ['ready', 'view', 'selection', 'geometry', 'mirror', 'session'] as const;
export type HostOutboundType = (typeof HOST_OUTBOUND_TYPES)[number];

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

function post(type: HostOutboundType, body: object): void {
  host()?.postMessage({ protocol: HOST_PROTOCOL, type, ...body }, window.location.origin);
}

type HostMessage = Record<string, unknown>;

/** Every message a host may send, and what it does here. The keys are the protocol's inbound vocabulary. */
export const HOST_HANDLERS: Record<string, (store: EditorStore, msg: HostMessage) => void> = {
  hello: (store) => {
    lastView = '';
    lastGeometry = '';
    lastMirror = '';
    publishToHost(store);
  },
  fit: (store) => store.zoomToFit(),
  mirror: (store, { x, enabled }) => {
    if (typeof x === 'number' && Number.isFinite(x)) store.setVirtualMirror(x, enabled !== false, false);
  },
  sheet: (store, { layer, color, seed }) => {
    if (typeof layer === 'string' && layer.trim()) showHostSheet(store, layer.trim(), color, seed);
  },
  palette: (store, msg) => {
    const palette = parsePalette(msg);
    if (palette) store.setPalette(palette);
  },
  arm: (store, { paletteId }) => store.armPaletteItem(typeof paletteId === 'string' ? paletteId : null),
  place: (store, msg) => void placeHostItems(store, msg),
  layer: (store, msg) => void ensureHostLayer(store, msg),
  move: (store, msg) => void moveHostItems(store, msg),
  remove: (store, msg) => void removeHostItems(store, msg),
  spaces: (store, msg) => void applyHostSpaces(store, msg),
  repaint: (store, msg) => void repaintHostItems(store, msg),
  walls: (store, msg) => void applyHostWalls(store, msg),
  layers: (store, msg) => void applyHostLayers(store, msg),
  select: (store, msg) => applyHostSelect(store, msg),
  marks: (store, msg) => applyHostMarks(store, msg),
  session: (store) => post('session', { session: { ...buildSavedSession(store), userAuth: undefined } }),
  handover: (store, { token }) => {
    if (typeof token === 'string' && /^[\w-]{1,64}$/.test(token)) offerHandover(token, () => buildSavedSession(store));
  },
  open: (store, { session }) => {
    const s = session as SavedSession | undefined;
    if (s && Array.isArray(s.docSnapshot?.edges)) void openSession(store, s);
  },
  floorplan: (store, { file }) => {
    if (file instanceof File) void openFloorPlan(store, file);
  },
};

function install(store: EditorStore): void {
  installed = true;
  window.addEventListener('message', (e: MessageEvent) => {
    if (e.source !== host() || e.origin !== window.location.origin) return;
    const msg = e.data as HostMessage | null;
    if (!msg || msg.protocol !== HOST_PROTOCOL || typeof msg.type !== 'string') return;
    if (Object.hasOwn(HOST_HANDLERS, msg.type)) HOST_HANDLERS[msg.type]!(store, msg);
  });
  // a window the drawing is being handed to is not ready until it has it
  void arrived.then(() => post('ready', {}));
}

/** Settles once a resumed editor has its drawing; until then it does not tell its host `ready`. */
let arrived: Promise<void> = Promise.resolve();

/**
 * `&resume`: the host moved this editor between its iframe and a window. With
 * `&handover=<token>` the drawing comes straight from the other CAD; without,
 * or when it does not answer, from the browser's autosave.
 */
export function resumeFromHost(store: EditorStore, hash: string): Promise<void> {
  const token = handoverFromHash(hash);
  arrived = (async () => {
    const session = token ? await receiveHandover(token) : null;
    if (!session) return store.restoreBrowserSession();
    await applySavedSession(store, { ...session, userAuth: undefined });
    await store.autoSaveSession(false);
    store.showHint(`${session.currentFileName ?? 'The drawing'} came over from the docked editor.`, 4000);
  })().catch(() => undefined);
  return arrived;
}

async function openSession(store: EditorStore, session: SavedSession): Promise<void> {
  store.history.push(store.doc.snapshot());
  await applySavedSession(store, { ...session, userAuth: undefined });
  await store.autoSaveSession(false);
  store.showHint(`Opened ${session.currentFileName ?? 'the session'} from the host's file.`, 4000);
}

async function openFloorPlan(store: EditorStore, file: File): Promise<void> {
  if (/\.dxf$/i.test(file.name)) await store.loadDxfText(await file.text(), file.name);
  else if (file.type.startsWith('image/')) {
    // a new layout, not a tracing over the last room: the sheet is cleared first (one undo step)
    store.clearAll();
    await store.importImage(file);
  }
  else store.showHint(`${file.name} is not a floor plan this editor opens: a .dxf, or an image to trace.`, 4000);
}

/** The `view` body: the world→screen transform and the canvas box in this window. */
export function viewForHost(store: Pick<EditorStore, 'view' | 'units'>, rect: { left: number; top: number; width: number; height: number }) {
  const { zoom, panX, panY } = store.view;
  return { zoom, panX, panY, rect, units: store.units };
}

/** The `geometry` body: the visible sheet (sceneForHost), its file name, and the marks hash per key. */
export function geometryForHost(store: Pick<EditorStore, 'doc' | 'units' | 'layers' | 'currentFileName'>, pickedLoops: readonly (readonly number[])[]) {
  return { fileName: store.currentFileName, ...sceneForHost(store.doc, store.units, store.layers, pickedLoops), marks: marksInDoc(store.doc) };
}

/** The `mirror` body: whether Symmetrical Mode is on, its primary axis and every axis x. */
export function mirrorForHost(store: Pick<EditorStore, 'mirror'>) {
  const { enabled, x } = store.mirror;
  return { enabled, x, axes: (store.mirror.mirrors ?? []).map((m) => m.x) };
}

/** Called after every frame; sends only what changed since the last one. */
export function publishToHost(store: EditorStore): void {
  if (!host() || !store.canvas) return;
  if (!installed) install(store);

  const r = store.canvas.getBoundingClientRect();
  const view = viewForHost(store, { left: r.left, top: r.top, width: r.width, height: r.height });
  const viewKey = [view.zoom, view.panX, view.panY, view.rect.left, view.rect.top, view.rect.width, view.rect.height].join();
  if (viewKey !== lastView) {
    lastView = viewKey;
    post('view', view);
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
    post('geometry', geometryForHost(store, [...picked.values()]));
  }

  const mirror = mirrorForHost(store);
  const mirrorKey = `${mirror.enabled}|${mirror.x}|${mirror.axes.join()}`;
  if (mirrorKey !== lastMirror) {
    lastMirror = mirrorKey;
    post('mirror', mirror);
  }
}
