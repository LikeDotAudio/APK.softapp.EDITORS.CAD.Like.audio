// Copyright (c) 2026 oneDiversified.

import React from 'react';

/** DVI-I Dual Link — D-sub trapezoid shell, 24 digital pins (3 rows x 8) + analog crosshair. */
const DVI: React.FC = () => (
    <svg viewBox="0 0 120 120" width="100%" height="100%">
        <circle cx="60" cy="60" r="54" fill="#2a75d3" />
        <circle cx="60" cy="60" r="50" fill="#f8f9fa" />
            <g transform="translate(60,60) scale(1.1) translate(-60,-60)">
        {/* Outer shell (D-sub trapezoid) */}
        <path d="M 15 40 L 105 40 L 95 80 L 25 80 Z" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="2" />
        {/* Dark cavity */}
        <path d="M 19 44 L 101 44 L 93 76 L 27 76 Z" fill="#0f172a" />
        {/* Digital pin array: 3 rows x 8 columns */}
        <g fill="#eab308">
            {/* Row 1 */}
            <rect x="30" y="50" width="3" height="3" />
            <rect x="35" y="50" width="3" height="3" />
            <rect x="40" y="50" width="3" height="3" />
            <rect x="45" y="50" width="3" height="3" />
            <rect x="52" y="50" width="3" height="3" />
            <rect x="57" y="50" width="3" height="3" />
            <rect x="62" y="50" width="3" height="3" />
            <rect x="67" y="50" width="3" height="3" />
            {/* Row 2 */}
            <rect x="30" y="58" width="3" height="3" />
            <rect x="35" y="58" width="3" height="3" />
            <rect x="40" y="58" width="3" height="3" />
            <rect x="45" y="58" width="3" height="3" />
            <rect x="52" y="58" width="3" height="3" />
            <rect x="57" y="58" width="3" height="3" />
            <rect x="62" y="58" width="3" height="3" />
            <rect x="67" y="58" width="3" height="3" />
            {/* Row 3 */}
            <rect x="28" y="66" width="3" height="3" />
            <rect x="33" y="66" width="3" height="3" />
            <rect x="38" y="66" width="3" height="3" />
            <rect x="43" y="66" width="3" height="3" />
            <rect x="50" y="66" width="3" height="3" />
            <rect x="55" y="66" width="3" height="3" />
            <rect x="60" y="66" width="3" height="3" />
            <rect x="65" y="66" width="3" height="3" />
        </g>
        {/* Analog cross (right side) */}
        <rect x="75" y="57" width="16" height="4" fill="#eab308" />
        <rect x="79" y="49" width="3" height="3" fill="#eab308" />
        <rect x="84" y="49" width="3" height="3" fill="#eab308" />
        <rect x="77" y="65" width="3" height="3" fill="#eab308" />
        <rect x="82" y="65" width="3" height="3" fill="#eab308" />
    
            </g>
        </svg>
);

export default DVI;
