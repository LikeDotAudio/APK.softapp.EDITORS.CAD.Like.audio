// Copyright (c) 2026 oneDiversified.

// Changelog:
//   2026-06-06 23:10 - add `square` face frame; default (TB##P) forwards it

/**
 * Terminal Block connector — parameterized by number of terminals.
 * Each variant renders the correct count of screw contacts in a row.
 */

import React from 'react';

const TerminalBlockBase: React.FC<{ count: number; square?: boolean }> = ({ count, square }) => {
    const n = Math.max(2, Math.min(count, 12));
    // Calculate spacing — fit screws evenly in 88px wide housing (x: 16..104)
    const margin = 10;
    const usable = 88 - margin * 2;
    const spacing = n > 1 ? usable / (n - 1) : 0;
    const startX = 16 + margin + (n === 1 ? usable / 2 : 0);
    // Screw radius scales down for larger counts
    const r = Math.min(7, Math.max(3.5, 40 / n));

    return (
        <svg viewBox="0 0 120 120" width="100%" height="100%">
            <defs>
                <linearGradient id={`tb${n}_screwGrad`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#d0d0d0" />
                    <stop offset="50%" stopColor="#a0a0a0" />
                    <stop offset="100%" stopColor="#c0c0c0" />
                </linearGradient>
            </defs>
            {/* Face frame — square for the audio-multipin TB##P (round otherwise) */}
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
            {/* Dark plastic housing */}
            <rect x="16" y="30" width="88" height="60" rx="3" fill="#2a2a2a" stroke="#444" strokeWidth="1.2" />
            <rect x="16" y="30" width="88" height="8" rx="3" fill="#3a3a3a" />
            {/* Divider lines */}
            {Array.from({ length: n - 1 }, (_, i) => {
                const x = startX + (i + 1) * spacing - spacing / 2;
                return <line key={`d${i}`} x1={x} y1="30" x2={x} y2="90" stroke="#444" strokeWidth="0.8" />;
            })}
            {/* Screws + wire holes */}
            {Array.from({ length: n }, (_, i) => {
                const cx = startX + i * spacing;
                return (
                    <g key={i}>
                        <circle cx={cx} cy="50" r={r} fill={`url(#tb${n}_screwGrad)`} stroke="#888" strokeWidth="0.8" />
                        <line x1={cx - r + 1} y1="50" x2={cx + r - 1} y2="50" stroke="#777" strokeWidth="1.5" strokeLinecap="round" />
                        <rect x={cx - r / 2} y="68" width={Math.max(4, r)} height="12" rx="1" fill="#111" stroke="#333" strokeWidth="0.5" />
                    </g>
                );
            })}
        
            {/* Terminal count watermark */}
            <text
                x="60" y="60"
                textAnchor="middle"
                dominantBaseline="central"
                fill="#2a75d3"
                fontWeight="bold"
                fontSize="38"
                fontFamily="monospace"
            >
                {n}
            </text>
            </g>
        </svg>
    );
};

const TB2: React.FC = () => <TerminalBlockBase count={2} />;
const TB3: React.FC = () => <TerminalBlockBase count={3} />;
const TB4: React.FC = () => <TerminalBlockBase count={4} />;
const TB5: React.FC = () => <TerminalBlockBase count={5} />;
const TB6: React.FC = () => <TerminalBlockBase count={6} />;
const TB7: React.FC = () => <TerminalBlockBase count={7} />;
const TB8: React.FC = () => <TerminalBlockBase count={8} />;
const TB9: React.FC = () => <TerminalBlockBase count={9} />;

// Default export is 4-terminal (generic)
// Default (used by the audio-multipin TB##P) forwards `square` to the base.
const TerminalBlock: React.FC<{ square?: boolean }> = (p) => <TerminalBlockBase count={4} {...p} />;
export default TerminalBlock;
export { TB2, TB3, TB4, TB5, TB6, TB7, TB8, TB9, TerminalBlockBase };
