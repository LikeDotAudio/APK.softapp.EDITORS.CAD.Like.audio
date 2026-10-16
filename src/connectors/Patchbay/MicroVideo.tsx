// Copyright (c) 2026 oneDiversified.

// Changelog:
//   2026-06-06 15:36 - new Patchbay family: MV (Micro Video) high-density 75-ohm video patch jack

import React from 'react';

/**
 * MV — Micro Video patch jack (e.g. Bittree DS800-MV / B96H high-density video).
 *
 * A miniaturized 75-ohm coaxial video patch jack that packs 96 points into the
 * rack space of a standard 48-point video bay. Rendered as a front-view coax
 * jack face: shield ring, dielectric, and a single center conductor — the
 * coaxial geometry distinguishes it from the audio TT (tip-ring-sleeve) jack.
 */
const MicroVideo: React.FC = () => (
    <svg viewBox="0 0 120 120" width="100%" height="100%">
        <defs>
            <radialGradient id="mv_shell" cx="50%" cy="42%" r="55%">
                <stop offset="0%" stopColor="#cfcfcf" />
                <stop offset="100%" stopColor="#6e6e6e" />
            </radialGradient>
            <radialGradient id="mv_dielectric" cx="50%" cy="45%" r="55%">
                <stop offset="0%" stopColor="#e9eef2" />
                <stop offset="100%" stopColor="#aeb8bf" />
            </radialGradient>
            <radialGradient id="mv_pin" cx="45%" cy="40%" r="55%">
                <stop offset="0%" stopColor="#ffe89a" />
                <stop offset="100%" stopColor="#d4a832" />
            </radialGradient>
        </defs>
        {/* Teal outer ring — keeps it visually distinct from audio (blue) families */}
        <circle cx="60" cy="60" r="54" fill="#1f9e8a" />
        {/* White inner background */}
        <circle cx="60" cy="60" r="50" fill="#f8f9fa" />
        {/* Metal bushing (chassis nut) */}
        <circle cx="60" cy="60" r="44" fill="url(#mv_shell)" />
        <circle cx="60" cy="60" r="44" fill="none" stroke="#555" strokeWidth="1" />
        {/* Bushing highlight arc */}
        <path d="M28 50 A44 44 0 0 1 92 50" fill="none" stroke="#eee" strokeWidth="1.2" strokeOpacity="0.45" />
        {/* Outer shield contact (dark bore) */}
        <circle cx="60" cy="60" r="28" fill="#1a1a1a" />
        {/* Shield contact rim */}
        <circle cx="60" cy="60" r="22" fill="none" stroke="url(#mv_shell)" strokeWidth="4" />
        {/* Dielectric insulator */}
        <circle cx="60" cy="60" r="16" fill="url(#mv_dielectric)" />
        <circle cx="60" cy="60" r="16" fill="none" stroke="#7d8890" strokeWidth="0.8" />
        {/* Center conductor (gold pin) */}
        <circle cx="60" cy="60" r="7" fill="url(#mv_pin)" />
        <circle cx="60" cy="60" r="7" fill="none" stroke="#8a6618" strokeWidth="0.8" />
        {/* Center highlight */}
        <circle cx="58" cy="58" r="1.8" fill="#fff3c4" fillOpacity="0.6" />
    </svg>
);

export default MicroVideo;
