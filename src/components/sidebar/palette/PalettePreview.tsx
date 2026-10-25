// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { useId } from 'react';
import type { PaletteItem } from '../../../model/palette/PaletteItem';
import { MaterialFace, MaterialSection } from './materialSymbols';

const BANDS = ['125', '250', '500', '1k', '2k', '4k'];

const mm = (m: number) => `${Math.round(m * 1000)}`;

/**
 * WHAT AN ITEM IS, DRAWN
 *
 * The bottom of the palette: the item under the pointer (else the armed
 * one) as a construction drawing would show it — a section through it with
 * its drafting symbol (materialSymbols: the standard's material indication,
 * or what a treatment is built of), its thickness in mm; beside it, a product
 * at its true proportions with its size, or a finish as the patch the sheet
 * paints; under them its absorption per octave, and what the symbol is called
 * in the standard and in acad.pat. Everything comes from the host's palette
 * row; a host that sends no symbol gets the swatch's hatch.
 */
export function PalettePreview({ item }: { item: PaletteItem | null }) {
  const uid = useId().replace(/:/g, '');
  if (!item) return <div className="flex h-full items-center justify-center px-3 text-center text-[10px] text-[#666]">Point at a finish or a product to see it drawn: its section, its size and what it soaks up.</div>;
  const c = item.color;
  const symbol = item.symbol ?? 'default';
  // the section: a band whose thickness says how deep it is (20 mm … 300 mm drawn 10 … 46 px), the wall behind it
  const depth = item.depth ?? null;
  const band = depth ? Math.max(10, Math.min(46, 10 + (depth / 0.3) * 36)) : 22;
  const furniture = symbol === 'furniture';
  const W = 150;
  const H = 70;
  return (
    <div className="flex h-full min-h-0 flex-col gap-1 overflow-hidden px-2 py-1.5 text-[10px] text-[#cccccc]">
      <div className="min-w-0">
        <div className="truncate font-semibold text-white" title={item.name}>{item.name}</div>
        <div className="truncate text-[9px] text-[#888]">
          {item.category}
          {item.symbolName ? ` · ${item.symbolName}` : ''}
          {item.acad ? ` · acad.pat ${item.acad}` : ''}
        </div>
      </div>
      <svg viewBox={`0 0 ${W * 2 + 14} ${H + 14}`} className="min-h-0 w-full flex-1" preserveAspectRatio="xMidYMid meet" role="img" aria-label={`${item.name}: section and ${item.size ? 'size' : 'face'}`}>
        {/* the section: wall behind at the top, the item, the room under it */}
        <g fontFamily="ui-monospace, monospace" fontSize="7" fill="#888">
          {!furniture && (
            <>
              {symbol !== 'trap' && <rect x={4} y={6} width={W - 8} height={8} fill="#4b4b4b" stroke="#7a7a7a" strokeWidth={0.6} />}
              <MaterialSection symbol={symbol} color={c} x={4} y={14} w={W - 8} h={band} uid={uid} />
              <text x={4} y={14 + band + 9}>ROOM ↓</text>
              {depth && <text x={W - 4} y={14 + band + 9} textAnchor="end" fill="#ccc">{mm(depth)} mm</text>}
              <text x={4} y={4}>section</text>
            </>
          )}
          {furniture && <text x={4} y={H / 2} fill="#888">furniture — drawn in plan →</text>}
        </g>
        {/* the face, or the product at its true proportions */}
        <g transform={`translate(${W + 14} 0)`} fontFamily="ui-monospace, monospace" fontSize="7" fill="#888">
          <text x={0} y={4}>{item.size ? 'face · size' : 'face'}</text>
          {item.size ? (
            (() => {
              const [sw, sh] = item.size;
              const k = Math.min((W - 30) / sw, (H - 22) / sh);
              const bw = sw * k;
              const bh = sh * k;
              const bx = (W - 20 - bw) / 2;
              return (
                <g>
                  <rect x={bx} y={8} width={bw} height={bh} fill={c} fillOpacity={0.3} stroke="#e5e5e5" strokeWidth={1} />
                  {furniture ? null : <MaterialFace symbol={symbol} color={c} x={bx} y={8} w={bw} h={bh} uid={`${uid}f`} />}
                  <text x={bx + bw / 2} y={8 + bh + 9} textAnchor="middle" fill="#ccc">{mm(sw)}</text>
                  <text x={bx + bw + 3} y={8 + bh / 2 + 2} fill="#ccc">{mm(sh)}</text>
                </g>
              );
            })()
          ) : (
            <MaterialFace symbol={symbol} color={c} x={0} y={8} w={W - 20} h={H - 20} uid={`${uid}f`} />
          )}
        </g>
      </svg>
      {item.alpha && (
        <div className="flex items-end gap-1" aria-label="Absorption per octave">
          {item.alpha.slice(0, 6).map((a, i) => (
            <div key={BANDS[i]} className="flex flex-1 flex-col items-center gap-0.5" title={`α ${BANDS[i]} Hz ${a.toFixed(2)}`}>
              <div className="relative h-10 w-full rounded-sm bg-[#111113]">
                <div className="absolute bottom-0 w-full rounded-sm" style={{ height: `${Math.min(1, a) * 100}%`, background: c, opacity: 0.85 }} />
              </div>
              <span className="font-mono text-[8px] text-[#888]">{BANDS[i]}</span>
              <span className="font-mono text-[8px]">{a.toFixed(2)}</span>
            </div>
          ))}
          <span className="pb-3 font-mono text-[8px] text-[#888]">α</span>
        </div>
      )}
      {item.note && <div className="truncate text-[9px] text-[#888]" title={item.note}>{item.note}</div>}
    </div>
  );
}
