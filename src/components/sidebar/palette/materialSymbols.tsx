// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { ReactNode } from 'react';

/**
 * THE MATERIAL INDICATIONS, DRAWN
 *
 * How a construction drawing says what a cut is made of: the material
 * indications of the US National CAD Standard (Uniform Drawing System
 * module 4, Symbols) as Architectural Graphic Standards draws them, and for
 * acoustic treatments — which the standard has no symbol for — what they are
 * built of (a slat resonator is wood slats over batt insulation). A host
 * names one per palette item (`symbol`; the Acoustic overlay's catalogue is
 * acoustics/symbols.js, the same ids); the palette preview draws it here, as
 * a section through the thing: its band `x, y, w, h`, the room side at the
 * bottom.
 *
 *   batt        a continuous loop across the cavity
 *   rigid       crossed diagonals in board-width cells
 *   foam        rigid's outline, a dense stipple
 *   concrete    stipple and triangles (aggregate)
 *   cmu         crossed 45° lines, the cores open
 *   brick       45° lines, close
 *   stone       45° lines broken to dash-dot
 *   tile        a thin layer, its joints, 45° within
 *   gypsum      a fine stipple in a thin layer
 *   wood        grain lines along the piece
 *   blocking    an X through the member
 *   plywood     laminations
 *   glass       two or three thin lines, edge-on
 *   metal       45° lines in pairs
 *   acoustic    stipple between the tile joints
 *   carpet      a wave in a thin layer
 *   fabric      a loose wave
 *   cork        stipple and dashes
 *   rubber      45° lines, heavy and light
 *   earth       short grouped strokes
 *   water       ripples
 *   air         nothing
 *   qrd         fins, wells of stepped depth
 *   skyline     blocks of stepped heights
 *   slat        slats and gaps over batt
 *   perforated  a holed board over batt
 *   membrane    a limp sheet on a sealed box, batt inside
 *   trap        batt filling the corner's triangle
 *   opening     an X across it
 *
 * Anything else is drawn as the hatch the sheet paints it with.
 */
export const SYMBOL_IDS = ['batt', 'rigid', 'foam', 'concrete', 'cmu', 'brick', 'stone', 'tile', 'gypsum', 'wood', 'blocking', 'plywood', 'glass', 'metal', 'acoustic', 'carpet', 'fabric', 'cork', 'rubber', 'earth', 'water', 'air', 'qrd', 'skyline', 'slat', 'perforated', 'membrane', 'trap', 'opening'] as const;

