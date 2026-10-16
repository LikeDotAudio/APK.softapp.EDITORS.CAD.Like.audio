// Copyright (c) 2026 oneDiversified.

import React from 'react';

const RCA: React.FC = () => (
    <svg viewBox="0 0 120 120" width="100%" height="100%">
        <defs>
            <radialGradient id="rca_outerMetal" cx="50%" cy="45%" r="50%">
                <stop offset="0%" stopColor="#c0c0c0" />
                <stop offset="100%" stopColor="#808080" />
            </radialGradient>
            <radialGradient id="rca_pinGrad" cx="45%" cy="40%" r="50%">
                <stop offset="0%" stopColor="#ffe89a" />
                <stop offset="100%" stopColor="#c9952a" />
            </radialGradient>
        </defs>
        {/* Blue outer ring */}
        <circle cx="60" cy="60" r="54" fill="#2a75d3" />
        {/* White inner */}
        <circle cx="60" cy="60" r="50" fill="#f8f9fa" />
            <g transform="translate(60,60) scale(1.15) translate(-60,-60)">
        {/* Outer metallic ring */}
        <circle cx="60" cy="60" r="38" fill="url(#rca_outerMetal)" stroke="#666" strokeWidth="1" />
        {/* Leaf-spring tabs (4 tabs on outer ring) */}
        {/* Top tab */}
        <path d="M55 23 L65 23 L63 30 L57 30 Z" fill="#a0a0a0" stroke="#777" strokeWidth="0.5" />
        {/* Bottom tab */}
        <path d="M55 97 L65 97 L63 90 L57 90 Z" fill="#a0a0a0" stroke="#777" strokeWidth="0.5" />
        {/* Left tab */}
        <path d="M23 55 L23 65 L30 63 L30 57 Z" fill="#a0a0a0" stroke="#777" strokeWidth="0.5" />
        {/* Right tab */}
        <path d="M97 55 L97 65 L90 63 L90 57 Z" fill="#a0a0a0" stroke="#777" strokeWidth="0.5" />
        {/* Split lines on outer ring (between tabs) */}
        <line x1="60" y1="22" x2="60" y2="32" stroke="#555" strokeWidth="0.8" />
        <line x1="60" y1="88" x2="60" y2="98" stroke="#555" strokeWidth="0.8" />
        <line x1="22" y1="60" x2="32" y2="60" stroke="#555" strokeWidth="0.8" />
        <line x1="88" y1="60" x2="98" y2="60" stroke="#555" strokeWidth="0.8" />
        {/* Inner edge of outer ring */}
        <circle cx="60" cy="60" r="30" fill="none" stroke="#999" strokeWidth="0.5" />
        {/* Dark insulator ring */}
        <circle cx="60" cy="60" r="28" fill="#1a1a1a" />
        {/* Insulator inner edge */}
        <circle cx="60" cy="60" r="16" fill="#111" />
        {/* Gold center pin */}
        <circle cx="60" cy="60" r="10" fill="url(#rca_pinGrad)" stroke="#8a6618" strokeWidth="1" />
        {/* Pin highlight */}
        <circle cx="57" cy="57" r="3" fill="#ffe89a" fillOpacity="0.4" />
        {/* Pin center hole */}
        <circle cx="60" cy="60" r="2.5" fill="#b8892a" />
    
            </g>
        </svg>
);

export default RCA;
