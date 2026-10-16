// Copyright (c) 2026 oneDiversified.

/**
 * Mini USB connector icon — small trapezoidal shape, wider at top,
 * narrower at bottom, 5 pins visible, metallic shell with dark insulator.
 */

import React from 'react';

const MiniUsb: React.FC = () => (
    <svg viewBox="0 0 120 120" width="100%" height="100%">
        <defs>
            <linearGradient id="mu-shell" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#e8e8e8" />
                <stop offset="40%" stopColor="#cccccc" />
                <stop offset="100%" stopColor="#999999" />
            </linearGradient>
            <linearGradient id="mu-gold" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ffe670" />
                <stop offset="60%" stopColor="#d4af37" />
                <stop offset="100%" stopColor="#997a00" />
            </linearGradient>
        </defs>
        {/* Blue outer ring */}
        <circle cx="60" cy="60" r="54" fill="#2a75d3" />
        {/* Light inner disc */}
        <circle cx="60" cy="60" r="50" fill="#f8f9fa" />
            <g transform="translate(60,60) scale(1.15) translate(-60,-60)">
        {/* Metallic outer shell — trapezoid, wider top, narrower bottom */}
        <path
            d="M 30 42 L 90 42 L 84 82 L 36 82 Z"
            fill="url(#mu-shell)"
            stroke="#888"
            strokeWidth="1.5"
            strokeLinejoin="round"
        />
        {/* Shell top highlight */}
        <path d="M 30 42 L 90 42 L 89 45 L 31 45 Z" fill="#ddd" fillOpacity="0.5" />
        {/* Dark inner cavity — trapezoidal */}
        <path
            d="M 35 47 L 85 47 L 80 77 L 40 77 Z"
            fill="#1a1a1a"
        />
        {/* Dark insulator block */}
        <path
            d="M 39 52 L 81 52 L 78 72 L 42 72 Z"
            fill="#2a2a2a"
            stroke="#444"
            strokeWidth="0.6"
        />
        {/* 5 gold contact pins */}
        <g fill="url(#mu-gold)">
            <rect x="46" y="58" width="3.5" height="8" rx="0.6" />
            <rect x="52" y="58" width="3.5" height="8" rx="0.6" />
            <rect x="58" y="58" width="3.5" height="8" rx="0.6" />
            <rect x="64" y="58" width="3.5" height="8" rx="0.6" />
            <rect x="70" y="58" width="3.5" height="8" rx="0.6" />
        </g>
    
            </g>
        </svg>
);

export default MiniUsb;
