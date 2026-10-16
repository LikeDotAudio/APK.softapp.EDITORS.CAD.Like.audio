// Copyright (c) 2026 oneDiversified.

import React from 'react';

const TRS: React.FC = () => (
    <svg viewBox="0 0 120 120" width="100%" height="100%">
        <defs>
            <radialGradient id="trs_outerMetal" cx="50%" cy="45%" r="50%">
                <stop offset="0%" stopColor="#c0c0c0" />
                <stop offset="100%" stopColor="#808080" />
            </radialGradient>
            <radialGradient id="trs_ringMetal" cx="50%" cy="45%" r="50%">
                <stop offset="0%" stopColor="#f5d56e" />
                <stop offset="100%" stopColor="#c9952a" />
            </radialGradient>
            <radialGradient id="trs_tipMetal" cx="45%" cy="40%" r="50%">
                <stop offset="0%" stopColor="#ffe89a" />
                <stop offset="100%" stopColor="#d4a832" />
            </radialGradient>
        </defs>
        {/* Blue outer ring */}
        <circle cx="60" cy="60" r="54" fill="#2a75d3" />
        {/* White inner */}
        <circle cx="60" cy="60" r="50" fill="#f8f9fa" />
            <g transform="translate(60,60) scale(1.15) translate(-60,-60)">
        {/* Outer metallic ring (Sleeve) */}
        <circle cx="60" cy="60" r="40" fill="url(#trs_outerMetal)" />
        <circle cx="60" cy="60" r="40" fill="none" stroke="#666" strokeWidth="1" />
        {/* Sleeve highlight arc */}
        <path d="M30 45 A40 40 0 0 1 90 45" fill="none" stroke="#ddd" strokeWidth="1" strokeOpacity="0.4" />
        {/* Dark insulator gap 1 */}
        <circle cx="60" cy="60" r="32" fill="#1a1a1a" />
        {/* Ring contact (gold) */}
        <circle cx="60" cy="60" r="28" fill="url(#trs_ringMetal)" />
        <circle cx="60" cy="60" r="28" fill="none" stroke="#8a6618" strokeWidth="0.8" />
        {/* Dark insulator gap 2 */}
        <circle cx="60" cy="60" r="20" fill="#1a1a1a" />
        {/* Tip contact (gold center) */}
        <circle cx="60" cy="60" r="14" fill="url(#trs_tipMetal)" />
        <circle cx="60" cy="60" r="14" fill="none" stroke="#8a6618" strokeWidth="0.8" />
        {/* Center dimple */}
        <circle cx="60" cy="60" r="4" fill="#c9952a" />
        <circle cx="58" cy="58" r="1.5" fill="#ffe89a" fillOpacity="0.5" />
    
            </g>
        </svg>
);

export default TRS;
