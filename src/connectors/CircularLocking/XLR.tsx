// Copyright (c) 2026 oneDiversified.

/**
 * XLR connector family — parameterized by pin count and gender.
 * P = Plug (male) — solid gold pins, no latch tab.
 * S = Socket (female) — hollow dark holes, prominent latch tab.
 */

import React from 'react';

/**
 * Pin positions from Neutrik XLR engineering drawings.
 *
 * SVG cavity: center (60, 62), radius 38.
 * Keyway / notch at 12-o'clock (top).
 *
 * Real XLR connectors are NOT symmetric circles — the top pair
 * (near the keyway) sits closer together, and pin spacing widens
 * toward the bottom, forming the characteristic "smile" pattern.
 * Positions below are derived from manufacturer dimensional drawings
 * scaled to fit the SVG cavity (scale ≈ 3.88 SVG units / mm).
 */
const CX = 60, CY = 62;

const PIN_LAYOUTS: Record<number, [number, number][]> = {
    3: [
        // Inverted triangle: 2 at top, 1 at bottom — symmetric 120°
        [CX - 15.8, CY - 3],     // pin 2 (upper-left)
        [CX + 15.8, CY - 3],     // pin 1 (upper-right)
        [CX,        CY + 22],    // pin 3 (bottom center)
    ],
    4: [
        // Trapezoid — wide top pair near keyway, narrow bottom pair
        [CX - 16, CY - 3],    // pin 4 (top-left, wide)
        [CX + 16, CY - 3],    // pin 1 (top-right, wide)
        [CX - 8,  CY + 15],   // pin 3 (bottom-left, narrow)
        [CX + 8,  CY + 15],   // pin 2 (bottom-right, narrow)
    ],
    5: [
        // Shield / home-plate: 2 wide top, 2 narrower mid, 1 bottom center
        [CX - 17, CY - 3],    // pin 5 (top-left, wide)
        [CX + 17, CY - 3],    // pin 1 (top-right, wide)
        [CX - 13, CY + 13],   // pin 4 (mid-left, narrower)
        [CX + 13, CY + 13],   // pin 2 (mid-right, narrower)
        [CX,      CY + 25],   // pin 3 (bottom center)
    ],
    6: [
        // 3 tiers: widest top pair near keyway, mid, narrowest bottom
        [CX - 20, CY - 7],    // pin 6 (top-left, widest)
        [CX + 20, CY - 7],    // pin 1 (top-right, widest)
        [CX - 14, CY + 7],    // pin 5 (mid-left)
        [CX + 14, CY + 7],    // pin 2 (mid-right)
        [CX - 8,  CY + 22],   // pin 4 (bottom-left, narrowest)
        [CX + 8,  CY + 22],   // pin 3 (bottom-right, narrowest)
    ],
    7: [
        // Same 6-pin outer ring + center pin
        [CX - 20, CY - 7],    // pin 6 (top-left, widest)
        [CX + 20, CY - 7],    // pin 1 (top-right, widest)
        [CX - 14, CY + 7],    // pin 5 (mid-left)
        [CX + 14, CY + 7],    // pin 2 (mid-right)
        [CX - 8,  CY + 22],   // pin 4 (bottom-left, narrowest)
        [CX + 8,  CY + 22],   // pin 3 (bottom-right, narrowest)
        [CX,      CY + 6],    // pin 7 (center)
    ],
    8: [
        // Compressed octagon — wider at top near keyway, narrower at bottom
        [CX - 14, CY - 12],   // pin 8 (top-left, widest)
        [CX + 14, CY - 12],   // pin 1 (top-right, widest)
        [CX - 22, CY],        // pin 7 (upper-left)
        [CX + 22, CY],        // pin 2 (upper-right)
        [CX - 18, CY + 12],   // pin 6 (lower-left)
        [CX + 18, CY + 12],   // pin 3 (lower-right)
        [CX - 6,  CY + 22],   // pin 5 (bottom-left, narrowest)
        [CX + 6,  CY + 22],   // pin 4 (bottom-right, narrowest)
    ],
};

type Gender = 'P' | 'S';

