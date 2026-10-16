// Copyright (c) 2026 oneDiversified.

import React from 'react';

const Triax: React.FC = () => (
  <svg viewBox="0 0 120 120" width="100%" height="100%">
    <defs>
      <radialGradient id="triax_bodyGrad" cx="45%" cy="40%" r="55%">
        <stop offset="0%" stopColor="#c8c8c8" />
        <stop offset="60%" stopColor="#a0a0a0" />
        <stop offset="100%" stopColor="#787878" />
      </radialGradient>
      <linearGradient id="triax_pinGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#d4af37" />
        <stop offset="100%" stopColor="#b8960c" />
      </linearGradient>
    </defs>
    {/* Blue outer ring */}
    <circle cx="60" cy="60" r="54" fill="#2a75d3" />
    {/* White inner */}
    <circle cx="60" cy="60" r="50" fill="#f8f9fa" />
            <g transform="translate(60,60) scale(1.1) translate(-60,-60)">
    {/* Metal housing */}
    <circle cx="60" cy="60" r="44" fill="url(#triax_bodyGrad)" stroke="#888" strokeWidth="1.2" />
    {/* Bayonet slot 1 */}
    <path d="M 82 32 A 40 40 0 0 0 76 26 L 70 33 A 32 32 0 0 1 75 38 Z" fill="#666" stroke="#555" strokeWidth="0.5" />
    {/* Bayonet slot 2 */}
    <path d="M 38 88 A 40 40 0 0 0 44 94 L 50 87 A 32 32 0 0 1 45 82 Z" fill="#666" stroke="#555" strokeWidth="0.5" />
    {/* Inner body */}
    <circle cx="60" cy="60" r="36" fill="#555" />
    {/* Outer conductor (shield) ring */}
    <circle cx="60" cy="60" r="32" fill="#999" stroke="#888" strokeWidth="1" />
    <circle cx="60" cy="60" r="28" fill="#444" />
    {/* Middle conductor ring */}
    <circle cx="60" cy="60" r="22" fill="#999" stroke="#888" strokeWidth="1" />
    <circle cx="60" cy="60" r="18" fill="#444" />
    {/* Insulator between middle and center */}
    <circle cx="60" cy="60" r="13" fill="#3a3a3a" stroke="#555" strokeWidth="0.5" />
    {/* Center pin */}
    <circle cx="60" cy="60" r="7" fill="url(#triax_pinGrad)" stroke="#a08000" strokeWidth="0.8" />
    {/* Pin highlight */}
    <circle cx="58" cy="58" r="2.5" fill="#e8c84a" fillOpacity="0.6" />
  
            </g>
        </svg>
);

export default Triax;
