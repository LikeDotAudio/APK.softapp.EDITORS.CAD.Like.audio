// Copyright (c) 2026 oneDiversified.

import React from 'react';

const EtherCON: React.FC = () => (
  <svg viewBox="0 0 120 120" width="100%" height="100%">
    <defs>
      <radialGradient id="econ_bodyGrad" cx="45%" cy="40%" r="55%">
        <stop offset="0%" stopColor="#c0c0c0" />
        <stop offset="60%" stopColor="#909090" />
        <stop offset="100%" stopColor="#707070" />
      </radialGradient>
      <linearGradient id="econ_latchGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#bbb" />
        <stop offset="100%" stopColor="#888" />
      </linearGradient>
    </defs>
    {/* Blue outer ring */}
    <circle cx="60" cy="60" r="54" fill="#2a75d3" />
    {/* White inner */}
    <circle cx="60" cy="60" r="50" fill="#f8f9fa" />
            <g transform="translate(60,60) scale(1.1) translate(-60,-60)">
    {/* XLR-style metallic outer shell */}
    <circle cx="60" cy="60" r="44" fill="url(#econ_bodyGrad)" stroke="#888" strokeWidth="1.2" />
    {/* Latch tab at top */}
    <rect x="46" y="12" width="28" height="10" rx="2" fill="url(#econ_latchGrad)" stroke="#777" strokeWidth="0.8" />
    <rect x="50" y="14" width="20" height="6" rx="1" fill="#aaa" />
    {/* Latch release button */}
    <rect x="56" y="15" width="8" height="4" rx="0.5" fill="#999" stroke="#777" strokeWidth="0.5" />
    {/* Inner cavity */}
    <circle cx="60" cy="62" r="32" fill="#333" />
    {/* RJ45 port shape - rectangular inside circle */}
    <rect x="40" y="46" width="40" height="30" rx="2" fill="#1a1a1a" stroke="#555" strokeWidth="1" />
    {/* RJ45 inner opening */}
    <rect x="43" y="49" width="34" height="24" rx="1" fill="#111" stroke="#444" strokeWidth="0.5" />
    {/* Clip notch at bottom of RJ45 */}
    <rect x="50" y="70" width="20" height="5" rx="1" fill="#222" stroke="#444" strokeWidth="0.5" />
    {/* 8 gold contacts in RJ45 */}
    <rect x="45" y="50" width="2" height="10" rx="0.3" fill="#d4af37" />
    <rect x="49" y="50" width="2" height="10" rx="0.3" fill="#d4af37" />
    <rect x="53" y="50" width="2" height="10" rx="0.3" fill="#d4af37" />
    <rect x="57" y="50" width="2" height="10" rx="0.3" fill="#d4af37" />
    <rect x="61" y="50" width="2" height="10" rx="0.3" fill="#d4af37" />
    <rect x="65" y="50" width="2" height="10" rx="0.3" fill="#d4af37" />
    <rect x="69" y="50" width="2" height="10" rx="0.3" fill="#d4af37" />
    <rect x="73" y="50" width="2" height="10" rx="0.3" fill="#d4af37" />
  
            </g>
        </svg>
);

export default EtherCON;