const XLRBase: React.FC<{ pins: number; gender: Gender }> = ({ pins, gender }) => {
    const layout = PIN_LAYOUTS[pins] ?? PIN_LAYOUTS[3];
    const isPlug = gender === 'P';

    // Scale pin size by count
    const pinR = pins <= 4 ? 7 : pins <= 6 ? 5.5 : 4.5;
    const innerR = pins <= 4 ? 4.5 : pins <= 6 ? 3.5 : 2.8;
    const pfx = `xlr${pins}${gender}`;

    return (
        <svg viewBox="0 0 120 120" width="100%" height="100%">
            <defs>
                <linearGradient id={`${pfx}-shell`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#eeeeee" />
                    <stop offset="50%" stopColor="#c0c0c0" />
                    <stop offset="100%" stopColor="#808080" />
                </linearGradient>
                <radialGradient id={`${pfx}-pin`} cx="40%" cy="35%" r="60%">
                    <stop offset="0%" stopColor="#f5d56e" />
                    <stop offset="60%" stopColor="#c9952a" />
                    <stop offset="100%" stopColor="#8a6618" />
                </radialGradient>
            </defs>

            {/* Outer ring */}
            <circle cx="60" cy="60" r="54" fill="#2a75d3" />
            {/* Metallic shell */}
            <circle cx="60" cy="60" r="50" fill={`url(#${pfx}-shell)`} />
            <g transform="translate(60,62) scale(1.05) translate(-60,-62)">

            {/* Latch tab — only on S (socket/female), exaggerated */}
            {!isPlug && (
                <g>
                    {/* Latch base bracket */}
                    <rect x="44" y="6" width="32" height="10" rx="2" fill="#b0b0b0" stroke="#888" strokeWidth="1" />
                    {/* Latch tab raised */}
                    <rect x="48" y="2" width="24" height="12" rx="3" fill="#d0d0d0" stroke="#999" strokeWidth="1.2" />
                    {/* Latch slot */}
                    <rect x="53" y="5" width="14" height="5" rx="1.5" fill="#333" />
                    {/* Latch shadow under bracket */}
                    <rect x="46" y="14" width="28" height="4" fill="#999" />
                </g>
            )}

            {/* Notch / keyway at top (small indent on shell ring) */}
            <rect x="56" y="10" width="8" height="5" rx="1" fill={isPlug ? '#aaa' : '#888'} />

            {/* Inner cavity */}
            <circle cx="60" cy="62" r="38" fill="#1a1a1a" />

            {/* Pin count — subtle watermark in cavity background */}
            <text
                x="60" y="62"
                textAnchor="middle"
                dominantBaseline="central"
                fill="#2a75d3"
                fontWeight="bold"
                fontSize="38"
                fontFamily="monospace"
            >
                {pins}
            </text>

            {/* Pins */}
            {layout.map(([cx, cy], i) => (
                <g key={i}>
                    {isPlug ? (
                        /* Plug/Male: solid gold filled pins */
                        <>
                            <circle cx={cx} cy={cy} r={pinR} fill={`url(#${pfx}-pin)`} stroke="#8a6618" strokeWidth="0.8" />
                            {/* Highlight dot */}
                            <circle cx={cx - pinR * 0.2} cy={cy - pinR * 0.2} r={pinR * 0.25} fill="#ffe89a" fillOpacity="0.6" />
                        </>
                    ) : (
                        /* Socket/Female: hollow dark holes */
                        <>
                            <circle cx={cx} cy={cy} r={pinR} fill="#0a0a0a" stroke="#444" strokeWidth="1" />
                            <circle cx={cx} cy={cy} r={innerR} fill="none" stroke="#555" strokeWidth="0.8" />
                        </>
                    )}
                </g>
            ))}
            </g>
        </svg>
    );
};

// ── Plug (Male) variants — solid pins, no latch ──
const XLR3P: React.FC = () => <XLRBase pins={3} gender="P" />;
const XLR4P: React.FC = () => <XLRBase pins={4} gender="P" />;
const XLR5P: React.FC = () => <XLRBase pins={5} gender="P" />;
const XLR6P: React.FC = () => <XLRBase pins={6} gender="P" />;
const XLR7P: React.FC = () => <XLRBase pins={7} gender="P" />;
const XLR8P: React.FC = () => <XLRBase pins={8} gender="P" />;

// ── Socket (Female) variants — hollow holes, latch tab ──
const XLR3S: React.FC = () => <XLRBase pins={3} gender="S" />;
const XLR4S: React.FC = () => <XLRBase pins={4} gender="S" />;
const XLR5S: React.FC = () => <XLRBase pins={5} gender="S" />;
const XLR6S: React.FC = () => <XLRBase pins={6} gender="S" />;
const XLR7S: React.FC = () => <XLRBase pins={7} gender="S" />;
const XLR8S: React.FC = () => <XLRBase pins={8} gender="S" />;

// Backward-compatible aliases (default to plug)
const XLR3 = XLR3P;
const XLR4 = XLR4P;
const XLR5 = XLR5P;
const XLR6 = XLR6P;
const XLR7 = XLR7P;
const XLR8 = XLR8P;

export default XLR3P;
export {
    XLR3, XLR4, XLR5, XLR6, XLR7, XLR8,
    XLR3P, XLR4P, XLR5P, XLR6P, XLR7P, XLR8P,
    XLR3S, XLR4S, XLR5S, XLR6S, XLR7S, XLR8S,
    XLRBase,
};
