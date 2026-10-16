// Copyright (c) 2026 oneDiversified / APK.audio
// MIT License.

import React, { useState, useRef, useCallback } from 'react';
import { ConnectorVisual } from './ConnectorVisual';
import { lookupConnector } from '../ConnectorLookup';

interface ConnectorItemProps {
  type: string;
  size?: number;
  showLabel?: boolean;
  labelFontSize?: string;
  selected?: boolean;
  onSelect?: (type: string) => void;
  onDragStart?: (e: React.DragEvent, type: string) => void;
}

const MAGNIFY_PX = 132;

const MagnifyPopup = ({ type, anchorRect }: { type: string; anchorRect: DOMRect }) => {
  const info = lookupConnector(type);
  const left = Math.max(
    8,
    Math.min(anchorRect.left + anchorRect.width / 2 - MAGNIFY_PX / 2, window.innerWidth - MAGNIFY_PX - 16),
  );
  const top = anchorRect.top - MAGNIFY_PX - 44;
  const above = top > 8;

  return (
    <div
      style={{
        position: 'fixed',
        left,
        top: above ? top : anchorRect.bottom + 8,
        zIndex: 99999,
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        animation: 'connMagnifyIn 0.15s ease-out',
      }}
    >
      <div
        style={{
          width: MAGNIFY_PX,
          height: MAGNIFY_PX,
          background: '#161922',
          border: '2px solid #F4902C',
          borderRadius: 8,
          boxShadow: '0 8px 30px rgba(0,0,0,0.9), 0 0 0 1px rgba(244, 144, 44, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        <div style={{ width: MAGNIFY_PX - 20, height: MAGNIFY_PX - 20 }}>
          <ConnectorVisual type={type} />
        </div>
      </div>
      <div
        style={{
          background: '#1c212e',
          border: '1px solid #333d4d',
          borderRadius: 4,
          padding: '4px 10px',
          maxWidth: MAGNIFY_PX + 60,
          textAlign: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.6)',
        }}
      >
        <div
          style={{
            fontSize: '12px',
            fontWeight: 'bold',
            color: '#F4902C',
            fontFamily: 'monospace',
            letterSpacing: '0.5px',
          }}
        >
          {type}
        </div>
        {info && (
          <div
            style={{
              fontSize: '10px',
              color: '#9aa0a6',
              marginTop: 2,
              lineHeight: 1.3,
            }}
          >
            {info.description}
          </div>
        )}
      </div>
    </div>
  );
};

export const ConnectorItem = React.memo(function ConnectorItem({
  type,
  size = 36,
  showLabel = true,
  labelFontSize = '8.5px',
  selected = false,
  onSelect,
  onDragStart,
}: ConnectorItemProps) {
  const [hovered, setHovered] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = useCallback(() => {
    hoverTimer.current = setTimeout(() => {
      setHovered(true);
    }, 200);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
    setHovered(false);
  }, []);

  const handleDrag = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/app-connector', type);
    e.dataTransfer.setData('text/plain', type);
    if (onDragStart) onDragStart(e, type);
  };

  const anchorRect = ref.current?.getBoundingClientRect();

  return (
    <>
      <div
        ref={ref}
        draggable
        onDragStart={handleDrag}
        onClick={() => onSelect && onSelect(type)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: size + 16,
          padding: '4px 2px',
          cursor: 'grab',
          borderRadius: 4,
          background: selected ? 'rgba(244, 144, 44, 0.18)' : 'transparent',
          border: selected ? '1px solid #F4902C' : '1px solid transparent',
          transition: 'background 0.15s, border-color 0.15s',
          userSelect: 'none',
        }}
        title={`${type}: ${lookupConnector(type)?.description || ''}`}
      >
        <div style={{ width: size, height: size, flexShrink: 0 }}>
          <ConnectorVisual type={type} />
        </div>
        {showLabel && (
          <span
            style={{
              fontSize: labelFontSize,
              fontFamily: 'monospace',
              color: selected ? '#F4902C' : '#9ca3af',
              marginTop: 3,
              maxWidth: size + 14,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              textAlign: 'center',
              lineHeight: 1,
            }}
          >
            {type}
          </span>
        )}
      </div>

      {hovered && anchorRect && <MagnifyPopup type={type} anchorRect={anchorRect} />}
    </>
  );
});

export default ConnectorItem;
