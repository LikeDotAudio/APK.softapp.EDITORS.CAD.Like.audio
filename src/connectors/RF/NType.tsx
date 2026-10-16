// Copyright (c) 2026 oneDiversified.

import React from 'react';

const NType: React.FC = () => (
  <svg viewBox="0 0 120 120" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="ntype-metalBg" cx="40%" cy="35%" r="60%">
        <stop offset="0%" stopColor="#e0e0e0" />
        <stop offset="50%" stopColor="#b8b8b8" />
        <stop offset="100%" stopColor="#787878" />
      </radialGradient>
      <radialGradient id="ntype-hexFace" cx="42%" cy="38%" r="58%">
        <stop offset="0%" stopColor="#d5d5d5" />
        <stop offset="40%" stopColor="#b0b0b0" />
        <stop offset="100%" stopColor="#808080" />
      </radialGradient>
      <radialGradient id="ntype-barrel" cx="45%" cy="40%" r="55%">
        <stop offset="0%" stopColor="#cccccc" />
        <stop offset="60%" stopColor="#999999" />
        <stop offset="100%" stopColor="#666666" />
      </radialGradient>
      <radialGradient id="ntype-pin" cx="40%" cy="35%" r="50%">
        <stop offset="0%" stopColor="#f0f0f0" />
        <stop offset="50%" stopColor="#c8c8c8" />
        <stop offset="100%" stopColor="#888888" />
      </radialGradient>
      <linearGradient id="ntype-knurl" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#909090" />
        <stop offset="50%" stopColor="#c0c0c0" />
        <stop offset="100%" stopColor="#909090" />
      </linearGradient>
    </defs>

    {/* Blue outer ring */}
    <circle cx="60" cy="60" r="54" fill="#2a75d3" />
    {/* White inner */}
    <circle cx="60" cy="60" r="50" fill="#f8f9fa" />
            <g transform="translate(60,60) scale(1.1) translate(-60,-60)">

    {/* Prominent hex coupling nut - large and beefy */}
    <polygon
      points="60,14 99.8,37 99.8,83 60,106 20.2,83 20.2,37"
      fill="url(#ntype-hexFace)"
      stroke="#666666"
      strokeWidth="2"
      strokeLinejoin="round"
    />

    {/* Hex nut facet highlights */}
    <polygon
      points="60,18 96,39 96,81 60,102 24,81 24,39"
      fill="none"
      stroke="#c8c8c8"
      strokeWidth="0.8"
      strokeLinejoin="round"
    />

    {/* Knurling marks on hex faces */}
    <line x1="40" y1="18" x2="33" y2="28" stroke="#a0a0a0" strokeWidth="0.4" strokeLinecap="round" />
    <line x1="80" y1="18" x2="87" y2="28" stroke="#a0a0a0" strokeWidth="0.4" strokeLinecap="round" />
    <line x1="20" y1="60" x2="24" y2="60" stroke="#a0a0a0" strokeWidth="0.4" strokeLinecap="round" />
    <line x1="96" y1="60" x2="100" y2="60" stroke="#a0a0a0" strokeWidth="0.4" strokeLinecap="round" />

    {/* Outer barrel ring */}
    <circle cx="60" cy="60" r="32" fill="url(#ntype-barrel)" stroke="#707070" strokeWidth="1.2" />

    {/* Thread detail rings */}
    <circle cx="60" cy="60" r="30" fill="none" stroke="url(#ntype-knurl)" strokeWidth="0.6" />
    <circle cx="60" cy="60" r="28" fill="none" stroke="url(#ntype-knurl)" strokeWidth="0.5" />
    <circle cx="60" cy="60" r="26" fill="none" stroke="url(#ntype-knurl)" strokeWidth="0.4" />

    {/* Inner cavity */}
    <circle cx="60" cy="60" r="22" fill="#222222" />
    <circle cx="60" cy="60" r="21" fill="#1a1a1a" stroke="#333333" strokeWidth="0.5" />

    {/* Dielectric insulator */}
    <circle cx="60" cy="60" r="14" fill="#e8e4d8" stroke="#b5b0a0" strokeWidth="1" />

    {/* Inner dielectric detail ring */}
    <circle cx="60" cy="60" r="10" fill="#d8d4c8" stroke="#a8a498" strokeWidth="0.5" />

    {/* Center pin - larger than F-Type */}
    <circle cx="60" cy="60" r="5" fill="url(#ntype-pin)" stroke="#888888" strokeWidth="0.8" />
    {/* Pin highlight */}
    <circle cx="58" cy="58" r="1.8" fill="#ffffff" fillOpacity="0.55" />
  
            </g>
        </svg>
);

export default NType;
