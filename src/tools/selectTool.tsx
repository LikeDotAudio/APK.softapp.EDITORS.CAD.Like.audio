// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { edgesInChainOf } from '../model/topology/edgesInChainOf';
import { edgesInGroupOf } from '../model/topology/edgesInGroupOf';
import { dot } from '../render/dot';
import { CANVAS } from '../render/palette';
import { cornerCursor } from '../render/selectionBox/cornerCursor';
import { hitCorner } from '../render/selectionBox/hitCorner';
import { oppositeCorner } from '../render/selectionBox/oppositeCorner';
import { hitEndpointGrip } from './select/hitEndpointGrip';
import { hitMidpointGrip } from './select/hitMidpointGrip';
import { netBounds } from './select/netBounds';
import type { Point } from '../core/types';
import type { Tool } from './types';

interface ScaleDrag {
  /** Corner the drag is anchored to — stays put while the opposite corner follows the cursor. */
  anchor: Point;
  /** Cursor-to-anchor distance when the drag began. */
  startDist: number;
  /** Scale already applied, so each move only has to apply the delta. */
  appliedFactor: number;
  snapshot: boolean;
}

/** Dragging one endpoint grip: the vertex follows the cursor, the rest stays put. */
interface VertexDrag {
  vertexId: number;
  snapshot: boolean;
  moved: boolean;
}

/** Dragging a midpoint grip: that one edge follows the cursor. */
interface EdgeDrag {
  edgeId: number;
  lastWorld: Point;
  snapshot: boolean;
}

interface SelectState {
  dragStartWorld: Point | null;
  boxStartScreen: Point | null;
  boxEndScreen: Point | null;
  isMoving: boolean;
  movedSnapshot: boolean;
  scaling: ScaleDrag | null;
  vertexDrag: VertexDrag | null;
  edgeDrag: EdgeDrag | null;
  mirrorDrag: boolean;
  draggedMirrorId?: string;
}

const Icon = (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M3 2l10 6-5 1.5L6 14 3 2z" />
  </svg>
);

