// Copyright (c) 2026 oneDiversified.

/**
 * BNC connector — bayonet latch design with metallic shell,
 * latch slots, inner cavity, dielectric ring, and gold center pin.
 */

import React from 'react';

const BNC: React.FC = () => (
    <svg viewBox="0 0 120 120" width="100%" height="100%">
        <defs>
            <linearGradient id="bnc-metalOuter" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#eeeeee" />
                <stop offset="50%" stopColor="#c0c0c0" />
                <stop offset="100%" stopColor="#808080" />
            </linearGradient>
            <linearGradient id="bnc-metalInner" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#dddddd" />
                <stop offset="100%" stopColor="#888888" />
            </linearGradient>
            <radialGradient id="bnc-dielectric" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#dddddd" />
            </radialGradient>
            <radialGradient id="bnc-goldPin" cx="40%" cy="40%" r="60%">
                <stop offset="0%" stopColor="#ffe680" />
                <stop offset="100%" stopColor="#b8860b" />
            </radialGradient>
        </defs>
        {/* Outer ring */}
        <circle cx="60" cy="60" r="54" fill="#2a75d3" />
        {/* Metallic shell */}
        <circle cx="60" cy="60" r="50" fill="url(#bnc-metalOuter)" />
            <g transform="translate(60,60) scale(1.1) translate(-60,-60)">
        {/* Bayonet latch slots */}
        <rect x="8" y="56" width="16" height="8" rx="2" fill="#666" />
        <rect x="96" y="56" width="16" height="8" rx="2" fill="#666" />
        {/* Latch nubs */}
        <circle cx="14" cy="60" r="3" fill="#999" />
        <circle cx="106" cy="60" r="3" fill="#999" />
        {/* Inner cavity */}
        <circle cx="60" cy="60" r="36" fill="#1a1a1a" />
        {/* Inner ring */}
        <circle cx="60" cy="60" r="30" fill="url(#bnc-metalInner)" />
        <circle cx="60" cy="60" r="26" fill="#111" />
        {/* Dielectric insulator */}
        <circle cx="60" cy="60" r="16" fill="url(#bnc-dielectric)" />
        {/* Gold center pin */}
        <circle cx="60" cy="60" r="6" fill="url(#bnc-goldPin)" />
            </g>
    </svg>
);

export default BNC;
