// Copyright (c) 2026 oneDiversified.

import React from 'react';

const Hirose: React.FC = () => (
  <svg viewBox="0 0 120 120" width="100%" height="100%">
    <defs>
      <radialGradient id="hir_bodyGrad" cx="45%" cy="40%" r="55%">
        <stop offset="0%" stopColor="#555" />
        <stop offset="60%" stopColor="#333" />
        <stop offset="100%" stopColor="#222" />
      </radialGradient>
      <radialGradient id="hir_shellGrad" cx="45%" cy="40%" r="55%">
        <stop offset="0%" stopColor="#bbb" />
        <stop offset="60%" stopColor="#999" />
        <stop offset="100%" stopColor="#777" />
      </radialGradient>
      <linearGradient id="hir_pinGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#e8c84a" />
        <stop offset="100%" stopColor="#c49b2a" />
      </linearGradient>
    </defs>
    {/* Blue outer ring */}
    <circle cx="60" cy="60" r="54" fill="#2a75d3" />
    {/* White inner */}
    <circle cx="60" cy="60" r="50" fill="#f8f9fa" />
            <g transform="translate(60,60) scale(1.2) translate(-60,-60)">
    {/* Thin metallic shell */}
    <circle cx="60" cy="60" r="40" fill="url(#hir_shellGrad)" stroke="#888" strokeWidth="1" />
    {/* Push-pull latch notches */}
    <rect x="18" y="56" width="6" height="8" rx="1" fill="#777" stroke="#666" strokeWidth="0.5" />
    <rect x="96" y="56" width="6" height="8" rx="1" fill="#777" stroke="#666" strokeWidth="0.5" />
    {/* Dark housing interior */}
    <circle cx="60" cy="60" r="34" fill="url(#hir_bodyGrad)" />
    {/* Fine pins in circular arrangement - 12 pins */}
    {/* Ring of pins at r=22 */}
    <circle cx="60" cy="38" r="2.2" fill="url(#hir_pinGrad)" stroke="#a08000" strokeWidth="0.4" />
    <circle cx="71" cy="40" r="2.2" fill="url(#hir_pinGrad)" stroke="#a08000" strokeWidth="0.4" />
    <circle cx="79" cy="49" r="2.2" fill="url(#hir_pinGrad)" stroke="#a08000" strokeWidth="0.4" />
    <circle cx="82" cy="60" r="2.2" fill="url(#hir_pinGrad)" stroke="#a08000" strokeWidth="0.4" />
    <circle cx="79" cy="71" r="2.2" fill="url(#hir_pinGrad)" stroke="#a08000" strokeWidth="0.4" />
    <circle cx="71" cy="80" r="2.2" fill="url(#hir_pinGrad)" stroke="#a08000" strokeWidth="0.4" />
    <circle cx="60" cy="82" r="2.2" fill="url(#hir_pinGrad)" stroke="#a08000" strokeWidth="0.4" />
    <circle cx="49" cy="80" r="2.2" fill="url(#hir_pinGrad)" stroke="#a08000" strokeWidth="0.4" />
    <circle cx="41" cy="71" r="2.2" fill="url(#hir_pinGrad)" stroke="#a08000" strokeWidth="0.4" />
    <circle cx="38" cy="60" r="2.2" fill="url(#hir_pinGrad)" stroke="#a08000" strokeWidth="0.4" />
    <circle cx="41" cy="49" r="2.2" fill="url(#hir_pinGrad)" stroke="#a08000" strokeWidth="0.4" />
    <circle cx="49" cy="40" r="2.2" fill="url(#hir_pinGrad)" stroke="#a08000" strokeWidth="0.4" />
    {/* Center alignment post */}
    <circle cx="60" cy="60" r="4" fill="#555" stroke="#666" strokeWidth="0.6" />
  
            </g>
        </svg>
);

export default Hirose;
