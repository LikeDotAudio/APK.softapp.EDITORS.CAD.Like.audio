// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { useState, useMemo } from 'react';
import { CATALOG } from '../../../flow/catalog';
import { PORT_SIDES } from '../../../core/types';
import { SIDE_COLOR } from '../../../render/flow/flowColors';
import { useStore } from '@state/useStore';
import { useUi } from '@state/useUi';
import { PanelSectionTitle } from '../PanelSectionTitle';

type FlowCategory = 'ALL' | 'FLOW' | 'MATH_LOGIC' | 'ADAPTERS' | 'SYMBOLS';

/**
 * The Flow & Schematic block set, as a categorized list you place from.
 */
export function FlowCatalogSection() {
  const store = useStore();
  const { flow } = useUi();
  const [category, setCategory] = useState<FlowCategory>('ALL');
  const [search, setSearch] = useState('');

  const filteredCatalog = useMemo(() => {
    const q = search.toLowerCase().trim();
    return CATALOG.filter((def) => {
      if (category === 'FLOW' && !def.id.startsWith('flow.')) return false;
      if (category === 'MATH_LOGIC' && !def.id.startsWith('math.') && !def.id.startsWith('logic.') && !def.id.startsWith('idea.'))
        return false;
      if (category === 'ADAPTERS' && !def.id.startsWith('adapter.')) return false;
      if (category === 'SYMBOLS' && !def.id.startsWith('symbol.')) return false;

      if (!q) return true;
      return def.name.toLowerCase().includes(q) || (def.description && def.description.toLowerCase().includes(q));
    });
  }, [category, search]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PanelSectionTitle label="Schematic & Flow Blocks">
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[10px] text-[#777]">
            {flow.placements} blk · {flow.connectors} wire
          </span>
          <button
            onClick={() => store.triggerOpenConceptLibrary()}
            className="rounded bg-[#007acc] px-1.5 py-0.5 text-[9px] font-semibold text-white hover:bg-[#1188dd] transition-colors"
            title="Open Full Part & Concept Library"
          >
            📚 Library
          </button>
        </div>
      </PanelSectionTitle>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap gap-1 px-2 pt-1 pb-1.5 border-b border-[#2d2d30] bg-[#222225]">
        {[
          { id: 'ALL', label: 'All' },
          { id: 'FLOW', label: 'Flow' },
          { id: 'MATH_LOGIC', label: 'Math/Logic' },
          { id: 'ADAPTERS', label: 'Adapters' },
          { id: 'SYMBOLS', label: 'Symbols' },
        ].map((c) => (
          <button
            key={c.id}
            onClick={() => setCategory(c.id as FlowCategory)}
            className={`rounded px-1.5 py-0.5 text-[10px] transition-colors ${
              category === c.id ? 'bg-[#37373d] text-white font-medium' : 'text-[#888] hover:text-[#ccc]'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Search Input */}
      <div className="px-2 py-1 bg-[#1e1e20]">
        <input
          type="text"
          placeholder="Filter blocks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded border border-[#333] bg-[#141414] px-2 py-0.5 text-[11px] text-white placeholder-[#555] focus:border-[#007acc] focus:outline-none"
        />
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto py-0.5">
        {filteredCatalog.map((def) => {
          const active = def.id === flow.definitionId;
          return (
            <button
              key={def.id}
              type="button"
              title={`${def.description || def.name} (${def.ports.length} ports)`}
              onClick={() => store.setFlowDefinition(def.id)}
              className={`flex items-center justify-between px-2.5 py-1.5 text-left text-[11px] ${
                active ? 'bg-[#094771] text-white font-medium' : 'text-[#cccccc] hover:bg-[#2a2d2e]'
              }`}
            >
              <span className="font-mono truncate mr-2">{def.name}</span>
              <span className="flex items-center gap-1 flex-shrink-0">
                {PORT_SIDES.map((side) => {
                  const has = def.ports.some((p) => p.side === side);
                  return (
                    <span
                      key={side}
                      title={`${side} port`}
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: has ? SIDE_COLOR[side] : '#333' }}
                    />
                  );
                })}
              </span>
            </button>
          );
        })}
        {filteredCatalog.length === 0 && (
          <div className="py-3 text-center text-[10px] text-[#666]">No matching blocks</div>
        )}
      </div>
    </div>
  );
}

