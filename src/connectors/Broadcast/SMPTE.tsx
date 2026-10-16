// Copyright (c) 2026 oneDiversified.

import React from 'react';

const SMPTE: React.FC = () => (
  <svg viewBox="0 0 120 120" width="100%" height="100%">
    <defs>
      <radialGradient id="smpte_bodyGrad" cx="45%" cy="40%" r="55%">
        <stop offset="0%" stopColor="#c0c0c0" />
        <stop offset="60%" stopColor="#909090" />
        <stop offset="100%" stopColor="#707070" />
      </radialGradient>
      <radialGradient id="smpte_ferruleGrad" cx="50%" cy="40%" r="50%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="100%" stopColor="#e0e0e0" />
      </radialGradient>
    </defs>
    {/* Blue outer ring */}
    <circle cx="60" cy="60" r="54" fill="#2a75d3" />
    {/* White inner */}
    <circle cx="60" cy="60" r="50" fill="#f8f9fa" />
            <g transform="translate(60,60) scale(1.1) translate(-60,-60)">
    {/* Metal shell */}
    <circle cx="60" cy="60" r="44" fill="url(#smpte_bodyGrad)" stroke="#888" strokeWidth="1.2" />
    {/* Latch tab at top */}
    <rect x="50" y="12" width="20" height="8" rx="2" fill="#999" stroke="#777" strokeWidth="0.8" />
    <rect x="54" y="14" width="12" height="4" rx="1" fill="#aaa" />
    {/* Inner cavity */}
    <circle cx="60" cy="62" r="30" fill="#333" />
    {/* Alignment key notch at top of cavity */}
    <rect x="56" y="32" width="8" height="6" rx="1" fill="#555" stroke="#444" strokeWidth="0.5" />
    {/* Fiber ferrule 1 - left */}
    <circle cx="45" cy="55" r="8" fill="url(#smpte_ferruleGrad)" stroke="#bbb" strokeWidth="0.8" />
    <circle cx="45" cy="55" r="3" fill="#111" />
    {/* Fiber ferrule 2 - right */}
    <circle cx="75" cy="55" r="8" fill="url(#smpte_ferruleGrad)" stroke="#bbb" strokeWidth="0.8" />
    <circle cx="75" cy="55" r="3" fill="#111" />
    {/* Electrical pin 1 - bottom left */}
    <circle cx="47" cy="76" r="4" fill="#d4af37" stroke="#b8960c" strokeWidth="0.8" />
    <circle cx="47" cy="76" r="1.5" fill="#c49b2a" />
    {/* Electrical pin 2 - bottom right */}
    <circle cx="73" cy="76" r="4" fill="#d4af37" stroke="#b8960c" strokeWidth="0.8" />
    <circle cx="73" cy="76" r="1.5" fill="#c49b2a" />
  
            </g>
        </svg>
);

export default SMPTE;
