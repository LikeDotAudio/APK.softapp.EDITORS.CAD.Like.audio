// Copyright (c) 2026 oneDiversified.

// Changelog:
//   2026-07-19 22:50 - PIN_POSITIONS was declared Record<number, number[]> then cast to allow the '4n' key; declared string|number-keyed directly so the lookup and positions.map params type cleanly

import React from 'react';

// Keyed by pin count, plus the '4n' pseudo-key for the narrow 4P housing.
const PIN_POSITIONS: Record<string | number, number[]> = {
    2: [57, 63],                       // center 2
    4: [49, 55, 61, 67],               // center 4 (in 6P housing)
    '4n': [52, 57, 62, 67],            // center 4 (in narrow 4P housing)
    6: [46, 52, 58, 64, 70, 76],       // all 6 — centered
};

const RJ11Base: React.FC<{ pins?: number; label?: string; narrow?: boolean }> = ({ pins = 6, label, narrow = false }) => {
    const posKey = narrow ? '4n' : pins;
    const positions = PIN_POSITIONS[posKey] ?? PIN_POSITIONS[6];
    const displayLabel = label ?? String(pins);
    return (
        <svg viewBox="0 0 120 120" width="100%" height="100%">
            <defs>
                <linearGradient id="rj11_bodyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f0f0f0" />
                    <stop offset="100%" stopColor="#d8d8d8" />
                </linearGradient>
            </defs>
            {/* Blue outer border */}
            <rect x="2" y="2" width="116" height="116" rx="6" fill="#2a75d3" />
            {/* White inner */}
            <rect x="6" y="6" width="108" height="108" rx="4" fill="#f8f9fa" />
            <g transform="translate(60,60) scale(1.35) translate(-60,-60)">
                {/* Connector housing */}
                <rect x={narrow ? 37 : 32} y="30" width={narrow ? 46 : 56} height="58" rx="3" fill="url(#rj11_bodyGrad)" stroke="#bbb" strokeWidth="1.2" />
                {/* Plug body - slightly inset */}
                <rect x={narrow ? 40 : 36} y="34" width={narrow ? 40 : 48} height="50" rx="2" fill="#e8e8e8" stroke="#ccc" strokeWidth="0.5" />
                {/* Port opening */}
                <rect x={narrow ? 42 : 38} y="40" width={narrow ? 36 : 44} height="34" rx="2" fill="#222" stroke="#555" strokeWidth="1" />
                {/* Inner port */}
                <rect x={narrow ? 44 : 41} y="43" width={narrow ? 32 : 38} height="28" rx="1" fill="#111" />
                {/* Clip tab at bottom */}
                <rect x="48" y="70" width="24" height="6" rx="1" fill="#333" stroke="#555" strokeWidth="0.5" />
                {/* Gold contacts */}
                {positions.map((x, i) => (
                    <rect key={i} x={x} y="44" width="2" height="12" rx="0.3" fill="#d4af37" />
                ))}
                {/* Pin count watermark */}
                <text
                    x="60" y="65"
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="#2a75d3"
                    fontWeight="bold"
                    fontSize="28"
                    fontFamily="monospace"
                >
                    {displayLabel}
                </text>
            </g>
        </svg>
    );
};

const RJ11: React.FC = () => <RJ11Base pins={6} />;
const RJ6P2C: React.FC = () => <RJ11Base pins={2} label="2" />;
const RJ6P4C: React.FC = () => <RJ11Base pins={4} label="4" />;
const RJ4P: React.FC = () => <RJ11Base pins={4} narrow />;

export default RJ11;
export { RJ11, RJ6P2C, RJ6P4C, RJ4P, RJ11Base };
