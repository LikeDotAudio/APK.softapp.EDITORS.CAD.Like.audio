// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '../../state/EditorStore';
import { parsePalette } from '../../model/palette/parsePalette';
import { showHostSheet } from './hostSheet';
import { sceneForHost } from './sceneForHost';

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
 * replaces the last.
 * Same-origin only, both ways: a softapp is served from the same OS as we are,
 * and a stranger's page has no business reading the sheet.
 *
 * Standalone (no parent), every call here is a no-op.
 */

export const HOST_PROTOCOL = 'cad.like.audio/host@1';

let installed = false;
let lastView = '';
let lastGeometry = '';
let lastMirror = '';

function embedded(): boolean {
  return typeof window !== 'undefined' && window.parent !== window;
}

function post(type: string, body: object): void {
  window.parent.postMessage({ protocol: HOST_PROTOCOL, type, ...body }, window.location.origin);
}

function install(store: EditorStore): void {
  installed = true;
  window.addEventListener('message', (e: MessageEvent) => {
    if (e.source !== window.parent || e.origin !== window.location.origin) return;
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
    }
  });
  post('ready', {});
}

/** Called after every frame; sends only what changed since the last one. */
export function publishToHost(store: EditorStore): void {
  if (!embedded() || !store.canvas) return;
  if (!installed) install(store);

  const r = store.canvas.getBoundingClientRect();
  const { zoom, panX, panY } = store.view;
  const rect = { left: r.left, top: r.top, width: r.width, height: r.height };
  const viewKey = [zoom, panX, panY, rect.left, rect.top, rect.width, rect.height].join();
  if (viewKey !== lastView) {
    lastView = viewKey;
    post('view', { zoom, panX, panY, rect, units: store.units });
  }

  const layerKey = [...store.layers.values()].map((l) => `${l.id}:${l.visible ? 1 : 0}:${l.color}`).join();
  const geometryKey = `${store.docVersion}|${store.units}|${layerKey}|${store.doc.edgeCount}`;
  if (geometryKey !== lastGeometry) {
    lastGeometry = geometryKey;
    post('geometry', { fileName: store.currentFileName, ...sceneForHost(store.doc, store.units, store.layers) });
  }

  const { enabled, x } = store.mirror;
  const axes = (store.mirror.mirrors ?? []).map((m) => m.x);
  const mirrorKey = `${enabled}|${x}|${axes.join()}`;
  if (mirrorKey !== lastMirror) {
    lastMirror = mirrorKey;
    post('mirror', { enabled, x, axes });
  }
}
