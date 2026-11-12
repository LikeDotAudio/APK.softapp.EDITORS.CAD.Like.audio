// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { PortRef } from '../core/types';
import { hitPortAt, portLabel, portsOf, portWorldPoint } from '../flow/Schematic';
import { connect, netOfWire } from '../flow/wires';
import { hitConnectorAt } from '../flow/cables';
import { dot } from '../render/dot';
import { FLOW, SIDE_COLOR } from '../render/flow/flowColors';
import { FONT } from '../render/palette';
import type { Tool } from './types';

/**
 * Wire two ports together. The result is a CONNECTOR - a graph edge - and the
 * line on the sheet is only how it is drawn; that is the whole reason this is
 * a tool of its own rather than the line tool with a snap.
 *
 * Clicking a WIRE (not a port) with nothing started opens the cable editor on
 * it (components/CableEditor.tsx): mark the wire as a real cable and say which
 * — its BIM part, label, length, colour, status (flow/cables.ts).
 */
interface WireState {
  from: PortRef | null;
}

const HIT_PX = 12;

const Icon = (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="1.5" y="6.5" width="3" height="3" />
    <rect x="11.5" y="6.5" width="3" height="3" />
    <path d="M4.5 8 H7 V4 H9 V12 H11.5" />
  </svg>
);

export const wireTool: Tool<WireState> = {
  id: 'wire',
  label: 'Wire',
  shortcut: 'w',
  title: 'Wire ports (W)',
  hint: 'Click a port, then click the port it connects to · click a wire to make it a cable · Esc to cancel',
  icon: Icon,
  cursor: 'crosshair',
  snaps: false,
  showsSnapIndicator: false,

  createState: () => ({ from: null }),

  onPointerDown(state, input, api) {
    const tol = api.view.pxToWorld(HIT_PX);
    const hit = hitPortAt(api.schematic, input.rawWorld, tol);
    if (!hit) {
      const wire = state.from ? null : hitConnectorAt(api.schematic, input.rawWorld, tol);
      if (wire !== null && api.openCableEditor) {
        api.openCableEditor(wire);
        return;
      }
      if (state.from) {
        state.from = null;
        api.showHint('Wire cancelled — that was not a port.', 2000);
        api.redraw();
      }
      return;
    }
    if (!state.from) {
      state.from = hit;
      api.showHint(`From ${portLabel(api.schematic, hit)} — click the port it connects to.`, 4000);
      api.redraw();
      return;
    }
    const from = state.from;
    state.from = null;
    // a wire, FROM → TO, on a net: the net its pins were on, two nets merged under the older name (flow/wires.ts)
    let wire: number | null = null;
    const made = api.editFlow(() => (wire = connect(api.schematic, from, hit, api.activeLayerId)?.id ?? null) !== null);
    api.showHint(
      made
        ? `Connected ${portLabel(api.schematic, from)} → ${portLabel(api.schematic, hit)} · net ${netOfWire(api.schematic, wire!)?.name ?? ''}.`
        : 'Not connected — a port cannot wire to itself, and a pair is only connected once.',
      3000,
    );
  },

  onEscape(state, api) {
    state.from = null;
    api.redraw();
  },

  drawPreview(state, scene) {
    const { ctx, view, pointer, schematic } = scene;
    if (!schematic) return;

    // Every port is a target while this tool is live, so show them all.
    ctx.save();
    for (const placement of schematic.placements) {
      for (const resolved of portsOf(schematic, placement.id)) {
        const s = view.toScreen(resolved.world.x, resolved.world.y);
        dot(ctx, s.x, s.y, 4, SIDE_COLOR[resolved.port.side]);
      }
    }

    if (state.from) {
      const a = portWorldPoint(schematic, state.from);
      if (a) {
        const sa = view.toScreen(a.x, a.y);
        ctx.strokeStyle = FLOW.connectorPending;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.moveTo(sa.x, sa.y);
        ctx.lineTo(pointer.screen.x, pointer.screen.y);
        ctx.stroke();
        ctx.setLineDash([]);
        dot(ctx, sa.x, sa.y, 6, FLOW.connectorPending);
        ctx.font = FONT.marker;
        ctx.fillStyle = FLOW.portLabel;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillText(portLabel(schematic, state.from), sa.x + 8, sa.y - 6);
      }
    }
    ctx.restore();
  },
};
