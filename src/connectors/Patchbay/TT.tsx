// Copyright (c) 2026 oneDiversified.

// Changelog:
//   2026-06-06 15:36 - new Patchbay family: TT (Tiny Telephone / Bantam) 4.4mm jack symbol

import React from 'react';

/**
 * TT — Tiny Telephone (Bantam) patch jack.
 *
 * A 4.4 mm miniaturized 1/4" phone jack used on high-density audio patchbays
 * (96 points per rack space vs. 48 for standard). Balanced tip-ring-sleeve.
 * Rendered as a front-view jack face: compact bore with concentric
 * tip / ring / sleeve contacts to convey the small, high-density form factor.
 */
const TT: React.FC = () => (
    <svg viewBox="0 0 120 120" width="100%" height="100%">
        <defs>
            <radialGradient id="tt_shell" cx="50%" cy="42%" r="55%">
                <stop offset="0%" stopColor="#cfcfcf" />
                <stop offset="100%" stopColor="#6e6e6e" />
            </radialGradient>
            <radialGradient id="tt_ring" cx="50%" cy="45%" r="50%">
                <stop offset="0%" stopColor="#f5d56e" />
                <stop offset="100%" stopColor="#c9952a" />
            </radialGradient>
            <radialGradient id="tt_tip" cx="45%" cy="40%" r="55%">
                <stop offset="0%" stopColor="#ffe89a" />
                <stop offset="100%" stopColor="#d4a832" />
            </radialGradient>
        </defs>
        {/* Blue outer ring */}
        <circle cx="60" cy="60" r="54" fill="#2a75d3" />
        {/* White inner background */}
        <circle cx="60" cy="60" r="50" fill="#f8f9fa" />
        {/* Metal bushing (chassis nut) */}
        <circle cx="60" cy="60" r="44" fill="url(#tt_shell)" />
        <circle cx="60" cy="60" r="44" fill="none" stroke="#555" strokeWidth="1" />
        {/* Bushing highlight arc */}
        <path d="M28 50 A44 44 0 0 1 92 50" fill="none" stroke="#eee" strokeWidth="1.2" strokeOpacity="0.45" />
        {/* Sleeve mouth (dark bore) — compact to signal high density */}
        <circle cx="60" cy="60" r="26" fill="#1a1a1a" />
        {/* Sleeve contact rim */}
        <circle cx="60" cy="60" r="26" fill="none" stroke="#3a3a3a" strokeWidth="2" />
        {/* Ring contact (gold) */}
        <circle cx="60" cy="60" r="18" fill="#101010" />
        <circle cx="60" cy="60" r="16" fill="url(#tt_ring)" />
        <circle cx="60" cy="60" r="16" fill="none" stroke="#8a6618" strokeWidth="0.8" />
        {/* Insulator gap */}
        <circle cx="60" cy="60" r="10" fill="#101010" />
        {/* Tip contact (gold center) */}
        <circle cx="60" cy="60" r="8" fill="url(#tt_tip)" />
        <circle cx="60" cy="60" r="8" fill="none" stroke="#8a6618" strokeWidth="0.8" />
        {/* Center highlight */}
        <circle cx="57.5" cy="57.5" r="2" fill="#fff3c4" fillOpacity="0.6" />
    </svg>
);

export default TT;
