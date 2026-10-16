// Copyright (c) 2026 oneDiversified.
//
// This software, its source code, and all associated functions, scripts, and
// documentation are the proprietary and confidential property of oneDiversified.

// Changelog:
//   2026-06-06 22:00 - square (not round) chrome frame — E3 is a square shell
//   2026-06-06 21:30 - new E3 (Elco3 / Edac3) single-channel audio connector — 3 gold T/R/S pins in a chamfered shell

import React from 'react';

/**
 * E3 — Elco3 / Edac3 single-channel audio connector. A small 3-pin nylon shell
 * (Tip / Ring / Sleeve) used as a balanced single-channel audio connector.
 *
 * Drawn as a vertical chamfered-top shell holding three gold square pins stacked
 * top→bottom, each labelled T / R / S to the right (matching the field sketch).
 */
const ELCO3: React.FC = () => {
    // Three pin centres (top→bottom): Tip, Ring, Sleeve.
    const pins: { cy: number; label: string }[] = [
        { cy: 42, label: 'T' },
        { cy: 60, label: 'R' },
        { cy: 78, label: 'S' },
    ];
    const pinCx = 52;   // pins sit left-of-centre, labels to their right
    const half = 7;     // half pin size

    return (
        <svg viewBox="0 0 120 120" width="100%" height="100%">
            <defs>
                <linearGradient id="e3_gold" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ffe89a" />
                    <stop offset="100%" stopColor="#d4a832" />
                </linearGradient>
                <linearGradient id="e3_shell" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f4f5f6" />
                    <stop offset="100%" stopColor="#d6dade" />
                </linearGradient>
            </defs>

            {/* Family chrome: SQUARE blue frame + white inner (E3 is a square shell). */}
            <rect x="6" y="6" width="108" height="108" rx="12" fill="#2a75d3" />
            <rect x="10" y="10" width="100" height="100" rx="9" fill="#f8f9fa" />

            {/* Connector shell — vertical body with chamfered top corners. */}
            <path
                d="M48,24 L64,24 L74,34 L74,90 Q74,100 64,100 L48,100 Q38,100 38,90 L38,34 L48,24 Z"
                fill="url(#e3_shell)" stroke="#9aa0a6" strokeWidth="1.6"
            />

            {/* Three gold T/R/S pins with a fastener cross. */}
            {pins.map((p) => (
                <g key={p.label}>
                    <rect
                        x={pinCx - half} y={p.cy - half} width={half * 2} height={half * 2}
                        rx="2" fill="url(#e3_gold)" stroke="#8a6618" strokeWidth="0.9"
                    />
                    <line x1={pinCx - 4} y1={p.cy - 4} x2={pinCx + 4} y2={p.cy + 4} stroke="#8a6618" strokeWidth="1" />
                    <line x1={pinCx - 4} y1={p.cy + 4} x2={pinCx + 4} y2={p.cy - 4} stroke="#8a6618" strokeWidth="1" />
                    <text
                        x={pinCx + half + 6} y={p.cy} textAnchor="middle" dominantBaseline="central"
                        fill="#333" fontWeight="bold" fontSize="12" fontFamily="monospace"
                    >
                        {p.label}
                    </text>
                </g>
            ))}
        </svg>
    );
};

export default ELCO3;
