// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { DEFAULT_PALETTE_HATCH, type PaletteItem } from '../../../model/palette/PaletteItem';

/**
 * The item's colour and pattern in a chip, drawn the way the sheet will paint
 * it — a tint with the hatch over it — so the panel previews the patch rather
 * than just naming it. A product gets a solid border: it is a thing, not an area.
 */
export function PaletteSwatch({ item }: { item: PaletteItem }) {
  const hatch = (item.hatch ?? DEFAULT_PALETTE_HATCH).toUpperCase();
  const c = item.color;
  return (
    <svg viewBox="0 0 20 14" className="h-3.5 w-5 flex-shrink-0" aria-hidden="true">
      <rect x="0.5" y="0.5" width="19" height="13" fill={c} fillOpacity={hatch === 'SOLID' ? 0.85 : 0.3} />
      <g stroke={c} strokeWidth="1" fill={c}>
        {hatch === 'GRID' && <path d="M5 0v14M10 0v14M15 0v14M0 4.5h20M0 9.5h20" />}
        {hatch === 'DOTS' &&
          [3, 8, 13, 18].flatMap((x) => [3.5, 10].map((y) => <rect key={`${x}-${y}`} x={x - 0.6} y={y - 0.6} width="1.2" height="1.2" stroke="none" />))}
        {(hatch === 'ANSI31' || hatch === 'ANSI37' || !['SOLID', 'GRID', 'DOTS'].includes(hatch)) && (
          <path d="M-4 14L10 0M2 14L16 0M8 14L22 0M14 14L28 0" />
        )}
        {hatch === 'ANSI37' && <path d="M-4 0L10 14M2 0L16 14M8 0L22 14M14 0L28 14" />}
      </g>
      <rect
        x="0.5"
        y="0.5"
        width="19"
        height="13"
        fill="none"
        stroke={item.size ? '#e5e5e5' : c}
        strokeWidth={item.size ? 1 : 0.75}
      />
    </svg>
  );
}
