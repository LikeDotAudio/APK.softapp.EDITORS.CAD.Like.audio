// Copyright (c) 2026 oneDiversified.

// Changelog:
//   2026-06-06 23:10 - add `square` face frame (audio-multipin shell); wrappers forward it
//   2026-06-06 21:13 - parameterize by channel count; export EDAC8/12/16/26/32 (SAC38-8/38-12/56/90/120)

import React from 'react';

interface EDACProps {
    /** Audio channels carried by this EDAC / ELCO frame. */
    channels?: number;
    /** Jack-grid columns; rows are derived as ceil(channels / cols). */
    cols?: number;
    /** Square face frame (audio-multipin shell) instead of the round disc. */
    square?: boolean;
}

/**
 * EDAC / ELCO (ITT Cannon) rectangular multipin audio connector — rear face.
 * Metallic shell with corner mounting bolts and a grid of jack holes whose
 * count scales with `channels` (labelled at the top). One component renders
 * the whole SAC38 / SAC56 / SAC90 / SAC120 family via the wrappers below.
 */
const EDAC: React.FC<EDACProps> = ({ channels = 16, cols = 8, square }) => {
    const rows = Math.ceil(channels / cols);

    // Jack field bounds inside the insulator.
    const fieldX = 24;
    const fieldW = 72;
    const fieldY = 50;
    const fieldH = 34;
    const colStep = fieldW / cols;
    const rowStep = fieldH / rows;
    const r = Math.max(0.8, Math.min(2.2, Math.min(colStep, rowStep) * 0.3));

    const pins: { cx: number; cy: number }[] = [];
    for (let i = 0; i < channels; i++) {
        const rr = Math.floor(i / cols);
        const cc = i % cols;
        pins.push({
            cx: fieldX + colStep * (cc + 0.5),
            cy: fieldY + rowStep * (rr + 0.5),
        });
    }

    return (
        <svg viewBox="0 0 120 120" width="100%" height="100%">
            <defs>
                <linearGradient id="ed_shellGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#b8b8b8" />
                    <stop offset="50%" stopColor="#909090" />
                    <stop offset="100%" stopColor="#686868" />
                </linearGradient>
                <radialGradient id="ed_boltGrad" cx="40%" cy="35%" r="60%">
                    <stop offset="0%" stopColor="#d8d8d8" />
                    <stop offset="100%" stopColor="#6a6a6a" />
                </radialGradient>
            </defs>
            {/* Face frame — square audio-multipin shell (or round if not flagged) */}
            {square ? (
                <>
                    <rect x="6" y="6" width="108" height="108" rx="12" fill="#2a75d3" />
                    <rect x="10" y="10" width="100" height="100" rx="9" fill="#f8f9fa" />
                </>
            ) : (
                <>
                    <circle cx="60" cy="60" r="54" fill="#2a75d3" />
                    <circle cx="60" cy="60" r="50" fill="#f8f9fa" />
                </>
            )}
            {/* Channel-count label */}
            <text
                x="60" y="20"
                textAnchor="middle"
                dominantBaseline="central"
                fill="#2a75d3"
                fontWeight="bold"
                fontSize="16"
                fontFamily="monospace"
            >
                {channels}
            </text>
            <g transform="translate(60,60) scale(1.05) translate(-60,-60)">
                {/* Metallic shell */}
                <rect x="18" y="44" width="84" height="46" rx="4" fill="url(#ed_shellGrad)" stroke="#666" strokeWidth="1.5" />
                {/* Dark insulator */}
                <rect x="23" y="49" width="74" height="36" rx="2" fill="#1a1a1a" stroke="#333" strokeWidth="0.5" />
                {/* Jack-hole grid */}
                {pins.map((p, i) => (
                    <circle key={i} cx={p.cx} cy={p.cy} r={r} fill="#d4a832" stroke="#8a6618" strokeWidth="0.3" />
                ))}
                {/* Corner mounting bolt — left */}
                <circle cx="14" cy="67" r="5" fill="url(#ed_boltGrad)" stroke="#555" strokeWidth="0.6" />
                <circle cx="14" cy="67" r="2.4" fill="#777" />
                {/* Corner mounting bolt — right */}
                <circle cx="106" cy="67" r="5" fill="url(#ed_boltGrad)" stroke="#555" strokeWidth="0.6" />
                <circle cx="106" cy="67" r="2.4" fill="#777" />
                {/* Guide key slots */}
                <rect x="27" y="49" width="6" height="3" rx="1" fill="#333" />
                <rect x="87" y="49" width="6" height="3" rx="1" fill="#333" />
            </g>
        </svg>
    );
};

export default EDAC;

// Standard EDAC / ELCO audio frames (SAC part → channel count).
// Wrappers forward `square` so the audio-multipin face flag reaches the frame.
export const EDAC8:  React.FC<{ square?: boolean }> = (p) => <EDAC channels={8}  cols={4} {...p} />; // SAC38-8
export const EDAC12: React.FC<{ square?: boolean }> = (p) => <EDAC channels={12} cols={6} {...p} />; // SAC38-12
export const EDAC16: React.FC<{ square?: boolean }> = (p) => <EDAC channels={16} cols={8} {...p} />; // SAC56
export const EDAC26: React.FC<{ square?: boolean }> = (p) => <EDAC channels={26} cols={9} {...p} />; // SAC90
export const EDAC32: React.FC<{ square?: boolean }> = (p) => <EDAC channels={32} cols={8} {...p} />; // SAC120