/** A stable pseudo-random sequence, so a stipple does not crawl every render. */
function rand(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** 45° lines across a box, every `step`, as one path (clipped by the caller). */
function diagonals(x: number, y: number, w: number, h: number, step: number, back = false): string {
  let d = '';
  for (let o = -h; o < w + h; o += step) d += back ? `M${x + o} ${y}l${h} ${h}` : `M${x + o} ${y + h}l${h} ${-h}`;
  return d;
}

function stipple(x: number, y: number, w: number, h: number, n: number, seed: number, r = 0.7): ReactNode[] {
  const rnd = rand(seed);
  return Array.from({ length: n }, (_, i) => <circle key={`s${i}`} cx={x + rnd() * w} cy={y + rnd() * h} r={r} />);
}

/** A loop of batt insulation filling the band. */
function battPath(x: number, y: number, w: number, h: number): string {
  const r = Math.max(3, h / 2);
  const step = r * 1.2;
  let d = `M${x} ${y + h}`;
  for (let px = x; px < x + w; px += step) d += `C${px + step * 0.1} ${y - h * 0.05} ${px + step * 1.1} ${y - h * 0.05} ${px + step} ${y + h}`;
  return d;
}

/**
 * The section of `symbol` in its band, stroked in `color`. `uid` keeps the
 * clip ids of two previews on one page apart.
 */
export function MaterialSection({ symbol, color, x, y, w, h, uid }: { symbol: string; color: string; x: number; y: number; w: number; h: number; uid: string }) {
  const clip = `ms-${uid}`;
  const line = { stroke: color, strokeWidth: 1, fill: 'none' } as const;
  const parts: ReactNode[] = [];
  const box = <rect key="box" x={x} y={y} width={w} height={h} fill={color} fillOpacity={0.12} />;
  const seed = [...symbol].reduce((s, c) => s * 31 + c.charCodeAt(0), 7);
  switch (symbol) {
    case 'batt':
      parts.push(<path key="b" d={battPath(x, y, w, h)} {...line} />, <path key="e" d={`M${x} ${y}h${w}M${x} ${y + h}h${w}`} {...line} strokeWidth={0.6} />);
      break;
    case 'trap': {
      // the corner seen in plan: two walls meeting, the triangle across it filled with batt
      parts.push(<path key="walls" d={`M${x} ${y}V${y + h}H${x + w}`} stroke="#9a9a9a" strokeWidth={3} fill="none" />);
      parts.push(<path key="tri" d={`M${x} ${y}L${x + w} ${y + h}`} {...line} strokeWidth={1.5} />);
      for (let i = 1; i < 6; i++) {
        const t = i / 6;
        parts.push(<path key={`l${i}`} d={`M${x} ${y + h * t}q${w * t * 0.25} ${-h * 0.06} ${w * t * 0.5} 0t${w * t * 0.5} 0`} {...line} strokeWidth={0.8} />);
      }
      return <g>{parts}</g>;
    }
    case 'rigid':
    case 'foam': {
      const cell = Math.max(h, 12);
      for (let cx = x; cx < x + w; cx += cell) {
        parts.push(<rect key={`c${cx}`} x={cx} y={y} width={Math.min(cell, x + w - cx)} height={h} {...line} />);
        if (symbol === 'rigid') parts.push(<path key={`x${cx}`} d={`M${cx} ${y}l${Math.min(cell, x + w - cx)} ${h}M${cx} ${y + h}l${Math.min(cell, x + w - cx)} ${-h}`} {...line} strokeWidth={0.7} />);
      }
      if (symbol === 'foam') parts.push(<g key="st" fill={color}>{stipple(x, y, w, h, Math.round((w * h) / 25), seed, 0.6)}</g>);
      break;
    }
    case 'concrete': {
      const rnd = rand(seed);
      parts.push(<g key="st" fill={color}>{stipple(x, y, w, h, Math.round((w * h) / 40), seed)}</g>);
      for (let i = 0; i < Math.round((w * h) / 260); i++) {
        const cx = x + rnd() * w;
        const cy = y + rnd() * h;
        const s = 2 + rnd() * 3;
        parts.push(<path key={`t${i}`} d={`M${cx} ${cy - s}l${s} ${s * 1.6}h${-s * 2}z`} {...line} strokeWidth={0.8} />);
      }
      break;
    }
    case 'cmu': {
      parts.push(<path key="d" d={diagonals(x, y, w, h, 9) + diagonals(x, y, w, h, 9, true)} {...line} strokeWidth={0.6} />);
      const core = Math.max(h * 0.45, 4);
      for (let cx = x + h * 0.4; cx + core < x + w; cx += h * 1.6) parts.push(<rect key={`k${cx}`} x={cx} y={y + (h - core) / 2} width={core * 1.4} height={core} fill="#181818" stroke={color} strokeWidth={0.8} />);
      break;
    }
    case 'brick':
      parts.push(<path key="d" d={diagonals(x, y, w, h, 5)} {...line} strokeWidth={0.8} />);
      break;
    case 'stone':
      parts.push(<path key="d" d={diagonals(x, y, w, h, 7)} {...line} strokeDasharray="6 2 1 2" />);
      break;
    case 'tile': {
      parts.push(<path key="d" d={diagonals(x, y, w, h, 6)} {...line} strokeWidth={0.6} />);
      for (let jx = x + 30; jx < x + w; jx += 30) parts.push(<path key={`j${jx}`} d={`M${jx} ${y}v${h}`} stroke={color} strokeWidth={1.6} />);
      break;
    }
    case 'gypsum':
    case 'acoustic':
      parts.push(<g key="st" fill={color}>{stipple(x, y, w, h, Math.round((w * h) / 14), seed, 0.5)}</g>);
      if (symbol === 'acoustic') for (let jx = x + 40; jx < x + w; jx += 40) parts.push(<path key={`j${jx}`} d={`M${jx} ${y}v${h}`} {...line} strokeWidth={1.4} />);
      break;
    case 'wood': {
      for (let i = 1; i < 5; i++) {
        const gy = y + (h * i) / 5;
        parts.push(<path key={`g${i}`} d={`M${x} ${gy}c${w * 0.2} ${-h * 0.12} ${w * 0.3} ${h * 0.12} ${w * 0.5} 0s${w * 0.3} ${-h * 0.1} ${w * 0.5} 0`} {...line} strokeWidth={0.8} />);
      }
      break;
    }
    case 'blocking':
      parts.push(<path key="x" d={`M${x} ${y}L${x + w} ${y + h}M${x} ${y + h}L${x + w} ${y}`} {...line} />);
      break;
    case 'plywood':
      for (let i = 1; i < 5; i++) parts.push(<path key={`p${i}`} d={`M${x} ${y + (h * i) / 5}h${w}`} {...line} strokeWidth={i % 2 ? 0.6 : 1.1} />);
      break;
    case 'glass':
      for (const t of [0.3, 0.5, 0.7]) parts.push(<path key={`g${t}`} d={`M${x} ${y + h * t}h${w}`} {...line} strokeWidth={0.7} />);
      return <g>{parts}</g>;
    case 'metal':
      parts.push(<path key="d" d={diagonals(x, y, w, h, 10) + diagonals(x + 2.5, y, w, h, 10)} {...line} strokeWidth={0.7} />);
      break;
    case 'carpet':
    case 'fabric': {
      const amp = symbol === 'carpet' ? h * 0.3 : h * 0.4;
      const step = symbol === 'carpet' ? 6 : 14;
      let d = `M${x} ${y + h / 2}`;
      for (let px = x; px < x + w; px += step) d += `q${step / 4} ${-amp} ${step / 2} 0t${step / 2} 0`;
      parts.push(<path key="w" d={d} {...line} strokeWidth={symbol === 'carpet' ? 0.9 : 1.4} />);
      if (symbol === 'carpet') parts.push(<path key="f" d={`M${x} ${y + h}h${w}`} stroke="#9a9a9a" strokeWidth={2} />);
      break;
    }
    case 'cork': {
      const rnd = rand(seed);
      parts.push(<g key="st" fill={color}>{stipple(x, y, w, h, Math.round((w * h) / 30), seed)}</g>);
      for (let i = 0; i < Math.round((w * h) / 120); i++) {
        const cx = x + rnd() * w;
        const cy = y + rnd() * h;
        parts.push(<path key={`c${i}`} d={`M${cx} ${cy}l${3} ${-1.5}`} {...line} />);
      }
      break;
    }
    case 'rubber': {
      parts.push(<path key="d" d={diagonals(x, y, w, h, 6)} {...line} strokeWidth={0.6} />, <path key="h" d={diagonals(x, y, w, h, 12)} {...line} strokeWidth={1.5} />);
      break;
    }
    case 'earth': {
      const rnd = rand(seed);
      for (let i = 0; i < Math.round((w * h) / 120); i++) {
        const cx = x + rnd() * w;
        const cy = y + rnd() * h;
        parts.push(<path key={`e${i}`} d={`M${cx} ${cy}h5M${cx} ${cy + 2}h5M${cx + 7} ${cy - 2}v5M${cx + 9} ${cy - 2}v5`} {...line} strokeWidth={0.7} />);
      }
      break;
    }
    case 'water':
      for (let i = 1; i < 4; i++) parts.push(<path key={`r${i}`} d={`M${x + 4} ${y + (h * i) / 4}h${w * 0.3}m8 0h${w * 0.4}`} {...line} strokeDasharray="10 5" />);
      break;
    case 'air':
      return <g><rect x={x} y={y} width={w} height={h} {...line} strokeDasharray="3 3" /></g>;
    case 'qrd': {
      const n = 9;
      const fw = w / n;
      parts.push(<path key="back" d={`M${x} ${y}h${w}`} stroke={color} strokeWidth={3} />);
      for (let i = 0; i < n; i++) {
        const depth = h * (0.2 + 0.8 * (((i * i) % 7) / 6));
        parts.push(<rect key={`w${i}`} x={x + i * fw} y={y} width={fw} height={h - depth} fill={color} fillOpacity={0.35} />);
        parts.push(<path key={`f${i}`} d={`M${x + i * fw} ${y}v${h}`} stroke={color} strokeWidth={1.6} />);
      }
      parts.push(<path key="fl" d={`M${x + w} ${y}v${h}`} stroke={color} strokeWidth={1.6} />);
      return <g>{parts}</g>;
    }
    case 'skyline': {
      const n = 10;
      const fw = w / n;
      parts.push(<path key="back" d={`M${x} ${y}h${w}`} stroke={color} strokeWidth={3} />);
      for (let i = 0; i < n; i++) {
        const tall = h * (0.2 + 0.8 * (((i * 5 + 3) % 8) / 7));
        parts.push(<rect key={`b${i}`} x={x + i * fw + 0.5} y={y} width={fw - 1} height={tall} fill={color} fillOpacity={0.4} stroke={color} strokeWidth={0.8} />);
      }
      return <g>{parts}</g>;
    }
    case 'slat':
    case 'perforated':
    case 'membrane': {
      const face = Math.max(3, h * 0.18);
      const cav = h - face;
      parts.push(<path key="batt" d={battPath(x + 4, y + cav * 0.15, w - 8, cav * 0.7)} {...line} strokeWidth={0.8} />);
      parts.push(<path key="frame" d={`M${x} ${y}V${y + h}M${x + w} ${y}V${y + h}`} stroke={color} strokeWidth={3} />);
      if (symbol === 'slat') {
        for (let sx = x; sx < x + w; sx += 14) parts.push(<rect key={`s${sx}`} x={sx} y={y + cav} width={Math.min(10, x + w - sx)} height={face} fill={color} fillOpacity={0.8} />);
      } else if (symbol === 'perforated') {
        parts.push(<rect key="board" x={x} y={y + cav} width={w} height={face} fill={color} fillOpacity={0.8} />);
        for (let hx = x + 6; hx < x + w; hx += 9) parts.push(<rect key={`h${hx}`} x={hx} y={y + cav} width={2.5} height={face} fill="#181818" />);
      } else parts.push(<path key="sheet" d={`M${x} ${y + h - 1}q${w / 2} ${-face * 0.8} ${w} 0`} stroke={color} strokeWidth={2} fill="none" />);
      return <g>{parts}</g>;
    }
    case 'opening':
      return <g><rect x={x} y={y} width={w} height={h} {...line} strokeDasharray="4 3" /><path d={`M${x} ${y}L${x + w} ${y + h}M${x} ${y + h}L${x + w} ${y}`} {...line} /></g>;
    default:
      parts.push(<path key="d" d={diagonals(x, y, w, h, 8)} {...line} strokeWidth={0.8} />);
  }
  return (
    <g>
      <clipPath id={clip}>
        <rect x={x} y={y} width={w} height={h} />
      </clipPath>
      {box}
      <g clipPath={`url(#${clip})`}>{parts}</g>
      <rect x={x} y={y} width={w} height={h} {...line} strokeWidth={1.2} />
    </g>
  );
}

/**
 * The FACE of `symbol` — what you see standing in front of it, not its cut:
 * fabric over the porous things, the wells of a QRD, slats, holes, the bond
 * of brick and block, grain, glints on glass, the joints of a ceiling tile.
 */
export function MaterialFace({ symbol, color, x, y, w, h, uid }: { symbol: string; color: string; x: number; y: number; w: number; h: number; uid: string }) {
  const clip = `mf-${uid}`;
  const line = { stroke: color, fill: 'none' } as const;
  const parts: ReactNode[] = [];
  const seed = [...symbol].reduce((s, c) => s * 31 + c.charCodeAt(0), 11);
  const rnd = rand(seed);
  let tint = 0.18;
  switch (symbol) {
    case 'batt':
    case 'rigid':
    case 'foam':
    case 'fabric':
    case 'trap':
    case 'membrane': {
      // a woven fabric face: a fine grid, lighter one way
      tint = 0.32;
      let d = '';
      for (let gx = x; gx < x + w; gx += 3) d += `M${gx} ${y}v${h}`;
      parts.push(<path key="v" d={d} {...line} strokeWidth={0.4} strokeOpacity={0.6} />);
      d = '';
      for (let gy = y; gy < y + h; gy += 3) d += `M${x} ${gy}h${w}`;
      parts.push(<path key="h" d={d} {...line} strokeWidth={0.4} strokeOpacity={0.35} />);
      if (symbol === 'foam') for (let gx = x; gx < x + w; gx += 10) parts.push(<path key={`f${gx}`} d={`M${gx} ${y}v${h}`} {...line} strokeWidth={1.5} strokeOpacity={0.6} />);
      if (symbol === 'fabric') for (let gx = x + 6; gx < x + w; gx += 12) parts.push(<path key={`p${gx}`} d={`M${gx} ${y}v${h}`} stroke="#000" strokeOpacity={0.35} strokeWidth={3} />);
      break;
    }
    case 'qrd': {
      const n = 9;
      const fw = w / n;
      for (let i = 0; i < n; i++) parts.push(<rect key={`w${i}`} x={x + i * fw} y={y} width={fw} height={h} fill={color} fillOpacity={0.15 + 0.6 * (((i * i) % 7) / 6)} />);
      for (let i = 0; i <= n; i++) parts.push(<path key={`f${i}`} d={`M${x + i * fw} ${y}v${h}`} {...line} strokeWidth={1.4} />);
      break;
    }
    case 'skyline': {
      const n = 8;
      const cw = w / n;
      const ch = h / Math.max(1, Math.round(h / cw));
      for (let i = 0; i < n; i++) for (let j = 0; j * ch < h; j++) parts.push(<rect key={`b${i}-${j}`} x={x + i * cw + 0.5} y={y + j * ch + 0.5} width={cw - 1} height={ch - 1} fill={color} fillOpacity={0.15 + 0.6 * (((i * 5 + j * 3) % 8) / 7)} />);
      break;
    }
    case 'slat':
      for (let sx = x; sx < x + w; sx += 9) parts.push(<rect key={`s${sx}`} x={sx} y={y} width={Math.min(6, x + w - sx)} height={h} fill={color} fillOpacity={0.75} />);
      tint = 0.05;
      break;
    case 'perforated':
      tint = 0.6;
      for (let hx = x + 4; hx < x + w; hx += 7) for (let hy = y + 4; hy < y + h; hy += 7) parts.push(<circle key={`h${hx}-${hy}`} cx={hx} cy={hy} r={1.3} fill="#181818" />);
      break;
    case 'brick':
    case 'cmu': {
      const bw = symbol === 'brick' ? 22 : 40;
      const bh = symbol === 'brick' ? 7 : 20;
      for (let row = 0, by = y; by < y + h; by += bh, row++) {
        parts.push(<path key={`r${row}`} d={`M${x} ${by}h${w}`} {...line} strokeWidth={0.8} />);
        for (let bx = x + (row % 2 ? bw / 2 : 0); bx < x + w; bx += bw) parts.push(<path key={`j${row}-${bx}`} d={`M${bx} ${by}v${bh}`} {...line} strokeWidth={0.8} />);
      }
      break;
    }
    case 'stone':
    case 'tile': {
      const s = symbol === 'tile' ? 16 : 26;
      for (let gx = x; gx < x + w; gx += s) parts.push(<path key={`x${gx}`} d={`M${gx} ${y}v${h}`} {...line} strokeWidth={0.8} />);
      for (let gy = y; gy < y + h; gy += s) parts.push(<path key={`y${gy}`} d={`M${x} ${gy}h${w}`} {...line} strokeWidth={0.8} />);
      if (symbol === 'stone') for (let i = 0; i < 12; i++) parts.push(<path key={`v${i}`} d={`M${x + rnd() * w} ${y + rnd() * h}q8 4 16 -2`} {...line} strokeWidth={0.5} strokeOpacity={0.6} />);
      break;
    }
    case 'acoustic': {
      parts.push(<g key="st" fill={color}>{stipple(x, y, w, h, Math.round((w * h) / 10), seed, 0.45)}</g>);
      for (let gx = x; gx < x + w; gx += 30) parts.push(<path key={`x${gx}`} d={`M${gx} ${y}v${h}`} {...line} strokeWidth={1.4} />);
      for (let gy = y; gy < y + h; gy += 30) parts.push(<path key={`y${gy}`} d={`M${x} ${gy}h${w}`} {...line} strokeWidth={1.4} />);
      break;
    }
    case 'concrete':
    case 'gypsum':
    case 'cork':
    case 'earth':
      parts.push(<g key="st" fill={color}>{stipple(x, y, w, h, Math.round((w * h) / (symbol === 'gypsum' ? 30 : 14)), seed, symbol === 'cork' ? 0.9 : 0.5)}</g>);
      break;
    case 'carpet':
      tint = 0.4;
      parts.push(<g key="st" fill={color}>{stipple(x, y, w, h, Math.round((w * h) / 4), seed, 0.5)}</g>);
      break;
    case 'wood':
    case 'plywood':
    case 'blocking':
      for (let i = 1; i < 9; i++) parts.push(<path key={`g${i}`} d={`M${x} ${y + (h * i) / 9}c${w * 0.25} ${-3} ${w * 0.35} ${3} ${w * 0.6} 0s${w * 0.25} -2 ${w * 0.4} 0`} {...line} strokeWidth={0.7} strokeOpacity={0.8} />);
      tint = 0.3;
      break;
    case 'glass':
      tint = 0.25;
      for (const k of [0.2, 0.3, 0.75]) parts.push(<path key={`g${k}`} d={`M${x + w * k} ${y + h}l${h * 0.5} ${-h}`} stroke="#ffffff" strokeOpacity={0.35} strokeWidth={2} />);
      break;
    case 'metal':
    case 'rubber':
      tint = 0.4;
      parts.push(<path key="b" d={`M${x} ${y + h * 0.3}h${w}`} stroke="#ffffff" strokeOpacity={0.15} strokeWidth={h * 0.15} />);
      break;
    case 'water':
      for (let i = 1; i < 6; i++) parts.push(<path key={`r${i}`} d={`M${x} ${y + (h * i) / 6}q${w / 8} -3 ${w / 4} 0t${w / 4} 0t${w / 4} 0t${w / 4} 0`} {...line} strokeWidth={0.8} />);
      break;
    case 'opening':
      return <g><rect x={x} y={y} width={w} height={h} {...line} strokeDasharray="4 3" /><path d={`M${x} ${y}L${x + w} ${y + h}M${x} ${y + h}L${x + w} ${y}`} {...line} /></g>;
    default:
      tint = 0.25;
  }
  return (
    <g>
      <clipPath id={clip}>
        <rect x={x} y={y} width={w} height={h} />
      </clipPath>
      <rect x={x} y={y} width={w} height={h} fill={color} fillOpacity={tint} />
      <g clipPath={`url(#${clip})`}>{parts}</g>
      <rect x={x} y={y} width={w} height={h} {...line} strokeWidth={1} />
    </g>
  );
}
