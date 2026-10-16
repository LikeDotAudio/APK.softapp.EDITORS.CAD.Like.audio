// Copyright (c) 2026 oneDiversified.

/**
 * LC duplex fiber connector — plastic body with dual ferrules,
 * latch tabs, and laser glow indicator.
 */

import React from 'react';

const LC: React.FC<{ bare?: boolean }> = ({ bare = false }) => (
    <svg viewBox="0 0 120 120" width="100%" height="100%">
        <defs>
            <linearGradient id="lc-plasticBody" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3a3a3a" />
                <stop offset="100%" stopColor="#151515" />
            </linearGradient>
            <linearGradient id="lc-innerCavity" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#050505" />
                <stop offset="100%" stopColor="#1a1a1a" />
            </linearGradient>
            <radialGradient id="lc-redLaser" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ff3333" stopOpacity="1" />
                <stop offset="35%" stopColor="#ff0000" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#ff0000" stopOpacity="0" />
            </radialGradient>
        </defs>
        {/* Blue outer ring (omitted in keystone/bare mode) */}
        {!bare && <circle cx="60" cy="60" r="54" fill="#2a75d3" />}
        {!bare && <circle cx="60" cy="60" r="50" fill="#f8f9fa" />}
            <g transform="translate(60,60) scale(1.15) translate(-60,-60)">
        {/* Latch tabs */}
        <path d="M 40 24 L 50 24 L 50 38 L 40 38 Z" fill="#333333" stroke="#222222" strokeWidth="1" />
        <path d="M 70 24 L 80 24 L 80 38 L 70 38 Z" fill="#333333" stroke="#222222" strokeWidth="1" />
        <rect x="42" y="27" width="6" height="3" fill="#555555" rx="1" />
        <rect x="72" y="27" width="6" height="3" fill="#555555" rx="1" />
        {/* Main plastic body */}
        <rect x="28" y="34" width="64" height="52" rx="4" fill="url(#lc-plasticBody)" stroke="#444444" strokeWidth="1.5" />
        {/* Slot openings at top */}
        <rect x="43" y="38" width="4" height="6" fill="#050505" />
        <rect x="73" y="38" width="4" height="6" fill="#050505" />
        {/* Inner cavities */}
        <rect x="34" y="42" width="22" height="38" rx="2" fill="url(#lc-innerCavity)" />
        <rect x="64" y="42" width="22" height="38" rx="2" fill="url(#lc-innerCavity)" />
        {/* Ferrule rings */}
        <circle cx="45" cy="61" r="8" fill="#ffffff" stroke="#dddddd" strokeWidth="1" />
        <circle cx="75" cy="61" r="8" fill="#ffffff" stroke="#dddddd" strokeWidth="1" />
        {/* Fiber cores */}
        <circle cx="45" cy="61" r="1.5" fill="#000000" />
        {/* Laser glow on channel B */}
        <circle cx="75" cy="61" r="14" fill="url(#lc-redLaser)" />
        <circle cx="75" cy="61" r="1.5" fill="#ffffff" />
        {/* Channel labels */}
        <text x="45" y="88" fill="#666666" fontFamily="sans-serif" fontSize="7" fontWeight="bold" textAnchor="middle">A</text>
        <text x="75" y="88" fill="#666666" fontFamily="sans-serif" fontSize="7" fontWeight="bold" textAnchor="middle">B</text>
    
            </g>
        </svg>
);

export default LC;
