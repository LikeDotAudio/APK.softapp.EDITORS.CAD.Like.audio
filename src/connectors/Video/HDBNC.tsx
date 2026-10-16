// Copyright (c) 2026 oneDiversified.

/**
 * HD-BNC connector icon.
 * Smaller form-factor BNC with push-pull locking (no bayonet lugs).
 * Smooth metallic shell, center pin, narrower profile than standard BNC.
 */

import React from 'react';

const HDBNC: React.FC = () => (
    <svg viewBox="0 0 120 120" width="100%" height="100%">
        <defs>
            <linearGradient id="hdbnc-metalOuter" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#eeeeee" />
                <stop offset="50%" stopColor="#c0c0c0" />
                <stop offset="100%" stopColor="#808080" />
            </linearGradient>
            <linearGradient id="hdbnc-metalInner" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#dddddd" />
                <stop offset="100%" stopColor="#888888" />
            </linearGradient>
            <radialGradient id="hdbnc-dielectric" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#dddddd" />
            </radialGradient>
            <radialGradient id="hdbnc-goldPin" cx="40%" cy="40%" r="60%">
                <stop offset="0%" stopColor="#ffe680" />
                <stop offset="100%" stopColor="#b8860b" />
            </radialGradient>
            <linearGradient id="hdbnc-ring" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#d8d8d8" />
                <stop offset="100%" stopColor="#999999" />
            </linearGradient>
        </defs>
        {/* Blue outer ring */}
        <circle cx="60" cy="60" r="54" fill="#2a75d3" />
        {/* Light inner circle */}
        <circle cx="60" cy="60" r="50" fill="#f8f9fa" />
            <g transform="translate(60,60) scale(1.25) translate(-60,-60)">
        {/* Outer metallic shell — smooth, no bayonet lugs */}
        <circle cx="60" cy="60" r="38" fill="url(#hdbnc-metalOuter)" />
        {/* Push-pull grip ring (subtle ridge) */}
        <circle cx="60" cy="60" r="38" fill="none" stroke="url(#hdbnc-ring)" strokeWidth={2} />
        <circle cx="60" cy="60" r="35" fill="none" stroke="#aaa" strokeWidth={0.5} />
        {/* Knurling marks — subtle grip lines around the shell */}
        {Array.from({ length: 24 }, (_, i) => {
            const angle = (i * 15 * Math.PI) / 180;
            const x1 = 60 + Math.cos(angle) * 34;
            const y1 = 60 + Math.sin(angle) * 34;
            const x2 = 60 + Math.cos(angle) * 37;
            const y2 = 60 + Math.sin(angle) * 37;
            return (
                <line
                    key={`k${i}`}
                    x1={x1} y1={y1} x2={x2} y2={y2}
                    stroke="#999"
                    strokeWidth={0.5}
                    fillOpacity={0.6}
                />
            );
        })}
        {/* Inner cavity */}
        <circle cx="60" cy="60" r="28" fill="#1a1a1a" />
        {/* Inner metallic ring */}
        <circle cx="60" cy="60" r="22" fill="url(#hdbnc-metalInner)" />
        <circle cx="60" cy="60" r="19" fill="#111" />
        {/* Dielectric insulator */}
        <circle cx="60" cy="60" r="12" fill="url(#hdbnc-dielectric)" />
        {/* Gold center pin */}
        <circle cx="60" cy="60" r="4.5" fill="url(#hdbnc-goldPin)" />
    
            </g>
        </svg>
);

export default HDBNC;
