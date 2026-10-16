// Copyright (c) 2026 oneDiversified.

/**
 * MTP/MPO multi-fiber push-on connector — parameterized for 8, 12, and 24 strand variants.
 * Each variant shows the correct number of fibers in two rows.
 */

import React from 'react';

/** Fiber layout: two rows, evenly spaced within the cavity */
const FIBER_LAYOUTS: Record<number, { topRow: number[]; bottomRow: number[] }> = {
    8: {
        // 2 rows of 4, spread across x=38..82
        topRow:    [42, 56, 70, 84].map(x => x - 4),
        bottomRow: [42, 56, 70, 84].map(x => x - 4),
    },
    12: {
        // 2 rows of 6, spread across x=36..84
        topRow:    [38, 48, 58, 68, 78, 88].map(x => x - 4),
        bottomRow: [38, 48, 58, 68, 78, 88].map(x => x - 4),
    },
    24: {
        // 2 rows of 12, spread across x=30..90
        topRow:    [32, 37, 42, 47, 52, 57, 62, 67, 72, 77, 82, 87].map(x => x - 1),
        bottomRow: [32, 37, 42, 47, 52, 57, 62, 67, 72, 77, 82, 87].map(x => x - 1),
    },
};

const MTPBase: React.FC<{ strands: number }> = ({ strands }) => {
    const layout = FIBER_LAYOUTS[strands] ?? FIBER_LAYOUTS[12];
    const fiberR = strands === 24 ? 1.0 : 1.5;
    const glowR = strands === 24 ? 3.0 : 5.0;
    const uid = `mtp${strands}`;

    return (
        <svg viewBox="0 0 120 120" width="100%" height="100%">
            <defs>
                <linearGradient id={`${uid}-body`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#3a3a3a" />
                    <stop offset="100%" stopColor="#111111" />
                </linearGradient>
                <linearGradient id={`${uid}-cavity`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#050505" />
                    <stop offset="100%" stopColor="#1a1a1a" />
                </linearGradient>
                <radialGradient id={`${uid}-laser`} cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#ff3333" stopOpacity="1" />
                    <stop offset="35%" stopColor="#ff0000" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#ff0000" stopOpacity="0" />
                </radialGradient>
            </defs>
            {/* Blue outer ring */}
            <circle cx="60" cy="60" r="54" fill="#2a75d3" />
            <circle cx="60" cy="60" r="50" fill="#f8f9fa" />
            <g transform="translate(60,60) scale(1.1) translate(-60,-60)">
            {/* Key pin */}
            <circle cx="16" cy="46" r="3" fill="#ffffff" stroke="#aaaaaa" strokeWidth="0.5" />
            {/* Main plastic body */}
            <rect x="18" y="34" width="84" height="52" rx="4" fill={`url(#${uid}-body)`} stroke="#333333" strokeWidth="1.5" />
            {/* Latch tab */}
            <path d="M 50 30 L 70 30 L 70 42 L 50 42 Z" fill={`url(#${uid}-body)`} stroke="#333333" strokeWidth="1" />
            {/* Inner cavity */}
            <rect x="24" y="42" width="72" height="38" rx="2" fill={`url(#${uid}-cavity)`} stroke="#050505" strokeWidth="1" />
            {/* Side slots */}
            <rect x="22" y="46" width="3" height="30" fill="#0a0a0a" />
            <rect x="95" y="46" width="3" height="30" fill="#0a0a0a" />
            {/* Guide pins */}
            <circle cx="30" cy="61" r="2.5" fill="#111111" stroke="#444444" strokeWidth="1" />
            <circle cx="90" cy="61" r="2.5" fill="#111111" stroke="#444444" strokeWidth="1" />
            {/* Top row — active fibers with laser glow */}
            <g>
                {layout.topRow.map((x, i) => (
                    <React.Fragment key={`t${i}`}>
                        <circle cx={x} cy="54" r={glowR} fill={`url(#${uid}-laser)`} />
                        <circle cx={x} cy="54" r={fiberR} fill="#ffffff" />
                    </React.Fragment>
                ))}
            </g>
            {/* Bottom row — dark fibers */}
            <g fill="#000000">
                {layout.bottomRow.map((x, i) => (
                    <circle key={`b${i}`} cx={x} cy="68" r={fiberR} />
                ))}
            </g>
            {/* Strand count watermark */}
            <text
                x="60" y="69"
                textAnchor="middle"
                dominantBaseline="central"
                fill="#2a75d3"
                fontWeight="bold"
                fontSize={strands === 24 ? '28' : '34'}
                fontFamily="monospace"
            >
                {strands}
            </text>
            </g>
        </svg>
    );
};

const MTP8: React.FC = () => <MTPBase strands={8} />;
const MTP12: React.FC = () => <MTPBase strands={12} />;
const MTP24: React.FC = () => <MTPBase strands={24} />;

export default MTP12;
export { MTP8, MTP12, MTP24, MTPBase };
