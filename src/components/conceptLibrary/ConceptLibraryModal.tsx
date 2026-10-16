// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.

import { useState, useMemo } from 'react';
import { CONNECTOR_GROUPS } from '../../connectors/ConnectorLookup';
import { ICONS, GenericIcon } from '../../connectors/index';
import { evaluatePortCompatibility, getEssenceCategory } from '../../connectors/adapterRules';
import { CATALOG } from '../../flow/catalog';
import { useStore } from '../../state/useStore';
import type { BlockDefinition } from '../../core/types';

interface ConceptLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBlock?: (definitionId: string) => void;
}

type TabCategory =
  | 'ALL'
  | 'DATAFLOW_LOGIC'
  | 'IP_MEDIA'
  | 'CODECS_CONTAINERS'
  | 'MEDIA_IMAGES'
  | 'PHYSICAL'
  | 'SCHEMATIC_BLOCKS';

export function ConceptLibraryModal({ isOpen, onClose, onSelectBlock }: ConceptLibraryModalProps) {
  const store = useStore();
  const [activeTab, setActiveTab] = useState<TabCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<{
    abbreviation: string;
    description: string;
    group: string;
    isBlock?: boolean;
    blockDef?: BlockDefinition;
  } | null>(null);

  // Suggestions tester state
  const [sourceConnector, setSourceConnector] = useState('ST2110-20');
  const [targetConnector, setTargetConnector] = useState('ST2110-30');

  const compatibilityReport = useMemo(() => {
    return evaluatePortCompatibility(sourceConnector, targetConnector);
  }, [sourceConnector, targetConnector]);

  // Aggregate all connectors flat
  const allConnectors = useMemo(() => {
    return CONNECTOR_GROUPS.flatMap((g) =>
      g.connectors.map((c) => ({
        ...c,
        group: g.name,
      }))
    );
  }, []);

  // Filtered items based on activeTab and searchQuery
  const filteredItems = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return allConnectors.filter((item) => {
      // Tab matching
      if (activeTab === 'DATAFLOW_LOGIC') {
        if (!['Idea', 'Result', 'Logic', 'Arithmetic'].includes(item.group)) return false;
      } else if (activeTab === 'IP_MEDIA') {
        if (
          ![
            'ST-2110',
            'NMOS',
            'Audio-Networked',
            'SMPTE-Audio',
            'MXL',
            'IP-Streaming',
            'AV-over-IP',
            'VoIP',
          ].includes(item.group)
        )
          return false;
      } else if (activeTab === 'CODECS_CONTAINERS') {
        if (!['Codecs-Audio', 'Codecs-Video', 'Codecs-Container'].includes(item.group)) return false;
      } else if (activeTab === 'MEDIA_IMAGES') {
        if (!['Media-Images', 'Media-3D-Doc'].includes(item.group)) return false;
      } else if (activeTab === 'PHYSICAL') {
        if (
          [
            'Idea',
            'Result',
            'Logic',
            'Arithmetic',
            'ST-2110',
            'NMOS',
            'Audio-Networked',
            'SMPTE-Audio',
            'MXL',
            'IP-Streaming',
            'AV-over-IP',
            'VoIP',
            'Codecs-Audio',
            'Codecs-Video',
            'Codecs-Container',
            'Media-Images',
            'Media-3D-Doc',
          ].includes(item.group)
        )
          return false;
      }

      if (!q) return true;
      return (
        item.abbreviation.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.group.toLowerCase().includes(q)
      );
    });
  }, [allConnectors, activeTab, searchQuery]);

  const schematicBlocks = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (activeTab !== 'ALL' && activeTab !== 'SCHEMATIC_BLOCKS' && activeTab !== 'DATAFLOW_LOGIC') {
      return [];
    }
    return CATALOG.filter((b) => {
      if (!q) return true;
      return (
        b.name.toLowerCase().includes(q) ||
        (b.description && b.description.toLowerCase().includes(q)) ||
        b.ports.some((p) => p.id.toLowerCase().includes(q))
      );
    });
  }, [activeTab, searchQuery]);

  if (!isOpen) return null;

  const handlePlaceBlock = (defId: string) => {
    store.setFlowDefinition(defId);
    store.setTool('flow');
    if (onSelectBlock) onSelectBlock(defId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="flex h-[90vh] w-[95vw] max-w-[1300px] flex-col rounded-lg border border-[#3e3e42] bg-[#1e1e1e] shadow-2xl text-[#cccccc] font-sans">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#333] px-6 py-3 bg-[#252526] rounded-t-lg">
          <div className="flex items-center gap-3">
            <span className="text-xl">📚</span>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                Universal Part & Concept Library
              </h2>
              <p className="text-[11px] text-[#858585]">
                Complete standard schematic connectors, dataflow adapters, codecs, ST 2110 essences & physical jacks
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-[#858585] hover:bg-[#333] hover:text-white transition-colors"
            title="Close Library (Esc)"
          >
            ✕
          </button>
        </div>

        {/* Filter Bar & Tabs */}
        <div className="flex flex-wrap items-center justify-between border-b border-[#333] px-6 py-2.5 bg-[#202021] gap-3">
          <div className="flex flex-wrap items-center gap-1">
            {[
              { id: 'ALL', label: 'All Items' },
              { id: 'DATAFLOW_LOGIC', label: '🧠 Logic & Math' },
              { id: 'IP_MEDIA', label: '🌐 ST 2110 & IP' },
              { id: 'CODECS_CONTAINERS', label: '🎬 Codecs & Containers' },
              { id: 'MEDIA_IMAGES', label: '🖼 Media & Images' },
              { id: 'SCHEMATIC_BLOCKS', label: '⚙️ Schematic Blocks' },
              { id: 'PHYSICAL', label: '🔌 Physical Connectors' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabCategory)}
                className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-[#007acc] text-white shadow-sm'
                    : 'bg-[#2d2d30] text-[#aaa] hover:bg-[#38383c] hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-72">
            <input
              type="text"
              placeholder="Search connectors, codecs, blocks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded border border-[#3e3e42] bg-[#141414] px-3 py-1 text-xs text-white placeholder-[#666] focus:border-[#007acc] focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1 text-xs text-[#888] hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Content Area: Grid + Details Side Panel */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Main Tiles Grid */}
          <div className="flex-1 overflow-y-auto p-6 bg-[#181818]">
            {/* Schematic Blocks section if applicable */}
            {schematicBlocks.length > 0 && (
              <div className="mb-6">
                <div className="mb-3 flex items-center justify-between border-b border-[#333] pb-1">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[#4ec9b0]">
                    Schematic & In-line Adapter Blocks ({schematicBlocks.length})
                  </h3>
                  <span className="text-[10px] text-[#777]">Drop into CAD canvas</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {schematicBlocks.map((b) => (
                    <div
                      key={b.id}
                      onClick={() =>
                        setSelectedItem({
                          abbreviation: b.name,
                          description: b.description || b.name,
                          group: 'Schematic Block',
                          isBlock: true,
                          blockDef: b,
                        })
                      }
                      className={`group relative flex flex-col items-center justify-between rounded-lg border p-3 cursor-pointer transition-all ${
                        selectedItem?.abbreviation === b.name
                          ? 'border-[#007acc] bg-[#223548] ring-1 ring-[#007acc]'
                          : 'border-[#333] bg-[#222225] hover:border-[#555] hover:bg-[#28282c]'
                      }`}
                    >
                      <div className="flex h-14 w-full items-center justify-center font-mono text-sm font-bold text-[#81c995]">
                        {b.name.startsWith('MATH') ? (
                          <span className="text-2xl text-[#3a86ff]">±×</span>
                        ) : b.name.startsWith('LOGIC') ? (
                          <span className="text-lg text-[#c58af9]">GATE</span>
                        ) : b.name.startsWith('ADAPTER') ? (
                          <span className="text-xl text-[#f4a261]">⇋</span>
                        ) : (
                          <span className="text-sm text-[#ddd]">{b.name}</span>
                        )}
                      </div>
                      <div className="w-full text-center">
                        <div className="truncate text-xs font-semibold text-white group-hover:text-[#4ec9b0]">
                          {b.name}
                        </div>
                        <div className="mt-0.5 text-[10px] text-[#888]">
                          {b.ports.length} port{b.ports.length === 1 ? '' : 's'}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlaceBlock(b.id);
                        }}
                        className="mt-2 w-full rounded bg-[#0e639c] py-0.5 text-[10px] font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#1177bb]"
                      >
                        Place on Canvas
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Connectors & SVG Badges Section */}
            <div>
              <div className="mb-3 flex items-center justify-between border-b border-[#333] pb-1">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#9cdcfe]">
                  Connectors, Codecs & IP Essence Badges ({filteredItems.length})
                </h3>
                <span className="text-[10px] text-[#777]">SVG circular badges & physical specs</span>
              </div>

              {filteredItems.length === 0 ? (
                <div className="flex h-48 flex-col items-center justify-center text-[#666]">
                  <span className="text-3xl">🔍</span>
                  <p className="mt-2 text-xs">No matching connectors or formats found for &ldquo;{searchQuery}&rdquo;</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                  {filteredItems.map((item) => {
                    const IconComponent = ICONS[item.abbreviation] || GenericIcon;
                    const isSelected = selectedItem?.abbreviation === item.abbreviation;
                    return (
                      <div
                        key={item.abbreviation}
                        onClick={() =>
                          setSelectedItem({
                            abbreviation: item.abbreviation,
                            description: item.description,
                            group: item.group,
                          })
                        }
                        className={`group relative flex flex-col items-center justify-between rounded-lg border p-2.5 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-[#007acc] bg-[#223548] ring-1 ring-[#007acc]'
                            : 'border-[#2d2d30] bg-[#212124] hover:border-[#444] hover:bg-[#27272b]'
                        }`}
                      >
                        {/* Render live SVG icon/badge */}
                        <div className="flex h-14 w-14 items-center justify-center p-1">
                          <IconComponent />
                        </div>
                        <div className="mt-2 w-full text-center">
                          <div className="truncate text-xs font-mono font-bold text-white group-hover:text-[#4ec9b0]">
                            {item.abbreviation}
                          </div>
                          <div className="truncate text-[9px] text-[#888]">{item.group}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Details & In-line Suggestions Right Panel */}
          <div className="w-80 border-l border-[#333] bg-[#1f1f22] p-4 flex flex-col justify-between overflow-y-auto">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#9cdcfe] mb-3">
                Specification & In-line Adapter Advice
              </h3>

              {selectedItem ? (
                <div className="space-y-4">
                  <div className="rounded border border-[#333] bg-[#18181b] p-3">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 flex-shrink-0">
                        {selectedItem.isBlock ? (
                          <div className="flex h-full w-full items-center justify-center rounded border border-[#4ec9b0] text-sm font-bold text-[#4ec9b0]">
                            BLK
                          </div>
                        ) : (
                          (() => {
                            const Icon = ICONS[selectedItem.abbreviation] || GenericIcon;
                            return <Icon />;
                          })()
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-mono font-bold text-white truncate">
                          {selectedItem.abbreviation}
                        </div>
                        <div className="text-[10px] text-[#81c995] uppercase font-semibold">
                          {selectedItem.group}
                        </div>
                      </div>
                    </div>
                    <p className="mt-3 text-xs leading-relaxed text-[#ccc]">
                      {selectedItem.description}
                    </p>

                    {selectedItem.isBlock && selectedItem.blockDef && (
                      <div className="mt-3 border-t border-[#2d2d30] pt-2">
                        <div className="text-[10px] uppercase font-bold text-[#777] mb-1">
                          Port Terminals ({selectedItem.blockDef.ports.length}):
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {selectedItem.blockDef.ports.map((p) => (
                            <span
                              key={p.id}
                              className="rounded bg-[#2a2d2e] px-1.5 py-0.5 font-mono text-[10px] text-[#ddd]"
                            >
                              {p.label || p.id} ({p.side})
                            </span>
                          ))}
                        </div>
                        <button
                          onClick={() => handlePlaceBlock(selectedItem.blockDef!.id)}
                          className="mt-3 w-full rounded bg-[#2ea043] py-1 text-xs font-semibold text-white hover:bg-[#3fb950] transition-colors"
                        >
                          Select Block for Placement
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Essence Classification */}
                  <div className="rounded border border-[#333] bg-[#18181b] p-3 text-xs">
                    <div className="font-semibold text-white mb-1">Essence Domain:</div>
                    <div className="font-mono text-[11px] text-[#ce9178]">
                      {getEssenceCategory(selectedItem.abbreviation)}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded border border-dashed border-[#333] p-6 text-center text-xs text-[#777]">
                  Select any connector badge or block to inspect specifications and mating rules.
                </div>
              )}

              {/* In-line Compatibility & Suggestion Engine */}
              <div className="mt-6 border-t border-[#333] pt-4">
                <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-1.5">
                  <span>💡</span> In-line Adapter Suggestion Engine
                </h4>
                <p className="text-[11px] text-[#888] mb-3 leading-normal">
                  Test compatibility between two ports to see adapter recommendations:
                </p>

                <div className="space-y-2">
                  <div>
                    <label className="text-[10px] uppercase text-[#777]">Source Signal / Port:</label>
                    <input
                      type="text"
                      value={sourceConnector}
                      onChange={(e) => setSourceConnector(e.target.value)}
                      className="mt-0.5 w-full rounded border border-[#3e3e42] bg-[#141414] px-2 py-1 font-mono text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase text-[#777]">Target Destination Port:</label>
                    <input
                      type="text"
                      value={targetConnector}
                      onChange={(e) => setTargetConnector(e.target.value)}
                      className="mt-0.5 w-full rounded border border-[#3e3e42] bg-[#141414] px-2 py-1 font-mono text-xs text-white"
                    />
                  </div>
                </div>

                {/* Live Advice Box */}
                <div
                  className={`mt-3 rounded border p-2.5 text-xs ${
                    compatibilityReport.compatible
                      ? 'border-[#2ea043] bg-[#1b2f1e] text-[#b4f0b9]'
                      : compatibilityReport.status === 'adapter_needed'
                      ? 'border-[#e9a03b] bg-[#322718] text-[#fdd663]'
                      : 'border-[#f28b82] bg-[#331c1c] text-[#fca5a5]'
                  }`}
                >
                  <div className="font-bold flex items-center gap-1">
                    <span>
                      {compatibilityReport.compatible
                        ? '✓'
                        : compatibilityReport.status === 'adapter_needed'
                        ? '⚠ Adapter Needed'
                        : '✕ Incompatible'}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed">{compatibilityReport.summary}</p>
                  {compatibilityReport.suggestedAdapter && (
                    <div className="mt-2 border-t border-white/10 pt-1.5">
                      <span className="font-semibold text-white">Suggested: </span>
                      <span className="text-[11px]">{compatibilityReport.suggestedAdapter}</span>
                    </div>
                  )}
                  {compatibilityReport.recommendedBlockId && (
                    <button
                      onClick={() => handlePlaceBlock(compatibilityReport.recommendedBlockId!)}
                      className="mt-2 w-full rounded bg-[#007acc] py-1 text-[11px] font-semibold text-white hover:bg-[#1188dd]"
                    >
                      Insert Recommended Adapter ({compatibilityReport.recommendedBlockId})
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#333] text-center text-[10px] text-[#666]">
              OneScope &amp; APK.audio Standard Schematic Specification
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
