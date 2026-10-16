// Copyright (c) 2026 oneDiversified.

import React from 'react';

const OpticalCON: React.FC = () => (
  <svg viewBox="0 0 120 120" width="100%" height="100%">
    <defs>
      <radialGradient id="ocon_bodyGrad" cx="45%" cy="40%" r="55%">
        <stop offset="0%" stopColor="#c0c0c0" />
        <stop offset="60%" stopColor="#909090" />
        <stop offset="100%" stopColor="#707070" />
      </radialGradient>
      <linearGradient id="ocon_latchGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#bbb" />
        <stop offset="100%" stopColor="#888" />
      </linearGradient>
      <radialGradient id="ocon_ferruleGrad" cx="50%" cy="40%" r="50%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="100%" stopColor="#e0e0e0" />
      </radialGradient>
    </defs>
    {/* Blue outer ring */}
    <circle cx="60" cy="60" r="54" fill="#2a75d3" />
    {/* White inner */}
    <circle cx="60" cy="60" r="50" fill="#f8f9fa" />
            <g transform="translate(60,60) scale(1.1) translate(-60,-60)">
    {/* XLR-style metallic outer shell */}
    <circle cx="60" cy="60" r="44" fill="url(#ocon_bodyGrad)" stroke="#888" strokeWidth="1.2" />
    {/* Latch tab at top */}
    <rect x="46" y="12" width="28" height="10" rx="2" fill="url(#ocon_latchGrad)" stroke="#777" strokeWidth="0.8" />
    <rect x="50" y="14" width="20" height="6" rx="1" fill="#aaa" />
    {/* Latch release button */}
    <rect x="56" y="15" width="8" height="4" rx="0.5" fill="#999" stroke="#777" strokeWidth="0.5" />
    {/* Inner cavity */}
    <circle cx="60" cy="62" r="32" fill="#333" />
    {/* Fiber housing block */}
    <rect x="34" y="44" width="52" height="34" rx="3" fill="#2a2a2a" stroke="#555" strokeWidth="0.8" />
    {/* LC-style ferrule housing left */}
    <rect x="38" y="50" width="18" height="22" rx="2" fill="#1a1a1a" stroke="#444" strokeWidth="0.6" />
    {/* Left ferrule */}
    <circle cx="47" cy="61" r="6" fill="url(#ocon_ferruleGrad)" stroke="#ccc" strokeWidth="0.6" />
    <circle cx="47" cy="61" r="2.5" fill="#111" />
    {/* LC-style ferrule housing right */}
    <rect x="64" y="50" width="18" height="22" rx="2" fill="#1a1a1a" stroke="#444" strokeWidth="0.6" />
    {/* Right ferrule */}
    <circle cx="73" cy="61" r="6" fill="url(#ocon_ferruleGrad)" stroke="#ccc" strokeWidth="0.6" />
    <circle cx="73" cy="61" r="2.5" fill="#111" />
    {/* Alignment key at top of cavity */}
    <rect x="55" y="36" width="10" height="6" rx="1" fill="#555" stroke="#444" strokeWidth="0.5" />
  
            </g>
        </svg>
);

export default OpticalCON;
