// Copyright (c) 2026 oneDiversified.

/**
 * QSFP transceiver family — wider rectangular form factor (quad lane).
 * QSFP+ (40G), QSFP28 (100G), QSFP56 (200G), QSFP-DD (400-800G).
 */

import React from 'react';

type QSFPVariant = 'QSFP+' | 'QSFP28' | 'QSFP56' | 'QSFP-DD';

const SPEED_LABELS: Record<QSFPVariant, string> = {
    'QSFP+':   '40G',
    'QSFP28':  '100G',
    'QSFP56':  '200G',
    'QSFP-DD': '400G',
};

const LANE_LABELS: Record<QSFPVariant, string> = {
    'QSFP+':   '4x10G',
    'QSFP28':  '4x25G',
    'QSFP56':  '4x50G',
    'QSFP-DD': '8x50G',
};

const ACCENT_COLORS: Record<QSFPVariant, string> = {
    'QSFP+':   '#2a75d3',
    'QSFP28':  '#2a9d3a',
    'QSFP56':  '#d4872a',
    'QSFP-DD': '#8e44ad',
};

const QSFPBase: React.FC<{ variant: QSFPVariant }> = ({ variant }) => {
    const speed = SPEED_LABELS[variant];
    const lanes = LANE_LABELS[variant];
    const accent = ACCENT_COLORS[variant];
    const pfx = `qsfp-${variant.replace('+', 'p').replace('-', '')}`;

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
            <rect x="2" y="8" width="116" height="104" rx="6" fill={accent} />
            {/* Light background */}
            <rect x="6" y="12" width="108" height="96" rx="4" fill="#f0f1f2" />

            {/* Wide metallic cage */}
            <rect x="10" y="26" width="100" height="62" rx="3" fill={`url(#${pfx}-cage)`} stroke="#777" strokeWidth="1.2" />
            {/* Cage inner bevel */}
            <rect x="14" y="30" width="92" height="54" rx="2" fill="#aaa" stroke="#999" strokeWidth="0.5" />

            {/* Bail/latch handle — wider for QSFP */}
            <rect x="62" y="17" width="42" height="11" rx="2" fill={`url(#${pfx}-bail)`} stroke="#888" strokeWidth="0.8" />
            <circle cx="106" cy="28" r="2" fill="#999" stroke="#777" strokeWidth="0.5" />

            {/* Module face — dark interior */}
            <rect x="18" y="34" width="84" height="46" rx="2" fill={`url(#${pfx}-body)`} />

            {/* 4 fiber lane ports in a row */}
            {[0, 1, 2, 3].map(i => {
                const cx = 30 + i * 20;
                return (
                    <g key={i}>
                        <rect x={cx - 6} y="42" width="12" height="18" rx="1.5" fill="#0a0a0a" stroke="#555" strokeWidth="0.6" />
                        <rect x={cx - 4} y="45" width="8" height="12" rx="1" fill="#181818" stroke="#444" strokeWidth="0.4" />
                        <circle cx={cx} cy="51" r="2.5" fill="#e8e8e8" />
                        <circle cx={cx} cy="51" r="1" fill="#111" />
                    </g>
                );
            })}

            {/* Lane labels */}
            {[0, 1, 2, 3].map(i => (
                <text key={i} x={30 + i * 20} y="66" textAnchor="middle" fontSize="4.5" fill="#666" fontFamily="sans-serif">
                    L{i + 1}
                </text>
            ))}

            {/* Variant label — top */}
            <text
                x="60" y="19"
                textAnchor="middle"
                dominantBaseline="central"
                fill={accent}
                fontWeight="bold"
                fontSize="12"
                fontFamily="monospace"
            >
                {variant}
            </text>

            {/* Speed watermark — center of module face */}
            <text
                x="60" y="68"
                textAnchor="middle"
                dominantBaseline="central"
                fill="#2a75d3"
                fontWeight="bold"
                fontSize="20"
                fontFamily="monospace"
                opacity="0.7"
            >
                {speed}
            </text>

            {/* Bottom lane info bar */}
            <rect x="10" y="92" width="100" height="12" rx="2" fill={accent} opacity="0.15" />
            <text
                x="60" y="99"
                textAnchor="middle"
                dominantBaseline="central"
                fill={accent}
                fontWeight="bold"
                fontSize="8"
                fontFamily="monospace"
            >
                {lanes} — {speed}bps
            </text>
        </svg>
    );
};

const QSFPPlus: React.FC = () => <QSFPBase variant="QSFP+" />;
const QSFP28: React.FC = () => <QSFPBase variant="QSFP28" />;
const QSFP56: React.FC = () => <QSFPBase variant="QSFP56" />;
const QSFPDD: React.FC = () => <QSFPBase variant="QSFP-DD" />;

export default QSFPPlus;
export { QSFPPlus, QSFP28, QSFP56, QSFPDD, QSFPBase };
