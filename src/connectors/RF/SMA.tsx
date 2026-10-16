// Copyright (c) 2026 oneDiversified.

import React from 'react';

const SMA: React.FC = () => (
  <svg viewBox="0 0 120 120" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="sma-goldHex" cx="40%" cy="35%" r="60%">
        <stop offset="0%" stopColor="#f5d87a" />
        <stop offset="40%" stopColor="#d4a832" />
        <stop offset="100%" stopColor="#9a7520" />
      </radialGradient>
      <radialGradient id="sma-goldBarrel" cx="45%" cy="40%" r="55%">
        <stop offset="0%" stopColor="#e8c84a" />
        <stop offset="60%" stopColor="#c49628" />
        <stop offset="100%" stopColor="#8a6818" />
      </radialGradient>
      <radialGradient id="sma-goldPin" cx="40%" cy="35%" r="50%">
        <stop offset="0%" stopColor="#fff0b0" />
        <stop offset="50%" stopColor="#d4a832" />
        <stop offset="100%" stopColor="#9a7520" />
      </radialGradient>
      <linearGradient id="sma-thread" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#9a7520" />
        <stop offset="50%" stopColor="#d4a832" />
        <stop offset="100%" stopColor="#9a7520" />
      </linearGradient>
    </defs>

    {/* Blue outer ring */}
    <circle cx="60" cy="60" r="54" fill="#2a75d3" />
    {/* White inner */}
    <circle cx="60" cy="60" r="50" fill="#f8f9fa" />
            <g transform="translate(60,60) scale(1.15) translate(-60,-60)">

    {/* Hex coupling nut - smaller than N-Type */}
    <polygon
      points="60,22 92.7,40.9 92.7,79.1 60,98 27.3,79.1 27.3,40.9"
      fill="url(#sma-goldHex)"
      stroke="#8a6818"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />

    {/* Hex facet highlight */}
    <polygon
      points="60,26 89.5,43 89.5,77 60,94 30.5,77 30.5,43"
      fill="none"
      stroke="#e8c84a"
      strokeWidth="0.7"
      strokeLinejoin="round"
    />

    {/* Threaded barrel */}
    <circle cx="60" cy="60" r="24" fill="url(#sma-goldBarrel)" stroke="#8a6818" strokeWidth="1" />

    {/* Thread grooves */}
    <circle cx="60" cy="60" r="22" fill="none" stroke="url(#sma-thread)" strokeWidth="0.5" />
    <circle cx="60" cy="60" r="20.5" fill="none" stroke="url(#sma-thread)" strokeWidth="0.4" />
    <circle cx="60" cy="60" r="19" fill="none" stroke="url(#sma-thread)" strokeWidth="0.35" />

    {/* Inner cavity */}
    <circle cx="60" cy="60" r="16" fill="#222222" />
    <circle cx="60" cy="60" r="15.2" fill="#1a1a1a" stroke="#333333" strokeWidth="0.5" />

    {/* Dielectric ring */}
    <circle cx="60" cy="60" r="10" fill="#e8e4d8" stroke="#b5b0a0" strokeWidth="0.8" />

    {/* Tiny center pin */}
    <circle cx="60" cy="60" r="2.8" fill="url(#sma-goldPin)" stroke="#9a7520" strokeWidth="0.5" />
    {/* Pin highlight */}
    <circle cx="58.8" cy="58.8" r="1" fill="#ffffff" fillOpacity="0.5" />
  
            </g>
        </svg>
);

export default SMA;
