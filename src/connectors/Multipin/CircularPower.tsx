// Copyright (c) 2026 oneDiversified.

import React from 'react';

const CircularPower: React.FC = () => (
  <svg viewBox="0 0 120 120" width="100%" height="100%">
    <defs>
      <radialGradient id="cp_barrelGrad" cx="45%" cy="40%" r="55%">
        <stop offset="0%" stopColor="#d0d0d0" />
        <stop offset="60%" stopColor="#a8a8a8" />
        <stop offset="100%" stopColor="#888" />
      </radialGradient>
      <radialGradient id="cp_pinGrad" cx="45%" cy="40%" r="50%">
        <stop offset="0%" stopColor="#e0e0e0" />
        <stop offset="100%" stopColor="#aaa" />
      </radialGradient>
    </defs>
    {/* Blue outer ring */}
    <circle cx="60" cy="60" r="54" fill="#2a75d3" />
    {/* White inner */}
    <circle cx="60" cy="60" r="50" fill="#f8f9fa" />
            <g transform="translate(60,60) scale(1.1) translate(-60,-60)">
    {/* Outer barrel - metallic */}
    <circle cx="60" cy="60" r="38" fill="url(#cp_barrelGrad)" stroke="#888" strokeWidth="1.5" />
    {/* Barrel inner rim */}
    <circle cx="60" cy="60" r="34" fill="#999" stroke="#aaa" strokeWidth="0.5" />
    {/* Insulator gap - dark ring */}
    <circle cx="60" cy="60" r="30" fill="#222" />
    {/* Insulator detail */}
    <circle cx="60" cy="60" r="28" fill="#1a1a1a" stroke="#333" strokeWidth="0.5" />
    {/* Inner bore */}
    <circle cx="60" cy="60" r="18" fill="#111" />
    {/* Center pin */}
    <circle cx="60" cy="60" r="8" fill="url(#cp_pinGrad)" stroke="#999" strokeWidth="1" />
    {/* Pin top highlight */}
    <circle cx="58" cy="58" r="3" fill="#ddd" fillOpacity="0.5" />
    {/* Pin center dot */}
    <circle cx="60" cy="60" r="2" fill="#888" />
  
            </g>
        </svg>
);

export default CircularPower;
