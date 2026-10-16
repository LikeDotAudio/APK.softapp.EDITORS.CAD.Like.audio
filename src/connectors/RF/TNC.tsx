// Copyright (c) 2026 oneDiversified.

import React from 'react';

const TNC: React.FC = () => (
  <svg viewBox="0 0 120 120" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="tnc-metalHex" cx="40%" cy="35%" r="60%">
        <stop offset="0%" stopColor="#e2e2e2" />
        <stop offset="45%" stopColor="#b5b5b5" />
        <stop offset="100%" stopColor="#7a7a7a" />
      </radialGradient>
      <radialGradient id="tnc-barrel" cx="45%" cy="40%" r="55%">
        <stop offset="0%" stopColor="#d0d0d0" />
        <stop offset="60%" stopColor="#a0a0a0" />
        <stop offset="100%" stopColor="#686868" />
      </radialGradient>
      <radialGradient id="tnc-pin" cx="40%" cy="35%" r="50%">
        <stop offset="0%" stopColor="#f0f0f0" />
        <stop offset="50%" stopColor="#c8c8c8" />
        <stop offset="100%" stopColor="#888888" />
      </radialGradient>
      <linearGradient id="tnc-thread" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#888888" />
        <stop offset="50%" stopColor="#c0c0c0" />
        <stop offset="100%" stopColor="#888888" />
      </linearGradient>
    </defs>

    {/* Blue outer ring */}
    <circle cx="60" cy="60" r="54" fill="#2a75d3" />
    {/* White inner */}
    <circle cx="60" cy="60" r="50" fill="#f8f9fa" />
            <g transform="translate(60,60) scale(1.1) translate(-60,-60)">

    {/* Hex coupling nut - threaded BNC variant */}
    <polygon
      points="60,18 95.6,38.5 95.6,81.5 60,102 24.4,81.5 24.4,38.5"
      fill="url(#tnc-metalHex)"
      stroke="#666666"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />

    {/* Hex facet inner highlight */}
    <polygon
      points="60,22 92,40.5 92,79.5 60,98 28,79.5 28,40.5"
      fill="none"
      stroke="#c5c5c5"
      strokeWidth="0.7"
      strokeLinejoin="round"
    />

    {/* Threaded barrel */}
    <circle cx="60" cy="60" r="28" fill="url(#tnc-barrel)" stroke="#707070" strokeWidth="1" />

    {/* Thread grooves - prominent threading */}
    <circle cx="60" cy="60" r="26.5" fill="none" stroke="url(#tnc-thread)" strokeWidth="0.7" />
    <circle cx="60" cy="60" r="25" fill="none" stroke="url(#tnc-thread)" strokeWidth="0.6" />
    <circle cx="60" cy="60" r="23.5" fill="none" stroke="url(#tnc-thread)" strokeWidth="0.5" />
    <circle cx="60" cy="60" r="22" fill="none" stroke="url(#tnc-thread)" strokeWidth="0.4" />

    {/* Inner cavity */}
    <circle cx="60" cy="60" r="18" fill="#222222" />
    <circle cx="60" cy="60" r="17" fill="#1a1a1a" stroke="#333333" strokeWidth="0.5" />

    {/* Dielectric insulator */}
    <circle cx="60" cy="60" r="11" fill="#e5e1d5" stroke="#b0ab9c" strokeWidth="0.8" />

    {/* Center pin */}
    <circle cx="60" cy="60" r="3.5" fill="url(#tnc-pin)" stroke="#888888" strokeWidth="0.6" />
    {/* Pin highlight */}
    <circle cx="58.5" cy="58.5" r="1.2" fill="#ffffff" fillOpacity="0.55" />
  
            </g>
        </svg>
);

export default TNC;