export const selectTool: Tool<SelectState> = {
  id: 'select',
  label: 'Select',
  shortcut: 's',
  title:
    'Select (S) — Click edge to select, drag an orange grip to reshape, drag to move, drag a corner handle to scale, or drag box select. Ctrl+C (Copy), Ctrl+Shift+C (Copy from reference point), Ctrl+X (Cut), Ctrl+V (Paste), Delete.',
  hint: 'Drag an orange endpoint grip to move it · Midpoint grip moves the segment · Corner handle scales · Ctrl+Shift+C copies from a reference point',
  icon: Icon,
  cursor: 'default',
  snaps: false,

  createState: () => ({
    dragStartWorld: null,
    boxStartScreen: null,
    boxEndScreen: null,
    isMoving: false,
    movedSnapshot: false,
    scaling: null,
    vertexDrag: null,
    edgeDrag: null,
    mirrorDrag: false,
  }),

  onPointerMove(state, input, api) {
    if (state.mirrorDrag) {
      if (state.draggedMirrorId && api.mirror.mirrors && api.mirror.mirrors.length > 0) {
        const target = api.mirror.mirrors.find((m) => m.id === state.draggedMirrorId);
        if (target) {
          target.x = input.world.x;
          target.selected = true;
        }
      }
      api.setVirtualMirror(input.world.x, true, true);
      return;
    }

    if (state.vertexDrag) {
      if (!state.vertexDrag.snapshot) {
        api.edit(() => true);
        state.vertexDrag.snapshot = true;
      }
      if (api.doc.moveVertex(state.vertexDrag.vertexId, input.rawWorld.x, input.rawWorld.y)) {
        state.vertexDrag.moved = true;
        api.redraw();
      }
      return;
    }

    if (state.edgeDrag) {
      const dx = input.rawWorld.x - state.edgeDrag.lastWorld.x;
      const dy = input.rawWorld.y - state.edgeDrag.lastWorld.y;
      if (dx !== 0 || dy !== 0) {
        if (!state.edgeDrag.snapshot) {
          api.edit(() => true);
          state.edgeDrag.snapshot = true;
        }
        api.doc.translateEdges([state.edgeDrag.edgeId], dx, dy);
        state.edgeDrag.lastWorld = input.rawWorld;
        api.redraw();
      }
      return;
    }

    if (state.scaling) {
      const { anchor, startDist } = state.scaling;
      const dist = Math.hypot(input.rawWorld.x - anchor.x, input.rawWorld.y - anchor.y);
      // Below this the selection would collapse onto the anchor and lose its shape.
      const target = Math.max(dist / startDist, 0.01);
      const delta = target / state.scaling.appliedFactor;

      if (Math.abs(delta - 1) > 1e-6) {
        if (!state.scaling.snapshot) {
          api.edit(() => true);
          state.scaling.snapshot = true;
        }
        api.doc.scaleEdges(api.selection, anchor.x, anchor.y, delta);
        state.scaling.appliedFactor = target;
        api.setMeasurement(`Scale ${target.toFixed(3)}×`);
        api.redraw();
      }
      return;
    }

    if (state.isMoving && state.dragStartWorld && api.selection.size > 0) {
      const dx = input.world.x - state.dragStartWorld.x;
      const dy = input.world.y - state.dragStartWorld.y;

      if (dx !== 0 || dy !== 0) {
        if (!state.movedSnapshot) {
          api.edit(() => true);
          state.movedSnapshot = true;
        }
        api.doc.translateSelection(api.selection, dx, dy);
        state.dragStartWorld = input.world;
        api.redraw();
      }
      return;
    }

    if (state.boxStartScreen) {
      state.boxEndScreen = input.screen;
      api.redraw();
      return;
    }

    const net = netBounds(api);
    const corner = net ? hitCorner(api.view, net, input.screen) : null;
    if (corner !== null) {
      api.setHoverEdge(null);
      api.setCursor(cornerCursor(corner));
      return;
    }

    // Grips take priority over the edge under them, so they stay catchable.
    if (hitEndpointGrip(api, input.screen) !== null || hitMidpointGrip(api, input.screen) !== null) {
      api.setHoverEdge(null);
      api.setCursor('move');
      return;
    }

    // Virtual mirror line hit detection
    if (api.mirror.enabled || api.mirror.selected || (api.mirror.mirrors && api.mirror.mirrors.length > 0)) {
      const mirrorsToCheck =
        api.mirror.mirrors && api.mirror.mirrors.length > 0
          ? api.mirror.mirrors
          : [{ id: 'primary', x: api.mirror.x, selected: api.mirror.selected }];
      const hitMirror = mirrorsToCheck.find((m) => {
        const mirrorScreenX = api.view.toScreen(m.x, 0).x;
        return Math.abs(input.screen.x - mirrorScreenX) <= 10;
      });
      if (hitMirror) {
        api.setHoverEdge(null);
        api.setCursor('col-resize');
        return;
      }
    }

    const textHit = api.doc.hitTextAt(input.rawWorld.x, input.rawWorld.y, api.view.zoom);
    const blockHit = textHit !== null ? null : api.doc.hitBlockInstanceAt(input.rawWorld.x, input.rawWorld.y, api.view.zoom);
    const hit = textHit !== null || blockHit !== null ? null : api.doc.hitEdgeAt(input.rawWorld.x, input.rawWorld.y, api.view.zoom);
    api.setHoverEdge(hit);
    api.setCursor(hit !== null || blockHit !== null || textHit !== null ? 'pointer' : 'default');
  },

  onPointerDown(state, input, api) {
    // Virtual mirror line selection & dragging (CAD edge glows when selected!)
    if (api.mirror.enabled || api.mirror.selected || (api.mirror.mirrors && api.mirror.mirrors.length > 0)) {
      const mirrorsToCheck =
        api.mirror.mirrors && api.mirror.mirrors.length > 0
          ? api.mirror.mirrors
          : [{ id: 'primary', x: api.mirror.x, selected: api.mirror.selected }];
      const hitMirror = mirrorsToCheck.find((m) => {
        const mirrorScreenX = api.view.toScreen(m.x, 0).x;
        return Math.abs(input.screen.x - mirrorScreenX) <= 10;
      });
      if (hitMirror) {
        state.mirrorDrag = true;
        state.draggedMirrorId = hitMirror.id;
        api.selectVirtualMirror(true);
        if (api.mirror.mirrors) {
          for (const m of api.mirror.mirrors) {
            m.selected = m.id === hitMirror.id;
          }
        }
        api.setVirtualMirror(hitMirror.x, true, true);
        api.selection.clear();
        api.setCursor('col-resize');
        api.redraw();
        return;
      }
    }

    // Corner grab handles sit on top of everything else, including the geometry under them.
    const net = netBounds(api);
    const corner = net ? hitCorner(api.view, net, input.screen) : null;
    if (net && corner !== null) {
      const anchor = oppositeCorner(net, corner);
      const startDist = Math.hypot(input.rawWorld.x - anchor.x, input.rawWorld.y - anchor.y);
      if (startDist > 0) {
        state.scaling = { anchor, startDist, appliedFactor: 1, snapshot: false };
        api.setCursor(cornerCursor(corner));
        api.redraw();
        return;
      }
    }

    // Endpoint grip: drag that vertex anywhere. Everything joined to it follows.
    const vertexId = hitEndpointGrip(api, input.screen);
    if (vertexId !== null) {
      state.vertexDrag = { vertexId, snapshot: false, moved: false };
      api.setCursor('move');
      api.redraw();
      return;
    }

    // Midpoint grip: drag the whole segment.
    const midEdgeId = hitMidpointGrip(api, input.screen);
    if (midEdgeId !== null) {
      state.edgeDrag = { edgeId: midEdgeId, lastWorld: input.rawWorld, snapshot: false };
      api.setCursor('move');
      api.redraw();
      return;
    }

    const textHit = api.doc.hitTextAt(input.rawWorld.x, input.rawWorld.y, api.view.zoom);
    if (textHit !== null) {
      if (!api.selection.has(textHit) && !input.shiftKey) {
        api.selection.clear();
        api.selection.add(textHit);
      } else if (input.shiftKey) {
        if (api.selection.has(textHit)) {
          api.selection.delete(textHit);
        } else {
          api.selection.add(textHit);
        }
      }
      state.isMoving = true;
      state.dragStartWorld = input.world;
      state.movedSnapshot = false;
      api.redraw();
      return;
    }

    const blockHit = api.doc.hitBlockInstanceAt(input.rawWorld.x, input.rawWorld.y, api.view.zoom);
    if (blockHit !== null) {
      if (!api.selection.has(blockHit) && !input.shiftKey) {
        api.selection.clear();
        api.selection.add(blockHit);
      } else if (input.shiftKey) {
        if (api.selection.has(blockHit)) {
          api.selection.delete(blockHit);
        } else {
          api.selection.add(blockHit);
        }
      }
      state.isMoving = true;
      state.dragStartWorld = input.world;
      state.movedSnapshot = false;
      api.redraw();
      return;
    }

    const hit = api.doc.hitEdgeAt(input.rawWorld.x, input.rawWorld.y, api.view.zoom);

    if (hit !== null) {
      if (!api.selection.has(hit) && !input.shiftKey) {
        const additions =
          input.ctrlKey || input.metaKey
            ? edgesInGroupOf(api.doc, hit)
            : edgesInChainOf(api.doc, hit);
        api.selection.clear();
        for (const edgeId of additions) api.selection.add(edgeId);
      } else if (input.shiftKey) {
        if (api.selection.has(hit)) {
          api.selection.delete(hit);
        } else {
          api.selection.add(hit);
        }
      }

      state.isMoving = true;
      state.dragStartWorld = input.world;
      state.movedSnapshot = false;
    } else {
      if (!input.shiftKey) {
        api.selection.clear();
        api.selectVirtualMirror(false);
      }
      state.boxStartScreen = input.screen;
      state.boxEndScreen = input.screen;
    }
    api.redraw();
  },

  onPointerUp(state, _input, api) {
    if (state.mirrorDrag) {
      state.mirrorDrag = false;
      state.draggedMirrorId = undefined;
      api.setCursor('default');
      api.redraw();
      return;
    }

    if (state.vertexDrag) {
      // Re-planarise once, at the end: doing it per mouse move would split the
      // very edges being dragged and swap their ids mid-drag.
      if (state.vertexDrag.moved) api.doc.resolveAllIntersections();
      state.vertexDrag = null;
      api.setCursor('default');
      api.redraw();
      return;
    }

    if (state.edgeDrag) {
      state.edgeDrag = null;
      api.setCursor('default');
      api.redraw();
      return;
    }

    if (state.scaling) {
      state.scaling = null;
      api.setMeasurement(null);
      api.setCursor('default');
      api.redraw();
      return;
    }

    if (state.boxStartScreen && state.boxEndScreen) {
      const x1 = Math.min(state.boxStartScreen.x, state.boxEndScreen.x);
      const x2 = Math.max(state.boxStartScreen.x, state.boxEndScreen.x);
      const y1 = Math.min(state.boxStartScreen.y, state.boxEndScreen.y);
      const y2 = Math.max(state.boxStartScreen.y, state.boxEndScreen.y);

      for (const e of api.doc.edges.values()) {
        const [a, b] = api.doc.endpointsOf(e);
        const sa = api.view.toScreen(a.x, a.y);
        const sb = api.view.toScreen(b.x, b.y);

        if (
          (sa.x >= x1 && sa.x <= x2 && sa.y >= y1 && sa.y <= y2) ||
          (sb.x >= x1 && sb.x <= x2 && sb.y >= y1 && sb.y <= y2)
        ) {
          api.selection.add(e.id);
        }
      }

      for (const t of api.doc.texts.values()) {
        const st = api.view.toScreen(t.x, t.y);
        if (st.x >= x1 && st.x <= x2 && st.y >= y1 && st.y <= y2) {
          api.selection.add(t.id);
        }
      }

      for (const b of api.doc.blockInstances.values()) {
        const sb = api.view.toScreen(b.x, b.y);
        if (sb.x >= x1 && sb.x <= x2 && sb.y >= y1 && sb.y <= y2) {
          api.selection.add(b.id);
        }
      }
    }

    state.isMoving = false;
    state.dragStartWorld = null;
    state.boxStartScreen = null;
    state.boxEndScreen = null;
    state.movedSnapshot = false;
    api.redraw();
  },

  onEscape(state, api) {
    state.isMoving = false;
    state.dragStartWorld = null;
    state.boxStartScreen = null;
    state.boxEndScreen = null;
    state.scaling = null;
    state.vertexDrag = null;
    state.edgeDrag = null;
    api.setMeasurement(null);
    api.selection.clear();
    api.redraw();
  },

  onDelete(_state, api) {
    if (!api.selection.size) return;
    api.edit(() => {
      for (const id of api.selection) api.doc.removeEdge(id);
      api.selection.clear();
      api.setHoverEdge(null);
      return true;
    });
  },

  drawPreview(state, scene) {
    const { ctx } = scene;
    if (state.boxStartScreen && state.boxEndScreen) {
      const x = Math.min(state.boxStartScreen.x, state.boxEndScreen.x);
      const y = Math.min(state.boxStartScreen.y, state.boxEndScreen.y);
      const w = Math.abs(state.boxEndScreen.x - state.boxStartScreen.x);
      const h = Math.abs(state.boxEndScreen.y - state.boxStartScreen.y);

      ctx.save();
      ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.fillRect(x, y, w, h);
      ctx.strokeRect(x, y, w, h);
      ctx.restore();
    } else {
      dot(ctx, scene.pointer.screen.x, scene.pointer.screen.y, 3, CANVAS.cursorDot);
    }
  },
};
