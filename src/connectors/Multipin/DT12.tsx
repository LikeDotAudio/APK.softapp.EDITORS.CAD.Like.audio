// Copyright (c) 2026 APK.audio.
//
// Changelog:
//   2026-11-04 - ROAD-3492: the made-up 37-pin concentric ring is gone. The face
//                is drawn from dt12Pinout.ts: seven staggered rows, each pair's
//                hot/cold/drain joined as a triangle and colour-coded.

import React from 'react';
import { DT12_PAIRS, DT12_PIN_COUNT, DT12_ROLE_COLORS, dt12PinPoint, dt12RoleOf } from './dt12Pinout';

/** Diagram pitch in viewBox units — the source gives arrangement, not spacing. */
const PITCH = 10;
const C = 60;

const DT12: React.FC = () => {
  const at = (pin: number) => {
    const p = dt12PinPoint('male', pin, PITCH)!;
    return { x: C + p.x, y: C - p.y };
  };
  const pins = Array.from({ length: DT12_PIN_COUNT }, (_, i) => i + 1);

  return (
    <svg viewBox="0 0 120 120" width="100%" height="100%">
      {/* Blue outer ring */}
      <circle cx={C} cy={C} r="54" fill="#2a75d3" />
      {/* White inner */}
      <circle cx={C} cy={C} r="50" fill="#f8f9fa" />
      {/* Shell and insert */}
      <circle cx={C} cy={C} r="46" fill="#a0a0a0" stroke="#888" strokeWidth="1.2" />
      <circle cx={C} cy={C} r="41" fill="#2a2a2a" />
      {/* The twelve hot/cold/drain triangles */}
      {DT12_PAIRS.map((p) => {
        const pts = [p.hot, p.cold, p.drain].map(at).map((q) => `${q.x},${q.y}`).join(' ');
        return <polygon key={p.pair} points={pts} fill="none" stroke="#c8c8c8" strokeWidth="0.8" />;
      })}
      {pins.map((pin) => {
        const q = at(pin);
        return (
          <circle key={pin} cx={q.x} cy={q.y} r="2.8" fill={DT12_ROLE_COLORS[dt12RoleOf(pin).role]} stroke="#111" strokeWidth="0.4" />
        );
      })}
    </svg>
  );
};

export default DT12;
