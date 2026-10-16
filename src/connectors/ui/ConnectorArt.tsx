// Copyright (c) 2026 oneDiversified / APK.audio
// MIT License.

import React from 'react';
import { ICONS, GenericIcon } from '../index';
import { AES72_ALL_SPELLINGS } from '../aes72';
import FC from '../FiberOptic/FC';
import SC from '../FiberOptic/SC';
import ST from '../FiberOptic/ST';
import LC from '../FiberOptic/LC';

const iconFor = (abbrev: string): React.FC | undefined => ICONS[abbrev];

// Fiber core colour cycle (red→white). Each FC/SC/ST variant gets a stable colour.
const FIBER_CORE_COLORS = ['#ff3b30', '#ff9500', '#ffd60a', '#34c759', '#0a84ff', '#5e5ce6', '#9aa0a6', '#ffffff'];
const fiberCoreColor = (type: string): string => {
  let h = 0;
  for (let i = 0; i < type.length; i++) h = (h * 31 + type.charCodeAt(i)) >>> 0;
  return FIBER_CORE_COLORS[h % FIBER_CORE_COLORS.length];
};

/** Connector types that use a rectangular (non-circular) icon shape */
const RECTANGULAR_TYPES = new Set([
  'SFP', 'SFP+', 'SFP28', 'SFP56',
  'QSFP+', 'QSFP28', 'QSFP56', 'QSFP-DD',
  '4P4C', '6P2C', '6P4C', '6P6C',
  '8P8C', '10P10C', 'RJ45', 'S8P8C', 'SRJ45',
  ...AES72_ALL_SPELLINGS,
  'E3P', 'E3S', 'E3PP', 'E3SS', 'ELCO3', 'EDAC3',
]);

const SQUARE_FACE_TYPES = new Set([
  'A59P', 'A59S',
  'AMP50P', 'AMP50S',
  'E8P', 'E8S', 'E12P', 'E12S', 'E16P', 'E16S', 'E26P', 'E26S', 'E32P', 'E32S',
  'MS###', 'TB##P',
]);

const KEYSTONE_BASE: Record<string, string> = {
  'KEY-HDMI': 'HDMI',
  'KEY-Cat6': 'RJ45',
  'KEY-Cat6A': 'RJ45',
  'KEY-LC fiber': 'LC',
  'KEY-SC fiber': 'SC',
  'KEY-BNC': 'BNC',
  'KEY-3.5mm': 'TRS',
  'KEY-Coaxial': 'F',
  'KEY-Banana': 'BAN1',
  'KEY-RCA': 'RCA',
};

const circleStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#111',
  border: '1px solid #444',
  borderRadius: '50%',
  position: 'relative',
  boxShadow: 'inset 0 0 5px #000',
  overflow: 'hidden',
};

const rectStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#111',
  border: '1px solid #444',
  borderRadius: '6px',
  position: 'relative',
  boxShadow: 'inset 0 0 5px #000',
  overflow: 'hidden',
};

export const ConnectorArt = ({ type }: { type: string }) => {
  if (type === 'BLANK') {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: 'linear-gradient(180deg, #3a3a3a, #222)',
          border: '1px solid #555',
          borderRadius: '6px',
          boxShadow: 'inset 0 0 4px #000',
        }}
      />
    );
  }

  if (type.startsWith('KEY-')) {
    const base = KEYSTONE_BASE[type] || type.replace(/^KEY-/, '');
    const BaseIcon = ICONS[base];
    const Fiber = [FC, SC, ST, LC].includes(BaseIcon as any) ? (BaseIcon as React.FC<{ bare?: boolean }>) : null;
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          boxSizing: 'border-box',
          background: 'linear-gradient(180deg, #fafbfc, #e7e9ec)',
          border: '1px solid #b8bdc4',
          borderRadius: '8px',
          boxShadow: 'inset 0 0 0 1px #fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '12%',
        }}
      >
        <div style={{ width: '100%', height: '100%' }}>
          {Fiber ? <Fiber bare /> : BaseIcon ? <BaseIcon /> : <GenericIcon type={base} />}
        </div>
      </div>
    );
  }

  const Icon = iconFor(type);

  if (Icon === FC || Icon === SC || Icon === ST) {
    const FiberComp = Icon as React.FC<{ coreColor?: string }>;
    return (
      <div style={circleStyle}>
        <FiberComp coreColor={fiberCoreColor(type)} />
      </div>
    );
  }

  const squareFace = SQUARE_FACE_TYPES.has(type);
  const isRect = RECTANGULAR_TYPES.has(type) || squareFace || type.startsWith('MGMT-');
  const IconWithSquare = Icon as React.FC<{ square?: boolean }>;
  return (
    <div style={isRect ? rectStyle : circleStyle}>
      {Icon ? <IconWithSquare square={squareFace} /> : <GenericIcon type={type} />}
    </div>
  );
};

export default ConnectorArt;
