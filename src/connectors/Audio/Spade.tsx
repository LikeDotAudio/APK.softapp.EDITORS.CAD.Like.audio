// Copyright (c) 2026 oneDiversified.

import React from 'react';

const Spade: React.FC = () => (
    <svg viewBox="0 0 120 120" width="100%" height="100%">
        <defs>
            <linearGradient id="sp_metalGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#f5d56e" />
                <stop offset="30%" stopColor="#d4a832" />
                <stop offset="60%" stopColor="#c9952a" />
                <stop offset="100%" stopColor="#8a6618" />
            </linearGradient>
            <linearGradient id="sp_highlightGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffe89a" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#c9952a" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="sp_edgeGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#8a6618" />
                <stop offset="50%" stopColor="#d4a832" />
                <stop offset="100%" stopColor="#8a6618" />
            </linearGradient>
        </defs>
        {/* Blue outer ring */}
        <circle cx="60" cy="60" r="54" fill="#2a75d3" />
        {/* White inner */}
        <circle cx="60" cy="60" r="50" fill="#f8f9fa" />
            <g transform="translate(60,60) scale(1.2) translate(-60,-60)">
        {/* Spade U-shape / fork */}
        <path
            d="M42 38 L42 65 Q42 80 50 80 L50 65 L50 55 Q50 50 55 50 L55 50 L55 80 L65 80 L65 50 Q70 50 70 55 L70 65 L70 80 Q78 80 78 65 L78 38 L70 38 L70 48 Q65 42 60 42 Q55 42 50 48 L50 38 Z"
            fill="url(#sp_metalGrad)"
            stroke="#8a6618"
            strokeWidth="1.5"
            strokeLinejoin="round"
        />
        {/* Simplified cleaner spade shape */}
        {/* Left prong */}
        <rect x="38" y="34" width="12" height="48" rx="2" fill="url(#sp_metalGrad)" stroke="#8a6618" strokeWidth="1" />
        {/* Right prong */}
        <rect x="70" y="34" width="12" height="48" rx="2" fill="url(#sp_metalGrad)" stroke="#8a6618" strokeWidth="1" />
        {/* Bottom connecting bar */}
        <rect x="38" y="72" width="44" height="14" rx="3" fill="url(#sp_metalGrad)" stroke="#8a6618" strokeWidth="1" />
        {/* Cable crimp area */}
        <rect x="48" y="86" width="24" height="10" rx="2" fill="url(#sp_edgeGrad)" stroke="#8a6618" strokeWidth="1" />
        {/* Fork slot (cut-out between prongs) */}
        <rect x="50" y="28" width="20" height="44" rx="3" fill="#f8f9fa" />
        {/* Slot top rounded */}
        <circle cx="60" cy="38" r="10" fill="#f8f9fa" />
        {/* Highlight on left prong */}
        <rect x="40" y="36" width="4" height="34" rx="2" fill="url(#sp_highlightGrad)" />
        {/* Highlight on right prong */}
        <rect x="72" y="36" width="4" height="34" rx="2" fill="url(#sp_highlightGrad)" />
    
            </g>
        </svg>
);

export default Spade;
