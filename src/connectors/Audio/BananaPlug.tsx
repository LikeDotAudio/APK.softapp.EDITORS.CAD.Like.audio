// Copyright (c) 2026 oneDiversified.

/**
 * Banana Plug connectors — single (BAN1) and dual (BAN2).
 * Based on Pasternack PE4301 / PJP 1010-C technical drawings.
 * Single: cylindrical body with leaf-spring pin.
 * Dual: two pins in a common insulated housing, 0.75" center-to-center.
 */

import React from 'react';

/** Single banana plug — side profile showing leaf-spring pin, tapered body, knurled grip */
const BananaSingle: React.FC = () => (
    <svg viewBox="0 0 120 120" width="100%" height="100%">
        <defs>
            <linearGradient id="ban1-body" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#222" />
                <stop offset="50%" stopColor="#444" />
                <stop offset="100%" stopColor="#222" />
            </linearGradient>
            <linearGradient id="ban1-pin" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f5d56e" />
                <stop offset="40%" stopColor="#c9952a" />
                <stop offset="100%" stopColor="#8a6618" />
            </linearGradient>
            <linearGradient id="ban1-spring" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffe89a" />
                <stop offset="100%" stopColor="#c9952a" />
            </linearGradient>
        </defs>
        {/* Blue outer ring */}
        <circle cx="60" cy="60" r="54" fill="#2a75d3" />
        <circle cx="60" cy="60" r="50" fill="#f8f9fa" />
            <g transform="translate(60,60) scale(1.15) translate(-60,-60)">

        {/* === Side-profile banana plug (horizontal) === */}

        {/* Pin shaft (4mm diameter cylinder) */}
        <rect x="14" y="56" width="36" height="8" rx="1" fill="url(#ban1-pin)" stroke="#8a6618" strokeWidth="0.5" />

        {/* Leaf spring contacts (the characteristic banana shape) */}
        <path d="M 18 56 Q 14 60 18 64" stroke="url(#ban1-spring)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <path d="M 26 56 Q 22 60 26 64" stroke="url(#ban1-spring)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <path d="M 34 56 Q 30 60 34 64" stroke="url(#ban1-spring)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <path d="M 42 56 Q 38 60 42 64" stroke="url(#ban1-spring)" strokeWidth="1.5" fill="none" strokeLinecap="round" />

        {/* Shoulder / collar ring */}
        <rect x="50" y="53" width="4" height="14" rx="1" fill="#999" stroke="#666" strokeWidth="0.5" />

        {/* Insulated body (cylindrical, knurled grip) */}
        <rect x="54" y="50" width="40" height="20" rx="3" fill="url(#ban1-body)" stroke="#333" strokeWidth="1" />

        {/* Knurl lines on body */}
        <line x1="60" y1="51" x2="60" y2="69" stroke="#555" strokeWidth="0.5" />
        <line x1="64" y1="51" x2="64" y2="69" stroke="#555" strokeWidth="0.5" />
        <line x1="68" y1="51" x2="68" y2="69" stroke="#555" strokeWidth="0.5" />
        <line x1="72" y1="51" x2="72" y2="69" stroke="#555" strokeWidth="0.5" />
        <line x1="76" y1="51" x2="76" y2="69" stroke="#555" strokeWidth="0.5" />
        <line x1="80" y1="51" x2="80" y2="69" stroke="#555" strokeWidth="0.5" />
        <line x1="84" y1="51" x2="84" y2="69" stroke="#555" strokeWidth="0.5" />
        <line x1="88" y1="51" x2="88" y2="69" stroke="#555" strokeWidth="0.5" />

        {/* Body highlight stripe */}
        <rect x="54" y="53" width="40" height="3" rx="1" fill="#555" fillOpacity="0.4" />

        {/* Rear cable entry */}
        <rect x="94" y="55" width="10" height="10" rx="2" fill="#333" stroke="#222" strokeWidth="0.5" />
        <circle cx="104" cy="60" r="3" fill="#111" />
            </g>
    </svg>
);

/** Dual banana plug — front face showing two pin sockets in common housing */
const BananaDual: React.FC = () => (
    <svg viewBox="0 0 120 120" width="100%" height="100%">
        <defs>
            <linearGradient id="ban2-body" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#333" />
                <stop offset="50%" stopColor="#555" />
                <stop offset="100%" stopColor="#2a2a2a" />
            </linearGradient>
            <radialGradient id="ban2-jack" cx="50%" cy="40%" r="50%">
                <stop offset="0%" stopColor="#f5d56e" />
                <stop offset="60%" stopColor="#c9952a" />
                <stop offset="100%" stopColor="#8a6618" />
            </radialGradient>
        </defs>
        {/* Blue outer ring */}
        <circle cx="60" cy="60" r="54" fill="#2a75d3" />
        <circle cx="60" cy="60" r="50" fill="#f8f9fa" />
            <g transform="translate(60,60) scale(1.15) translate(-60,-60)">

        {/* === Front-face dual banana housing === */}

        {/* Main housing body (rectangular with rounded corners) */}
        <rect x="18" y="36" width="84" height="48" rx="6" fill="url(#ban2-body)" stroke="#222" strokeWidth="1.5" />

        {/* Housing face plate */}
        <rect x="22" y="40" width="76" height="40" rx="4" fill="#444" stroke="#333" strokeWidth="1" />

        {/* Polarity marking - red band on left */}
        <rect x="22" y="40" width="6" height="40" rx="2" fill="#cc3333" />
        {/* Polarity marking - black band on right */}
        <rect x="92" y="40" width="6" height="40" rx="2" fill="#111" />

        {/* Left banana jack (+ / red) */}
        <circle cx="42" cy="60" r="11" fill="#1a1a1a" stroke="#333" strokeWidth="1" />
        <circle cx="42" cy="60" r="8" fill="url(#ban2-jack)" />
        <circle cx="42" cy="60" r="3.5" fill="#111" stroke="#8a6618" strokeWidth="0.5" />
        {/* Leaf spring contacts visible in hole */}
        <path d="M 39 57 L 39 63" stroke="#ffe89a" strokeWidth="0.8" />
        <path d="M 45 57 L 45 63" stroke="#ffe89a" strokeWidth="0.8" />

        {/* Right banana jack (- / black) */}
        <circle cx="78" cy="60" r="11" fill="#1a1a1a" stroke="#333" strokeWidth="1" />
        <circle cx="78" cy="60" r="8" fill="url(#ban2-jack)" />
        <circle cx="78" cy="60" r="3.5" fill="#111" stroke="#8a6618" strokeWidth="0.5" />
        {/* Leaf spring contacts visible in hole */}
        <path d="M 75 57 L 75 63" stroke="#ffe89a" strokeWidth="0.8" />
        <path d="M 81 57 L 81 63" stroke="#ffe89a" strokeWidth="0.8" />

        {/* Center spacing indicator line */}
        <line x1="42" y1="82" x2="78" y2="82" stroke="#666" strokeWidth="0.5" strokeDasharray="2 1" />

        {/* + and - labels */}
        <text x="42" y="48" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#ff4444" fontFamily="Arial">+</text>
        <text x="78" y="48" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#999" fontFamily="Arial">&ndash;</text>
    
            </g>
        </svg>
);

export default BananaSingle;
export { BananaSingle, BananaDual };
