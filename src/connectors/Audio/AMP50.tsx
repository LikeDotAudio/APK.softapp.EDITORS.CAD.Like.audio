// Copyright (c) 2026 oneDiversified.

// Changelog:
//   2026-06-06 23:10 - add `square` face frame (audio-multipin shell)

import React from 'react';

const AMP50: React.FC<{ square?: boolean }> = ({ square }) => {
    const topPins: number[] = [];
    const bottomPins: number[] = [];
    for (let i = 0; i < 25; i++) {
        topPins.push(27 + i * 2.7);
        bottomPins.push(27 + i * 2.7);
    }

    return (
        <svg viewBox="0 0 120 120" width="100%" height="100%">
            <defs>
                <linearGradient id="a50_shellGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#c0c0c0" />
                    <stop offset="30%" stopColor="#a0a0a0" />
                    <stop offset="100%" stopColor="#707070" />
                </linearGradient>
                <linearGradient id="a50_shellHighlight" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#e0e0e0" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#a0a0a0" stopOpacity="0" />
                </linearGradient>
            </defs>
            {/* Face frame — square audio-multipin shell (or round if not flagged) */}
            {square ? (
                <>
                    <rect x="6" y="6" width="108" height="108" rx="12" fill="#2a75d3" />
                    <rect x="10" y="10" width="100" height="100" rx="9" fill="#f8f9fa" />
                </>
            ) : (
                <>
                    <circle cx="60" cy="60" r="54" fill="#2a75d3" />
                    <circle cx="60" cy="60" r="50" fill="#f8f9fa" />
                </>
            )}
            <g transform="translate(60,60) scale(1.1) translate(-60,-60)">
            {/* Metallic shell body */}
            <rect x="18" y="38" width="84" height="44" rx="3" fill="url(#a50_shellGrad)" stroke="#666" strokeWidth="1.5" />
            {/* Shell highlight */}
            <rect x="18" y="38" width="84" height="20" rx="3" fill="url(#a50_shellHighlight)" />
            {/* Dark insulator body */}
            <rect x="24" y="44" width="72" height="32" rx="2" fill="#1a1a1a" stroke="#333" strokeWidth="0.5" />
            {/* Top row of pins */}
            {topPins.map((x, i) => (
                <circle key={`t${i}`} cx={x} cy="53" r="1" fill="#d4a832" stroke="#8a6618" strokeWidth="0.3" />
            ))}
            {/* Bottom row of pins */}
            {bottomPins.map((x, i) => (
                <circle key={`b${i}`} cx={x} cy="67" r="1" fill="#d4a832" stroke="#8a6618" strokeWidth="0.3" />
            ))}
            {/* Latch clip left */}
            <rect x="14" y="48" width="6" height="24" rx="1.5" fill="#999" stroke="#666" strokeWidth="0.5" />
            <rect x="15" y="50" width="4" height="8" rx="1" fill="#b0b0b0" />
            {/* Latch clip right */}
            <rect x="100" y="48" width="6" height="24" rx="1.5" fill="#999" stroke="#666" strokeWidth="0.5" />
            <rect x="101" y="50" width="4" height="8" rx="1" fill="#b0b0b0" />
            {/* Guide key notch top center */}
            <rect x="55" y="44" width="10" height="4" rx="1" fill="#333" stroke="#555" strokeWidth="0.3" />
            {/* Screw holes */}
            <circle cx="22" cy="60" r="2.5" fill="#444" stroke="#666" strokeWidth="0.5" />
            <circle cx="98" cy="60" r="2.5" fill="#444" stroke="#666" strokeWidth="0.5" />
        
            </g>
        </svg>
    );
};

export default AMP50;
