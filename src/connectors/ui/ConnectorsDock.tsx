// Copyright (c) 2026 oneDiversified / APK.audio
// MIT License.

import React, { useState, useCallback, useRef } from 'react';
import { ConnectorPalette } from './ConnectorPalette';
import { useStore } from '../../state/useStore';

interface ConnectorsDockProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ConnectorsDock({ isOpen, onClose }: ConnectorsDockProps) {
  const store = useStore();
  const [height, setHeight] = useState(190);
  const isDragging = useRef(false);
  const startY = useRef(0);
  const startH = useRef(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    startY.current = e.clientY;
    startH.current = height;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDragging.current) return;
      const dy = startY.current - moveEvent.clientY;
      const nextH = Math.max(90, Math.min(window.innerHeight * 0.6, startH.current + dy));
      setHeight(nextH);
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [height]);

  if (!isOpen) return null;

  const handleSelectConnector = (type: string) => {
    // When a connector is selected in the dock, check if a matching block definition exists
    // or select the Flow tool and inform the user
    store.setTool('flow');
    store.showHint(`Selected connector: ${type}. Click to place or connect.`);
  };

  return (
    <div
      style={{
        width: '100%',
        height,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        zIndex: 25,
        borderTop: '2px solid #3b3b3b',
        boxShadow: '0 -4px 16px rgba(0,0,0,0.5)',
        flexShrink: 0,
      }}
    >
      {/* Resizable Sash on top edge */}
      <div
        onMouseDown={handleMouseDown}
        style={{
          width: '100%',
          height: 5,
          cursor: 'ns-resize',
          position: 'absolute',
          top: -2,
          left: 0,
          zIndex: 30,
          background: 'transparent',
        }}
        title="Drag to resize Connectors dock"
      />

      <ConnectorPalette
        onSelectConnector={handleSelectConnector}
        onClose={onClose}
      />
    </div>
  );
}

export default ConnectorsDock;
