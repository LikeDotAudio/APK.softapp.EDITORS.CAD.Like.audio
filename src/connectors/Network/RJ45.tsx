// Copyright (c) 2026 oneDiversified.

/**
 * RJ45 connector — metallic shell housing with 8 gold contact pins,
 * latch tab at bottom, and side retention clips.
 */

import React from 'react';

const RJ45Base: React.FC<{ shielded?: boolean; label?: string }> = ({ shielded = false, label = '8' }) => (
    <svg viewBox="0 0 120 120" width="100%" height="100%">
        <defs>
            <linearGradient id="rj45-metalOuter" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#eeeeee" />
                <stop offset="50%" stopColor="#cccccc" />
                <stop offset="100%" stopColor="#999999" />
            </linearGradient>
            <linearGradient id="rj45-goldPin" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ffe670" />
                <stop offset="60%" stopColor="#d4af37" />
                <stop offset="100%" stopColor="#997a00" />
            </linearGradient>
        </defs>
        {/* Outer border — silver for shielded, blue for standard */}
        <rect x="2" y="2" width="116" height="116" rx="6" fill={shielded ? '#b0b0b0' : '#2a75d3'} />
        {/* White background */}
        <rect x={shielded ? 10 : 6} y={shielded ? 10 : 6} width={shielded ? 100 : 108} height={shielded ? 100 : 108} rx="4" fill="#f8f9fa" />
            <g transform="translate(60,60) scale(1.2) translate(-60,-60)">
        {/* Outer metallic housing */}
        <path d="M 22 30 L 98 30 C 100.2 30 102 31.8 102 34 L 102 74 C 102 76.2 100.2 78 98 78 L 82 78 L 82 88 C 82 90.2 80.2 92 78 92 L 42 92 C 39.8 92 38 90.2 38 88 L 38 78 L 22 78 C 19.8 78 18 76.2 18 74 L 18 34 C 18 31.8 19.8 30 22 30 Z" fill="url(#rj45-metalOuter)" stroke="#555555" strokeWidth="1.5" />
        {/* Inner cavity */}
        <path d="M 26 34 L 94 34 C 95.1 34 96 34.9 96 36 L 96 72 C 96 73.1 95.1 74 94 74 L 76 74 L 76 86 C 76 87.1 75.1 88 74 88 L 46 88 C 44.9 88 44 87.1 44 86 L 44 74 L 26 74 C 24.9 74 24 73.1 24 72 L 24 36 C 24 34.9 24.9 34 26 34 Z" fill="#111111" />
        {/* Pin contact area */}
        <path d="M 30 34 L 90 34 L 90 48 L 30 48 Z" fill="#222222" />
        {/* 8 gold pins */}
        <g fill="url(#rj45-goldPin)">
            <rect x="37.5" y="34" width="3" height="14" rx="1" />
            <rect x="43.5" y="34" width="3" height="14" rx="1" />
            <rect x="49.5" y="34" width="3" height="14" rx="1" />
            <rect x="55.5" y="34" width="3" height="14" rx="1" />
            <rect x="61.5" y="34" width="3" height="14" rx="1" />
            <rect x="67.5" y="34" width="3" height="14" rx="1" />
            <rect x="73.5" y="34" width="3" height="14" rx="1" />
            <rect x="79.5" y="34" width="3" height="14" rx="1" />
        </g>
        {/* Side retention clips */}
        <rect x="24" y="56" width="4" height="10" fill="#050505" />
        <rect x="92" y="56" width="4" height="10" fill="#050505" />
        {/* Bottom latch slot */}
        <rect x="48" y="74" width="24" height="6" fill="#050505" />
        {/* Pin count watermark */}
        <text
            x="60" y="60"
            textAnchor="middle"
            dominantBaseline="central"
            fill="#2a75d3"
            fontWeight="bold"
            fontSize="28"
            fontFamily="monospace"
        >
            {label}
        </text>
            </g>
        </svg>
);

const RJ45: React.FC = () => <RJ45Base />;
const SRJ45: React.FC = () => <RJ45Base shielded label="S8" />;

export default RJ45;
export { RJ45, SRJ45, RJ45Base };
