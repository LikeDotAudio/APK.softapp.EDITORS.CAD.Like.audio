// Copyright (c) 2026 oneDiversified.

import React from 'react';

const MiniDIN: React.FC = () => (
  <svg viewBox="0 0 120 120" width="100%" height="100%">
    <defs>
      <radialGradient id="mdin_bodyGrad" cx="45%" cy="40%" r="55%">
        <stop offset="0%" stopColor="#c0c0c0" />
        <stop offset="60%" stopColor="#999" />
        <stop offset="100%" stopColor="#777" />
      </radialGradient>
      <linearGradient id="mdin_pinGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#d4af37" />
        <stop offset="100%" stopColor="#b8960c" />
      </linearGradient>
    </defs>
    {/* Blue outer ring */}
    <circle cx="60" cy="60" r="54" fill="#2a75d3" />
    {/* White inner */}
    <circle cx="60" cy="60" r="50" fill="#f8f9fa" />
            <g transform="translate(60,60) scale(1.1) translate(-60,-60)">
    {/* Metallic outer ring */}
    <circle cx="60" cy="60" r="42" fill="url(#mdin_bodyGrad)" stroke="#888" strokeWidth="1.2" />
    {/* Dark insulator */}
    <circle cx="60" cy="60" r="32" fill="#2a2a2a" />
    {/* Alignment key notch at top - flat edge */}
    <rect x="48" y="26" width="24" height="8" rx="2" fill="#555" stroke="#666" strokeWidth="0.8" />
    {/* 6 pins in circular pattern (PS/2 style) */}
    {/* Top row - 2 pins */}
    <circle cx="50" cy="50" r="3" fill="url(#mdin_pinGrad)" stroke="#a08000" strokeWidth="0.5" />
    <circle cx="70" cy="50" r="3" fill="url(#mdin_pinGrad)" stroke="#a08000" strokeWidth="0.5" />
    {/* Middle row - 2 pins */}
    <circle cx="46" cy="64" r="3" fill="url(#mdin_pinGrad)" stroke="#a08000" strokeWidth="0.5" />
    <circle cx="74" cy="64" r="3" fill="url(#mdin_pinGrad)" stroke="#a08000" strokeWidth="0.5" />
    {/* Bottom row - 2 pins */}
    <circle cx="50" cy="78" r="3" fill="url(#mdin_pinGrad)" stroke="#a08000" strokeWidth="0.5" />
    <circle cx="70" cy="78" r="3" fill="url(#mdin_pinGrad)" stroke="#a08000" strokeWidth="0.5" />
    {/* Pin highlights */}
    <circle cx="49" cy="49" r="1.2" fill="#e8c84a" fillOpacity="0.5" />
    <circle cx="69" cy="49" r="1.2" fill="#e8c84a" fillOpacity="0.5" />
    <circle cx="45" cy="63" r="1.2" fill="#e8c84a" fillOpacity="0.5" />
    <circle cx="73" cy="63" r="1.2" fill="#e8c84a" fillOpacity="0.5" />
    <circle cx="49" cy="77" r="1.2" fill="#e8c84a" fillOpacity="0.5" />
    <circle cx="69" cy="77" r="1.2" fill="#e8c84a" fillOpacity="0.5" />
  
            </g>
        </svg>
);

export default MiniDIN;
