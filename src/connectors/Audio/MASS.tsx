// Copyright (c) 2026 oneDiversified.

// Changelog:
//   2026-06-06 23:10 - add `square` face frame (audio-multipin shell)

import React from 'react';

const MASS: React.FC<{ square?: boolean }> = ({ square }) => {
    const gridCols = 8;
    const gridRows = 8;
    const contacts: { x: number; y: number }[] = [];
    for (let r = 0; r < gridRows; r++) {
        for (let c = 0; c < gridCols; c++) {
            contacts.push({
                x: 37 + c * 5.8,
                y: 37 + r * 5.8,
            });
        }
    }

    return (
        <svg viewBox="0 0 120 120" width="100%" height="100%">
            <defs>
                <linearGradient id="ms_housingGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3a3a3a" />
                    <stop offset="100%" stopColor="#1a1a1a" />
                </linearGradient>
                <linearGradient id="ms_contactGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#f5d56e" />
                    <stop offset="100%" stopColor="#c9952a" />
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
            {/* Dark housing body */}
            <rect x="24" y="24" width="72" height="72" rx="4" fill="url(#ms_housingGrad)" stroke="#555" strokeWidth="1.5" />
            {/* Inner face area */}
            <rect x="32" y="32" width="56" height="56" rx="2" fill="#111" stroke="#333" strokeWidth="0.5" />
            {/* Waffle/grid gold contacts */}
            {contacts.map((p, i) => (
                <rect
                    key={i}
                    x={p.x - 2}
                    y={p.y - 2}
                    width="4"
                    height="4"
                    rx="0.5"
                    fill="url(#ms_contactGrad)"
                    stroke="#8a6618"
                    strokeWidth="0.3"
                />
            ))}
            {/* Grid lines horizontal */}
            {Array.from({ length: gridRows + 1 }, (_, i) => (
                <line
                    key={`h${i}`}
                    x1="33"
                    y1={35 + i * 5.8}
                    x2="87"
                    y2={35 + i * 5.8}
                    stroke="#222"
                    strokeWidth="0.5"
                />
            ))}
            {/* Grid lines vertical */}
            {Array.from({ length: gridCols + 1 }, (_, i) => (
                <line
                    key={`v${i}`}
                    x1={35 + i * 5.8}
                    y1="33"
                    x2={35 + i * 5.8}
                    y2="87"
                    stroke="#222"
                    strokeWidth="0.5"
                />
            ))}
            {/* Alignment key notch top */}
            <rect x="54" y="24" width="12" height="4" rx="1" fill="#444" stroke="#555" strokeWidth="0.5" />
            {/* Corner mounting bosses */}
            <circle cx="28" cy="28" r="2" fill="#444" stroke="#555" strokeWidth="0.5" />
            <circle cx="92" cy="28" r="2" fill="#444" stroke="#555" strokeWidth="0.5" />
            <circle cx="28" cy="92" r="2" fill="#444" stroke="#555" strokeWidth="0.5" />
            <circle cx="92" cy="92" r="2" fill="#444" stroke="#555" strokeWidth="0.5" />
        
            </g>
        </svg>
    );
};

export default MASS;
