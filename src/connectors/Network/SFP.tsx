// Copyright (c) 2026 oneDiversified.

/**
 * SFP transceiver family — rectangular form factor icons.
 * SFP (1G), SFP+ (10G), SFP28 (25G), SFP56 (50G).
 */

import React from 'react';

type SFPVariant = 'SFP' | 'SFP+' | 'SFP28' | 'SFP56';

const SPEED_LABELS: Record<SFPVariant, string> = {
    'SFP':   '1G',
    'SFP+':  '10G',
    'SFP28': '25G',
    'SFP56': '50G',
};

const ACCENT_COLORS: Record<SFPVariant, string> = {
    'SFP':   '#2a75d3',
    'SFP+':  '#2a9d3a',
    'SFP28': '#d4872a',
    'SFP56': '#c0392b',
};

const SFPBase: React.FC<{ variant: SFPVariant }> = ({ variant }) => {
    const speed = SPEED_LABELS[variant];
    const accent = ACCENT_COLORS[variant];
    const pfx = `sfp-${variant.replace('+', 'p')}`;

    return (
        <svg viewBox="0 0 120 120" width="100%" height="100%">
            <defs>
                <linearGradient id={`${pfx}-cage`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#d0d0d0" />
                    <stop offset="40%" stopColor="#b0b0b0" />
                    <stop offset="100%" stopColor="#888888" />
                </linearGradient>
                <linearGradient id={`${pfx}-body`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#3a3a3a" />
                    <stop offset="100%" stopColor="#1a1a1a" />
                </linearGradient>
                <linearGradient id={`${pfx}-bail`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#ddd" />
                    <stop offset="100%" stopColor="#999" />
                </linearGradient>
            </defs>

            {/* Accent color border — rectangular */}
            <rect x="4" y="10" width="112" height="100" rx="6" fill={accent} />
            {/* Light background */}
            <rect x="8" y="14" width="104" height="92" rx="4" fill="#f0f1f2" />

            {/* Metallic cage */}
            <rect x="14" y="28" width="92" height="58" rx="3" fill={`url(#${pfx}-cage)`} stroke="#777" strokeWidth="1.2" />
            {/* Cage inner bevel */}
            <rect x="18" y="32" width="84" height="50" rx="2" fill="#aaa" stroke="#999" strokeWidth="0.5" />

            {/* Bail/latch handle */}
            <rect x="70" y="20" width="32" height="10" rx="2" fill={`url(#${pfx}-bail)`} stroke="#888" strokeWidth="0.8" />
            <circle cx="104" cy="30" r="2" fill="#999" stroke="#777" strokeWidth="0.5" />

            {/* Module face — dark interior */}
            <rect x="22" y="36" width="76" height="42" rx="2" fill={`url(#${pfx}-body)`} />

            {/* LC duplex fiber openings */}
            <rect x="30" y="44" width="16" height="22" rx="1.5" fill="#0a0a0a" stroke="#555" strokeWidth="0.8" />
            <rect x="33" y="48" width="10" height="14" rx="1" fill="#181818" stroke="#444" strokeWidth="0.5" />
            <circle cx="38" cy="55" r="3" fill="#e8e8e8" />
            <circle cx="38" cy="55" r="1.2" fill="#111" />

            <rect x="74" y="44" width="16" height="22" rx="1.5" fill="#0a0a0a" stroke="#555" strokeWidth="0.8" />
            <rect x="77" y="48" width="10" height="14" rx="1" fill="#181818" stroke="#444" strokeWidth="0.5" />
            <circle cx="82" cy="55" r="3" fill="#e8e8e8" />
            <circle cx="82" cy="55" r="1.2" fill="#111" />

            {/* TX / RX labels */}
            <text x="38" y="72" textAnchor="middle" fontSize="5" fill="#666" fontFamily="sans-serif">TX</text>
            <text x="82" y="72" textAnchor="middle" fontSize="5" fill="#666" fontFamily="sans-serif">RX</text>

            {/* Variant label — top */}
            <text
                x="60" y="21"
                textAnchor="middle"
                dominantBaseline="central"
                fill={accent}
                fontWeight="bold"
                fontSize="14"
                fontFamily="monospace"
            >
                {variant}
            </text>

            {/* Speed watermark — center of module face */}
            <text
                x="60" y="65"
                textAnchor="middle"
                dominantBaseline="central"
                fill="#2a75d3"
                fontWeight="bold"
                fontSize="22"
                fontFamily="monospace"
                opacity="0.7"
            >
                {speed}
            </text>

            {/* Bottom speed bar */}
            <rect x="14" y="90" width="92" height="10" rx="2" fill={accent} opacity="0.15" />
            <text
                x="60" y="96"
                textAnchor="middle"
                dominantBaseline="central"
                fill={accent}
                fontWeight="bold"
                fontSize="8"
                fontFamily="monospace"
            >
                {speed}bps
            </text>
        </svg>
    );
};

const SFP1G: React.FC = () => <SFPBase variant="SFP" />;
const SFPPlus: React.FC = () => <SFPBase variant="SFP+" />;
const SFP28: React.FC = () => <SFPBase variant="SFP28" />;
const SFP56: React.FC = () => <SFPBase variant="SFP56" />;

export default SFP1G;
export { SFP1G, SFPPlus, SFP28, SFP56, SFPBase };
