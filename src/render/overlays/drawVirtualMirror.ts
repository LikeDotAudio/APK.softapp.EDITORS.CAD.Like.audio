// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Scene } from '../Scene';
import type { VirtualMirrorState, VirtualMirror } from '../../core/mirror';

/**
 * Draws one virtual mirror axis on the canvas.
 * When selected: THE CAD EDGE OF THE MIRROR GLOWS.
 */
function renderSingleMirror(
  scene: Scene,
  m: VirtualMirror,
  mirrorIndex: number,
  _totalMirrors: number,
): void {
  const { ctx, view } = scene;
  const screenX = view.toScreen(m.x, 0).x;
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;

  // Cull if off screen horizontally
  if (screenX < -120 || screenX > width + 120) return;

  const glowColor = m.glowColor || '#00f7ff';

  ctx.save();

  if (m.selected) {
    // -------------------------------------------------------------
    // GLOWING CAD EDGE (WHEN SELECTED)
    // -------------------------------------------------------------
    // 1. Broad outer atmospheric bloom
    ctx.save();
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 28;
    ctx.strokeStyle = glowColor;
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = 12;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(screenX, 0);
    ctx.lineTo(screenX, height);
    ctx.stroke();
    ctx.restore();

    // 2. Mid radiant plasma layer
    ctx.save();
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 14;
    ctx.strokeStyle = glowColor;
    ctx.globalAlpha = 0.85;
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
      ctx.fillStyle = glowColor;
      ctx.shadowColor = glowColor;
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

    // 5. Header Glowing Badge at Top (staggered if multiple mirrors)
    const badgeText = m.name || `🪞 MIRROR · X = ${m.x.toFixed(2)}`;
    const subText = m.reflectedFrom
      ? `🪞 MIRROR REFLECTING MIRROR (GLOWING)`
      : `CAD EDGE: GLOWING (SELECTED)`;

    ctx.font = 'bold 11px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
    const textWidth = Math.max(ctx.measureText(badgeText).width, ctx.measureText(subText).width);
    const boxW = textWidth + 24;
    const boxH = 34;
    const boxX = screenX - boxW / 2;
    // Stagger badges vertically if multiple mirrors are close
    const boxY = 16 + (mirrorIndex % 3) * 38;

    ctx.save();
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 18;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = glowColor;
    ctx.fillText(badgeText, boxX + 12, boxY + 15);
    ctx.font = '9px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
    ctx.fillStyle = '#bae6fd';
    ctx.fillText(subText, boxX + 12, boxY + 28);
    ctx.restore();

  } else {
    // -------------------------------------------------------------
    // STANDARD VIRTUAL MIRROR (UNSELECTED)
    // -------------------------------------------------------------
    ctx.save();
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 5;
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = 1.5;
    // Standard CAD centerline: long dash, short gap, dot, short gap
    ctx.setLineDash([12, 4, 3, 4]);
    ctx.beginPath();
    ctx.moveTo(screenX, 0);
    ctx.lineTo(screenX, height);
    ctx.stroke();
    ctx.restore();

    // Subtle tag at top
    const tag = m.name || `🪞 X = ${m.x.toFixed(2)}`;
    ctx.font = '10px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
    const tw = ctx.measureText(tag).width;
    const bw = tw + 16;
    const bh = 20;
    const bx = screenX - bw / 2;
    const by = 16 + (mirrorIndex % 3) * 24;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = glowColor;
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

/**
 * Draws all Virtual Mirrors on the CAD canvas.
 * A mirror can mirror another mirror, and each selected mirror glows!
 */
export function drawVirtualMirror(scene: Scene, mirror?: VirtualMirrorState): void {
  if (!mirror || (!mirror.enabled && !mirror.selected)) return;

  const mirrorList: VirtualMirror[] =
    mirror.mirrors && mirror.mirrors.length > 0
      ? mirror.mirrors
      : [
          {
            id: 'primary',
            x: mirror.x,
            selected: mirror.selected,
            name: `Mirror Alpha (X=${mirror.x.toFixed(1)})`,
            glowColor: '#00f7ff',
          },
        ];

  mirrorList.forEach((m, idx) => {
    renderSingleMirror(scene, m, idx, mirrorList.length);
  });
}
