// Copyright (c) 2026 oneDiversified.

import React from 'react';

const Punchdown: React.FC = () => (
  <svg viewBox="0 0 120 120" width="100%" height="100%">
    <defs>
      <linearGradient id="pd_bladeGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#d0d0d0" />
        <stop offset="100%" stopColor="#999" />
      </linearGradient>
    </defs>
    {/* Blue outer ring */}
    <circle cx="60" cy="60" r="54" fill="#2a75d3" />
    {/* White inner */}
    <circle cx="60" cy="60" r="50" fill="#f8f9fa" />
            <g transform="translate(60,60) scale(1.05) translate(-60,-60)">
    {/* Plastic base */}
    <rect x="14" y="24" width="92" height="72" rx="3" fill="#e8e8e0" stroke="#bbb" strokeWidth="1" />
    {/* Center channel */}
    <rect x="52" y="24" width="16" height="72" rx="1" fill="#d0d0c8" stroke="#bbb" strokeWidth="0.5" />
    {/* Pair 1 - blue/white */}
    {/* Left blade */}
    <rect x="24" y="30" width="26" height="3" rx="0.5" fill="url(#pd_bladeGrad)" stroke="#aaa" strokeWidth="0.3" />
    <rect x="24" y="28" width="26" height="2" rx="0.5" fill="#3366cc" />
    {/* Right blade */}
    <rect x="70" y="30" width="26" height="3" rx="0.5" fill="url(#pd_bladeGrad)" stroke="#aaa" strokeWidth="0.3" />
    <rect x="70" y="28" width="26" height="2" rx="0.5" fill="#f0f0f0" />
    {/* Pair 2 - orange/white */}
    <rect x="24" y="44" width="26" height="3" rx="0.5" fill="url(#pd_bladeGrad)" stroke="#aaa" strokeWidth="0.3" />
    <rect x="24" y="42" width="26" height="2" rx="0.5" fill="#e87830" />
    <rect x="70" y="44" width="26" height="3" rx="0.5" fill="url(#pd_bladeGrad)" stroke="#aaa" strokeWidth="0.3" />
    <rect x="70" y="42" width="26" height="2" rx="0.5" fill="#f0f0f0" />
    {/* Pair 3 - green/white */}
    <rect x="24" y="58" width="26" height="3" rx="0.5" fill="url(#pd_bladeGrad)" stroke="#aaa" strokeWidth="0.3" />
    <rect x="24" y="56" width="26" height="2" rx="0.5" fill="#33aa44" />
    <rect x="70" y="58" width="26" height="3" rx="0.5" fill="url(#pd_bladeGrad)" stroke="#aaa" strokeWidth="0.3" />
    <rect x="70" y="56" width="26" height="2" rx="0.5" fill="#f0f0f0" />
    {/* Pair 4 - brown/white */}
    <rect x="24" y="72" width="26" height="3" rx="0.5" fill="url(#pd_bladeGrad)" stroke="#aaa" strokeWidth="0.3" />
    <rect x="24" y="70" width="26" height="2" rx="0.5" fill="#885522" />
    <rect x="70" y="72" width="26" height="3" rx="0.5" fill="url(#pd_bladeGrad)" stroke="#aaa" strokeWidth="0.3" />
    <rect x="70" y="70" width="26" height="2" rx="0.5" fill="#f0f0f0" />
    {/* Pair 5 partial - blue stripe */}
    <rect x="24" y="86" width="26" height="3" rx="0.5" fill="url(#pd_bladeGrad)" stroke="#aaa" strokeWidth="0.3" />
    <rect x="24" y="84" width="26" height="2" rx="0.5" fill="#3366cc" fillOpacity="0.6" />
    <rect x="70" y="86" width="26" height="3" rx="0.5" fill="url(#pd_bladeGrad)" stroke="#aaa" strokeWidth="0.3" />
    <rect x="70" y="84" width="26" height="2" rx="0.5" fill="#f0f0f0" fillOpacity="0.6" />
  
            </g>
        </svg>
);

export default Punchdown;
