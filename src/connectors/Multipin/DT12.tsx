// Copyright (c) 2026 oneDiversified.

import React from 'react';

const DT12: React.FC = () => {
  // Generate pins in concentric rings for a 37-pin layout
  const pins: Array<{ cx: number; cy: number }> = [];

  // Center pin
  pins.push({ cx: 60, cy: 60 });

  // Inner ring - 6 pins at r=10
  for (let i = 0; i < 6; i++) {
    const angle = (i * 60 - 90) * (Math.PI / 180);
    pins.push({ cx: 60 + 10 * Math.cos(angle), cy: 60 + 10 * Math.sin(angle) });
  }

  // Middle ring - 12 pins at r=20
  for (let i = 0; i < 12; i++) {
    const angle = (i * 30 - 90) * (Math.PI / 180);
    pins.push({ cx: 60 + 20 * Math.cos(angle), cy: 60 + 20 * Math.sin(angle) });
  }

  // Outer ring - 18 pins at r=30
  for (let i = 0; i < 18; i++) {
    const angle = (i * 20 - 90) * (Math.PI / 180);
    pins.push({ cx: 60 + 30 * Math.cos(angle), cy: 60 + 30 * Math.sin(angle) });
  }

  return (
    <svg viewBox="0 0 120 120" width="100%" height="100%">
      <defs>
        <radialGradient id="dt12_bodyGrad" cx="45%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#c8c8c8" />
          <stop offset="60%" stopColor="#a0a0a0" />
          <stop offset="100%" stopColor="#787878" />
        </radialGradient>
        <linearGradient id="dt12_pinGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e8c84a" />
          <stop offset="100%" stopColor="#c49b2a" />
        </linearGradient>
      </defs>
      {/* Blue outer ring */}
      <circle cx="60" cy="60" r="54" fill="#2a75d3" />
      {/* White inner */}
      <circle cx="60" cy="60" r="50" fill="#f8f9fa" />
            <g transform="translate(60,60) scale(1.1) translate(-60,-60)">
      {/* Metallic shell */}
      <circle cx="60" cy="60" r="46" fill="url(#dt12_bodyGrad)" stroke="#888" strokeWidth="1.2" />
      {/* Bayonet mount ring */}
      <circle cx="60" cy="60" r="43" fill="none" stroke="#999" strokeWidth="1.5" />
      {/* Bayonet slot 1 */}
      <path d="M 84 34 A 42 42 0 0 0 78 28 L 73 34 A 36 36 0 0 1 78 39 Z" fill="#666" stroke="#555" strokeWidth="0.4" />
      {/* Bayonet slot 2 */}
      <path d="M 36 86 A 42 42 0 0 0 42 92 L 47 86 A 36 36 0 0 1 42 81 Z" fill="#666" stroke="#555" strokeWidth="0.4" />
      {/* Inner cavity */}
      <circle cx="60" cy="60" r="38" fill="#2a2a2a" />
      {/* Alignment keyway at top */}
      <rect x="55" y="20" width="10" height="8" rx="1.5" fill="#555" stroke="#666" strokeWidth="0.6" />
      {/* All 37 pins */}
      {pins.map((p, i) => (
        <circle key={i} cx={p.cx} cy={p.cy} r="2.2" fill="url(#dt12_pinGrad)" stroke="#a08000" strokeWidth="0.4" />
      ))}
    
            </g>
        </svg>
  );
};

export default DT12;
