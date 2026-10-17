// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Scene } from '../Scene';
import type { VirtualMirrorState } from '../../core/mirror';

/**
 * Draws the Virtual Mirror axis on the CAD canvas.
 * When selected: THE CAD EDGE OF THE MIRROR GLOWS with a luminous bloom aura.
 */
export function drawVirtualMirror(scene: Scene, mirror?: VirtualMirrorState): void {
  if (!mirror || (!mirror.enabled && !mirror.selected)) return;

  const { ctx, view } = scene;
  const screenX = view.toScreen(mirror.x, 0).x;
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;

  // Cull if completely off screen horizontally
  if (screenX < -100 || screenX > width + 100) return;

  ctx.save();

  if (mirror.selected) {
    // -------------------------------------------------------------
    // GLOWING CAD EDGE (WHEN SELECTED)
    // -------------------------------------------------------------
    // 1. Broad outer atmospheric bloom
    ctx.save();
    ctx.shadowColor = '#00f7ff';
    ctx.shadowBlur = 28;
    ctx.strokeStyle = 'rgba(0, 247, 255, 0.35)';
    ctx.lineWidth = 12;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(screenX, 0);
    ctx.lineTo(screenX, height);
    ctx.stroke();
    ctx.restore();

    // 2. Mid radiant plasma layer
    ctx.save();
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 14;
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
    ctx.lineWidth = 4;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(screenX, 0);
    ctx.lineTo(screenX, height);
    ctx.stroke();
    ctx.restore();

    // 3. Crisp white-hot core edge
    ctx.save();
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 4;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(screenX, 0);
    ctx.lineTo(screenX, height);
    ctx.stroke();
    ctx.restore();

    // 4. Glowing Bilateral Symmetry Chevron Glyphs along the edge
    const step = 80;
    for (let y = 60; y < height - 60; y += step) {
      ctx.save();
      ctx.fillStyle = '#00f7ff';
      ctx.shadowColor = '#00f7ff';
      ctx.shadowBlur = 8;

      // Left triangle ◄
      ctx.beginPath();
      ctx.moveTo(screenX - 10, y);
      ctx.lineTo(screenX - 4, y - 5);
      ctx.lineTo(screenX - 4, y + 5);
      ctx.closePath();
      ctx.fill();

      // Right triangle ►
      ctx.beginPath();
      ctx.moveTo(screenX + 10, y);
      ctx.lineTo(screenX + 4, y - 5);
      ctx.lineTo(screenX + 4, y + 5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // 5. Header Glowing Badge at Top
    const badgeText = `🪞 VIRTUAL MIRROR · X = ${mirror.x.toFixed(2)}`;
    const subText = `CAD EDGE: GLOWING (SELECTED)`;
    ctx.font = 'bold 11px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
    const textWidth = Math.max(ctx.measureText(badgeText).width, ctx.measureText(subText).width);
    const boxW = textWidth + 24;
    const boxH = 34;
    const boxX = screenX - boxW / 2;
    const boxY = 16;

    ctx.save();
    ctx.shadowColor = '#00f7ff';
    ctx.shadowBlur = 18;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.strokeStyle = '#00f7ff';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#00f7ff';
    ctx.fillText(badgeText, boxX + 12, boxY + 15);
    ctx.font = '9px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(subText, boxX + 12, boxY + 28);
    ctx.restore();

  } else {
    // -------------------------------------------------------------
    // STANDARD VIRTUAL MIRROR (UNSELECTED)
    // -------------------------------------------------------------
    ctx.save();
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 6;
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    // Standard CAD centerline: long dash, short gap, dot, short gap
    ctx.setLineDash([12, 4, 3, 4]);
    ctx.beginPath();
    ctx.moveTo(screenX, 0);
    ctx.lineTo(screenX, height);
    ctx.stroke();
    ctx.restore();

    // Subtle tag at top
    const tag = `🪞 MIRROR X = ${mirror.x.toFixed(2)}`;
    ctx.font = '10px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
    const tw = ctx.measureText(tag).width;
    const bw = tw + 16;
    const bh = 20;
    const bx = screenX - bw / 2;
    const by = 16;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, 4);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#bae6fd';
    ctx.fillText(tag, bx + 8, by + 14);
  }

  ctx.restore();
}
