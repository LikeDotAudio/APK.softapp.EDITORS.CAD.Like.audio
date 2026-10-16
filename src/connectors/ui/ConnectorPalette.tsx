// Copyright (c) 2026 oneDiversified / APK.audio
// MIT License.

import { useState, useMemo } from 'react';
import { ConnectorItem } from './ConnectorItem';
import { CONNECTOR_FAMILIES_FULL } from '../ConnectorLookup';
import { CONNECTOR_SUPER_CATEGORIES, type ConnectorGroupSpec } from './connectorGroups';
import { searchConnectorTypes } from './searchConnectorTypes';

interface ConnectorPaletteProps {
  groups?: readonly ConnectorGroupSpec[];
  onSelectConnector?: (type: string) => void;
  selectedConnector?: string;
  onClose?: () => void;
}

const MAGNIFY_KEYFRAMES = `@keyframes connMagnifyIn { from { transform: scale(0.7); opacity: 0; } to { transform: scale(1); opacity: 1; } }`;

export function ConnectorPalette({
  groups = CONNECTOR_SUPER_CATEGORIES,
  onSelectConnector,
  selectedConnector,
  onClose,
}: ConnectorPaletteProps) {
  const [activeTab, setActiveTab] = useState<string>(groups[0]?.label || 'Audio');
  const [filter, setFilter] = useState('');
  const [currentSize, setCurrentSize] = useState<number>(36);

  const allTypes = useMemo(() => {
    return Object.values(CONNECTOR_FAMILIES_FULL).flat();
  }, []);

  const isSearching = filter.trim().length > 0;
  const searchResults = useMemo(() => searchConnectorTypes(filter, allTypes), [filter, allTypes]);

  const activeGroup = groups.find((g) => g.label === activeTab);
  const displaySections: { name: string; types: string[] }[] = isSearching
    ? [{ name: '', types: searchResults }]
    : activeGroup
    ? activeGroup.families
        .map((f) => ({ name: f, types: CONNECTOR_FAMILIES_FULL[f] ?? [] }))
        .filter((sec) => sec.types.length > 0)
    : [];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        background: '#0e121b',
        color: '#cccccc',
        fontFamily: 'sans-serif',
        userSelect: 'none',
        overflow: 'hidden',
      }}
    >
      <style>{MAGNIFY_KEYFRAMES}</style>

      {/* Header bar: Title, Search, Category Tabs, Zoom controls, Hint & Close */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #1f2937',
          background: '#090d16',
          padding: '4px 10px',
          gap: 8,
          flexShrink: 0,
          overflowX: 'auto',
        }}
      >
        {/* Left: Title + Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff', letterSpacing: '0.5px' }}>
            Connectors
          </span>

          <div style={{ position: 'relative', width: 140 }}>
            <input
              type="text"
              placeholder="Search connectors..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '3px 6px 3px 22px',
                fontSize: '11px',
                background: '#151b28',
                border: `1px solid ${isSearching ? '#F4902C' : '#2d3748'}`,
                borderRadius: 4,
                color: '#fff',
                outline: 'none',
              }}
            />
            <span
              style={{
                position: 'absolute',
                left: 6,
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '10px',
                color: '#6b7280',
                pointerEvents: 'none',
              }}
            >
              🔍
            </span>
            {filter && (
              <button
                onClick={() => setFilter('')}
                style={{
                  position: 'absolute',
                  right: 4,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#9ca3af',
                  cursor: 'pointer',
                  fontSize: '10px',
                }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Center: Category Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, overflowX: 'auto', flex: 1 }}>
          {groups.map((group) => {
            const isActive = !isSearching && group.label === activeTab;
            return (
              <button
                key={group.label}
                onClick={() => {
                  setFilter('');
                  setActiveTab(group.label);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  background: isActive ? 'rgba(244, 144, 44, 0.15)' : 'transparent',
                  border: 'none',
                  borderBottom: isActive ? '2px solid #F4902C' : '2px solid transparent',
                  color: isActive ? '#F4902C' : '#9ca3af',
                  fontSize: '11px',
                  fontWeight: isActive ? 600 : 400,
                  padding: '3px 8px',
                  cursor: 'pointer',
                  borderRadius: '4px 4px 0 0',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s',
                }}
              >
                <span>{group.icon}</span>
                <span>{group.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right: Size Zoom, Hint, and Close */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }} title="Icon size for visual clarity">
            <span style={{ fontSize: '9px', color: '#6b7280' }}>SIZE:</span>
            {[
              { label: 'S', size: 28 },
              { label: 'M', size: 36 },
              { label: 'L', size: 48 },
              { label: 'XL', size: 56 },
            ].map((s) => (
              <button
                key={s.label}
                onClick={() => setCurrentSize(s.size)}
                style={{
                  background: currentSize === s.size ? 'rgba(244, 144, 44, 0.3)' : 'transparent',
                  border: `1px solid ${currentSize === s.size ? '#F4902C' : '#374151'}`,
                  borderRadius: 3,
                  padding: '1px 4px',
                  fontSize: '9px',
                  color: currentSize === s.size ? '#F4902C' : '#9ca3af',
                  cursor: 'pointer',
                  fontWeight: currentSize === s.size ? 'bold' : 'normal',
                }}
              >
                {s.label}
              </button>
            ))}
          </div>

          <span style={{ fontSize: '10px', color: '#6b7280' }}>
            Drag connectors onto canvas or ports
          </span>

          {onClose && (
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#9ca3af',
                cursor: 'pointer',
                fontSize: '14px',
                padding: '2px 4px',
              }}
              title="Close Connectors Dock"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Grid Content Area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'auto',
          padding: '6px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        {displaySections.map((section) => (
          <div
            key={section.name || 'flat'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              minHeight: currentSize + 18,
              borderBottom: '1px solid rgba(255,255,255,0.04)',
              paddingBottom: 4,
            }}
          >
            {/* Sub-family label on the left (matches OneScope's style) */}
            {section.name && (
              <div
                style={{
                  width: 90,
                  minWidth: 90,
                  fontSize: '9px',
                  fontFamily: 'monospace',
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  lineHeight: 1.1,
                  textAlign: 'right',
                  paddingRight: 6,
                  borderRight: '1px solid #1f2937',
                  flexShrink: 0,
                }}
              >
                {section.name}
              </div>
            )}

            {/* Row of connectors */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
              {section.types.map((type) => (
                <ConnectorItem
                  key={type}
                  type={type}
                  size={currentSize}
                  selected={selectedConnector === type}
                  onSelect={onSelectConnector}
                />
              ))}
            </div>
          </div>
        ))}

        {isSearching && searchResults.length === 0 && (
          <div style={{ padding: '20px 0', textAlign: 'center', color: '#6b7280', fontSize: '11px' }}>
            No connectors match &ldquo;{filter.trim()}&rdquo;
          </div>
        )}
      </div>
    </div>
  );
}

export default ConnectorPalette;
