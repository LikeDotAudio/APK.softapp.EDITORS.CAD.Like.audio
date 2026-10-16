// Copyright (c) 2026 oneDiversified.

import React from 'react';

const SFPModule: React.FC = () => (
  <svg viewBox="0 0 120 120" width="100%" height="100%">
    <defs>
      <linearGradient id="sfp_cageGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#c8c8c8" />
        <stop offset="40%" stopColor="#a0a0a0" />
        <stop offset="70%" stopColor="#b8b8b8" />
        <stop offset="100%" stopColor="#888" />
      </linearGradient>
      <linearGradient id="sfp_bailGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ddd" />
        <stop offset="100%" stopColor="#999" />
      </linearGradient>
    </defs>
    {/* Blue outer ring */}
    <circle cx="60" cy="60" r="54" fill="#2a75d3" />
    {/* White inner */}
    <circle cx="60" cy="60" r="50" fill="#f8f9fa" />
            <g transform="translate(60,60) scale(1.15) translate(-60,-60)">
    {/* Metallic rectangular cage */}
    <rect x="22" y="32" width="76" height="56" rx="3" fill="url(#sfp_cageGrad)" stroke="#777" strokeWidth="1.5" />
    {/* Cage inner bevel */}
    <rect x="26" y="36" width="68" height="48" rx="2" fill="#999" stroke="#888" strokeWidth="0.5" />
    {/* Bail/latch handle on top */}
    <rect x="40" y="24" width="40" height="10" rx="2" fill="url(#sfp_bailGrad)" stroke="#888" strokeWidth="1" />
    <rect x="44" y="26" width="8" height="6" rx="1" fill="#bbb" />
    {/* Bail hinge */}
    <circle cx="82" cy="34" r="2" fill="#999" stroke="#777" strokeWidth="0.5" />
    {/* Module face - dark interior */}
    <rect x="30" y="40" width="60" height="40" rx="2" fill="#333" />
    {/* LC duplex fiber opening - left */}
    <rect x="37" y="50" width="14" height="20" rx="1.5" fill="#1a1a1a" stroke="#555" strokeWidth="0.8" />
    {/* Left fiber port */}
    <rect x="40" y="54" width="8" height="12" rx="1" fill="#222" stroke="#444" strokeWidth="0.5" />
    <circle cx="44" cy="60" r="2.5" fill="#f0f0f0" />
    <circle cx="44" cy="60" r="1" fill="#111" />
    {/* LC duplex fiber opening - right */}
    <rect x="69" y="50" width="14" height="20" rx="1.5" fill="#1a1a1a" stroke="#555" strokeWidth="0.8" />
    {/* Right fiber port */}
    <rect x="72" y="54" width="8" height="12" rx="1" fill="#222" stroke="#444" strokeWidth="0.5" />
    <circle cx="76" cy="60" r="2.5" fill="#f0f0f0" />
    <circle cx="76" cy="60" r="1" fill="#111" />
    {/* TX/RX labels */}
    <text x="44" y="76" textAnchor="middle" fontSize="5" fill="#888" fontFamily="sans-serif">TX</text>
    <text x="76" y="76" textAnchor="middle" fontSize="5" fill="#888" fontFamily="sans-serif">RX</text>
  
            </g>
        </svg>
);

export default SFPModule;
