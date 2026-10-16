// Copyright (c) 2026 oneDiversified.

// Changelog:
//   2026-08-14 11:30 - created: brush strip / brush grommet management feature (FEATURE-202608132265)

/**
 * Brush strip — a face slot closed by nylon bristles. Cables push through and the
 * bristles close behind them, keeping airflow and dust separation. No signal, no port.
 */

import React from 'react';

/** Bristle x-positions across the slot — drawn rather than looped-in-place so the
 *  spacing is visible in the source. */
const BRISTLES = [9, 11.5, 14, 16.5, 19, 21.5, 24, 26.5, 29, 31.5, 34, 36.5, 39];

const BrushStrip: React.FC = () => (
    <svg viewBox="0 0 48 32" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        {/* Panel face */}
        <rect x="1" y="1" width="46" height="30" rx="3" fill="#2b2b2b" stroke="#555" strokeWidth="1" />
        {/* The slot behind the bristles */}
        <rect x="7" y="9" width="34" height="14" rx="2" fill="#111" stroke="#3d3d3d" strokeWidth="1" />
        {/* Bristles meeting in the middle from top and bottom */}
        {BRISTLES.map(x => (
            <g key={x}>
                <line x1={x} y1="9.5" x2={x} y2="16.2" stroke="#8d8377" strokeWidth="0.9" strokeLinecap="round" />
                <line x1={x} y1="22.5" x2={x} y2="15.8" stroke="#8d8377" strokeWidth="0.9" strokeLinecap="round" />
            </g>
        ))}
    </svg>
);

export default BrushStrip;
