// Copyright (c) 2026 oneDiversified.

// Changelog:
//   2026-06-05 20:11 - colour-coded fiber core (per variant) with a glowing halo

/**
 * SC fiber connector — blue housing with push-pull latch,
 * ferrule end-face, and alignment keyways.
 */

import React from 'react';

const SC: React.FC<{ coreColor?: string; bare?: boolean }> = ({ coreColor = '#000', bare = false }) => (
    <svg viewBox="0 0 120 120" width="100%" height="100%">
        <defs>
            <linearGradient id="sc-blue" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#2870b8" />
                <stop offset="100%" stopColor="#184a7d" />
            </linearGradient>
            <linearGradient id="sc-blueDark" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#1e5b99" />
                <stop offset="100%" stopColor="#113d66" />
            </linearGradient>
            <linearGradient id="sc-innerDark" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#222222" />
                <stop offset="100%" stopColor="#0a0a0a" />
            </linearGradient>
            <radialGradient id="sc-ferruleGlow" cx="50%" cy="50%" r="50%">
                <stop offset="70%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#d0d0d0" />
            </radialGradient>
        </defs>
        {/* Blue outer ring (omitted in keystone/bare mode) */}
        {!bare && <circle cx="60" cy="60" r="54" fill="#2a75d3" />}
        {!bare && <circle cx="60" cy="60" r="50" fill="#f8f9fa" />}
            <g transform="translate(60,60) scale(1.15) translate(-60,-60)">
        {/* Top latch tab */}
        <path d="M 52 28 L 68 28 L 68 40 L 52 40 Z" fill="url(#sc-blue)" stroke="#113d66" strokeWidth="1.5" strokeLinejoin="round" />
        {/* Main blue body */}
        <rect x="28" y="34" width="64" height="52" rx="4" fill="url(#sc-blue)" stroke="#113d66" strokeWidth="1.5" />
        {/* Side rails */}
        <line x1="34" y1="40" x2="34" y2="80" stroke="#184a7d" strokeWidth="2" strokeLinecap="round" />
        <line x1="86" y1="40" x2="86" y2="80" stroke="#184a7d" strokeWidth="2" strokeLinecap="round" />
        {/* Inner blue frame */}
        <rect x="36" y="40" width="48" height="40" rx="3" fill="url(#sc-blueDark)" />
        {/* Dark cavity */}
        <rect x="42" y="44" width="36" height="32" rx="2" fill="url(#sc-innerDark)" />
        {/* Alignment keyways */}
        <rect x="56" y="42" width="8" height="4" fill="#0a0a0a" />
        <rect x="56" y="74" width="8" height="4" fill="#0a0a0a" />
        {/* Ferrule end-face */}
        <circle cx="60" cy="60" r="12" fill="url(#sc-ferruleGlow)" />
        {/* Fiber core — colour-coded with a glowing halo */}
        <circle cx="60" cy="60" r="8" fill={coreColor} opacity="0.30" />
        <circle cx="60" cy="60" r="5" fill={coreColor} opacity="0.55" />
        <circle cx="60" cy="60" r="2.6" fill={coreColor} stroke="#3a3a3a" strokeWidth="0.4" />
    
            </g>
        </svg>
);

export default SC;
