// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { BlockDefinition } from '../../core/types';
import type { Scene } from '../Scene';
import { UI_FONT } from '../palette';
import { FLOW } from './flowColors';

/**
 * THE HEADER — the block's top hat (the owner, 2026-11-07: "top hats on these with
 * descriptions and details", and the owner's sheet: DEVICE NAME across the top,
 * LOCATION and Owner in its corners, a rule under it, IP ADDRESS along the foot).
 * It sits INSIDE the box, `hat.height` drawing units deep; the ports start below it
 * (bimPart.ts). The words keep a readable size however far out the view is and are
 * clipped to the header, the lower lines giving way first. One renderer, so Library
 * Equipment, Simulation and Big Picture show the same block.
 */
export const HAT = { title: 5, line: 2.8, corner: 2.4, pad: 1.4, depth: 24, minTitlePx: 9, minLinePx: 7 } as const;

/* Never smaller than readable, never capped: zooming in makes the header clearer. */
const sized = (v: number, lo: number) => Math.max(v, lo);

/** The header's depth in drawing units. */
export const hatDepth = (def: BlockDefinition): number => (def.hat ? def.hat.height ?? HAT.depth : 0);

/**
 * WORDS THAT OPEN UP AS YOU ZOOM IN (the owner, 2026-11-07: "start with words 5 chars
 * then do a ... until you can see the whole things nicely"). A name never shows fewer
 * than its first FIRST_CHARS characters and "…"; as the room it has grows with the
 * zoom it shows more, until the whole name fits. Pure: the measurer is passed in.
 */
export const FIRST_CHARS = 5;

export function reveal(text: string, roomPx: number, measure: (t: string) => number): string {
  if (text.length <= FIRST_CHARS || measure(text) <= roomPx) return text;
  let lo = FIRST_CHARS, hi = text.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (measure(`${text.slice(0, mid)}…`) <= roomPx) lo = mid; else hi = mid - 1;
  }
  return `${text.slice(0, lo).trimEnd()}…`;
}

/** `reveal` with the canvas's current font. */
export function fit(ctx: CanvasRenderingContext2D, text: string, w: number): string {
  return reveal(text, w, (t) => ctx.measureText(t).width);
}

/** Draw `def`'s header inside the box whose screen outline is `corners`; `picked` borrows the selection colour. */
export function drawHat(scene: Scene, def: BlockDefinition, corners: { x: number; y: number }[], z: number, picked: boolean): void {
  const hat = def.hat;
  if (!hat || corners.length < 2) return;
  const { ctx } = scene;
  const left = Math.min(...corners.map((p) => p.x));
  const right = Math.max(...corners.map((p) => p.x));
  const top = Math.min(...corners.map((p) => p.y));
  const bottom = Math.max(...corners.map((p) => p.y));
  const w = right - left;
  const h = Math.min(hatDepth(def) * z, bottom - top);
  if (w < 30 || h < 8) return;
  const pad = Math.max(HAT.pad * z, 3);
  ctx.save();
  // the header's ground and the rule under it
  ctx.fillStyle = picked ? FLOW.hatPicked : FLOW.hatFill;
  ctx.fillRect(left, top, w, h);
  ctx.beginPath();
  ctx.moveTo(left, top + h);
  ctx.lineTo(right, top + h);
  ctx.strokeStyle = picked ? FLOW.picked : FLOW.hatRule;
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.beginPath();
  ctx.rect(left, top, w, h);
  ctx.clip();

  const t = sized(HAT.title * z, HAT.minTitlePx);
  const l = sized(HAT.line * z, HAT.minLinePx);
  const c = sized(HAT.corner * z, HAT.minLinePx - 0.5);
  const inner = w - pad * 2;
  // the title, centred
  ctx.textBaseline = 'top';
  ctx.textAlign = 'center';
  ctx.font = `bold ${Math.round(t)}px ${UI_FONT}`;
  ctx.fillStyle = FLOW.hatTitle;
  ctx.fillText(fit(ctx, hat.title, inner), left + w / 2, top + pad);
  // the corners along the header's foot
  const cornerY = top + h - pad - c;
  const corners2 = Boolean(hat.left || hat.right);
  if (corners2) {
    ctx.font = `${Math.round(c)}px ${UI_FONT}`;
    if (hat.left) {
      ctx.textAlign = 'left';
      ctx.fillStyle = FLOW.hatText;
      ctx.fillText(fit(ctx, hat.left, inner / 2 - pad), left + pad, cornerY);
    }
    if (hat.right) {
      ctx.textAlign = 'right';
      ctx.fillStyle = hat.right.includes('⚠') ? FLOW.hatWarn : FLOW.hatText;
      ctx.fillText(fit(ctx, hat.right, inner / 2 - pad), right - pad, cornerY);
    }
  }
  // details and description between, while they fit
  ctx.textAlign = 'center';
  ctx.font = `${Math.round(l)}px ${UI_FONT}`;
  ctx.fillStyle = FLOW.hatText;
  let y = top + pad + t * 1.25;
  const floor = corners2 ? cornerY - 1 : top + h - pad;
  for (const line of hat.lines) {
    if (y + l > floor) break;
    ctx.fillText(fit(ctx, line, inner), left + w / 2, y);
    y += l * 1.2;
  }
  ctx.restore();

  // the footer: a band of the same depth on every block, ruled off, where power and control come out
  const fh = Math.min((hat.footer ?? 0) * z, (bottom - top) - h);
  if (fh >= 6) {
    ctx.save();
    ctx.fillStyle = picked ? FLOW.hatPicked : FLOW.footFill;
    ctx.fillRect(left, bottom - fh, w, fh);
    ctx.beginPath();
    ctx.moveTo(left, bottom - fh);
    ctx.lineTo(right, bottom - fh);
    ctx.strokeStyle = picked ? FLOW.picked : FLOW.hatRule;
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.restore();
  }
  // the foot (IP ADDRESS), inside the box along its bottom — when no port names sit there
  if (hat.foot && !def.ports.some((p) => p.side === 'power' || p.side === 'control')) {
    ctx.save();
    ctx.font = `${Math.round(c)}px ${UI_FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillStyle = FLOW.hatText;
    ctx.fillText(fit(ctx, hat.foot, inner), left + w / 2, bottom - pad);
    ctx.restore();
  }
}
