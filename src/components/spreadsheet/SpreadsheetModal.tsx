// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { useState, useMemo } from 'react';
import { useStore } from '../../state/useStore';
import { useUi } from '../../state/useUi';
import { CATALOG } from '../../flow/catalog';
import { groupOf, parentOf } from '../../flow/groups';

interface SpreadsheetModalProps {
  onClose: () => void;
}

type TabType = 'placements' | 'connectors' | 'groups';

export function SpreadsheetModal({ onClose }: SpreadsheetModalProps) {
  const store = useStore();
  const { layers } = useUi();
  const [activeTab, setActiveTab] = useState<TabType>('placements');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());

  const schematic = store.schematic;

  // Toggle selection
  const toggleSelect = (id: string | number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = (allIds: (string | number)[]) => {
    if (selectedIds.size >= allIds.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allIds));
    }
  };

  // --- Add Row Handlers ---
  const handleAddPlacement = () => {
    store.editFlow(() => {
      const maxId = schematic.placements.reduce((m, p) => Math.max(m, p.id), 0);
      const newId = maxId + 1;
      const firstCatalog = CATALOG[0]?.id || 'flow.process';
      schematic.placements.push({
        id: newId,
        definitionId: firstCatalog,
        at: { x: Math.round((Math.random() * 20 - 10) * 10) / 10, y: Math.round((Math.random() * 20 - 10) * 10) / 10 },
        layerId: '0',
        refdes: `FLOW_PROCESS${newId}`,
      });
      return true;
    });
  };

  const handleAddConnector = () => {
    if (schematic.placements.length < 2) {
      store.showHint('Need at least 2 placements to create a wire connection.', 4000);
      return;
    }
    store.editFlow(() => {
      const maxId = schematic.connectors.reduce((m, c) => Math.max(m, c.id), 0);
      const newId = maxId + 1;
      const p1 = schematic.placements[0];
      const p2 = schematic.placements[1];
      schematic.connectors.push({
        id: newId,
        from: { placementId: p1.id, portId: 'out' },
        to: { placementId: p2.id, portId: 'in' },
        layerId: '0',
      });
      return true;
    });
  };

  const handleAddGroup = () => {
    store.editFlow(() => {
      const maxId = schematic.groups.reduce((m, g) => Math.max(m, g.id), 0);
      const newId = maxId + 1;
      schematic.groups.push({
        id: newId,
        name: `Group ${newId}`,
        children: [],
        members: [],
        layerId: '0',
        collapsed: false,
      });
      return true;
    });
  };

  // --- Delete Selection Handler ---
  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    store.editFlow(() => {
      if (activeTab === 'placements') {
        const pIds = Array.from(selectedIds).map(Number);
        schematic.placements = schematic.placements.filter((p) => !pIds.includes(p.id));
        // Remove orphaned connectors
        schematic.connectors = schematic.connectors.filter(
          (c) => !pIds.includes(c.from.placementId) && !pIds.includes(c.to.placementId)
        );
        // Remove from groups
        schematic.groups.forEach((g) => {
          g.members = g.members.filter((m) => !pIds.includes(m));
        });
      } else if (activeTab === 'connectors') {
        const cIds = Array.from(selectedIds).map(Number);
        schematic.connectors = schematic.connectors.filter((c) => !cIds.includes(c.id));
      } else if (activeTab === 'groups') {
        const gIds = Array.from(selectedIds).map(Number);
        schematic.groups = schematic.groups.filter((g) => !gIds.includes(g.id));
        schematic.groups.forEach((g) => {
          g.children = g.children.filter((ch) => !gIds.includes(ch));
        });
      }
      return true;
    });
    setSelectedIds(new Set());
  };

  // --- CSV Export Handler ---
  const handleExportCsv = () => {
    let csvContent = '';
    let filename = '';

    if (activeTab === 'placements') {
      filename = 'big_picture_placements.csv';
      csvContent = 'ID,RefDes,DefinitionID,Group,X,Y,Layer\n';
      schematic.placements.forEach((p) => {
        const g = groupOf(schematic, p.id);
        csvContent += `"${p.id}","${p.refdes || ''}","${p.definitionId || ''}","${g ? g.id : ''}",${p.at.x},${p.at.y},"${p.layerId || '0'}"\n`;
      });
    } else if (activeTab === 'connectors') {
      filename = 'big_picture_connections.csv';
      csvContent = 'WireID,FromPlacementID,FromPort,ToPlacementID,ToPort,Layer,Label\n';
      schematic.connectors.forEach((c) => {
        csvContent += `"${c.id}",${c.from.placementId},"${c.from.portId}",${c.to.placementId},"${c.to.portId}","${c.layerId || '0'}","${c.label || ''}"\n`;
      });
    } else if (activeTab === 'groups') {
      filename = 'big_picture_groups.csv';
      csvContent = 'GroupID,Name,ParentGroupID,Layer\n';
      schematic.groups.forEach((g) => {
        const parent = parentOf(schematic, g.id);
        csvContent += `"${g.id}","${g.name || ''}","${parent ? parent.id : ''}","${g.layerId || '0'}"\n`;
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- CSV Import Handler ---
  const handleImportCsv = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
      if (lines.length < 2) return;

      store.editFlow(() => {
        if (activeTab === 'placements') {
          lines.slice(1).forEach((line) => {
            const parts = line.split(',').map((s) => s.replace(/^"|"$/g, '').trim());
            if (parts.length >= 3) {
              const id = Number(parts[0]) || schematic.nextPlacementId++;
              const existing = schematic.placements.find((p) => p.id === id);
              if (existing) {
                existing.refdes = parts[1] || existing.refdes;
                existing.definitionId = parts[2] || existing.definitionId;
                if (parts[4]) existing.at.x = Number(parts[4]) || 0;
                if (parts[5]) existing.at.y = Number(parts[5]) || 0;
                if (parts[6]) existing.layerId = parts[6];
              } else {
                schematic.placements.push({
                  id,
                  refdes: parts[1] || `FLOW_${id}`,
                  definitionId: parts[2] || 'flow.process',
                  at: { x: Number(parts[4]) || 0, y: Number(parts[5]) || 0 },
                  layerId: parts[6] || '0',
                });
              }
            }
          });
        } else if (activeTab === 'connectors') {
          lines.slice(1).forEach((line) => {
            const parts = line.split(',').map((s) => s.replace(/^"|"$/g, '').trim());
            if (parts.length >= 5) {
              const wireId = Number(parts[0]) || schematic.nextConnectorId++;
              const fromId = Number(parts[1]);
              const fromPort = parts[2];
              const toId = Number(parts[3]);
              const toPort = parts[4];
              const existing = schematic.connectors.find((c) => c.id === wireId);
              if (existing) {
                existing.from.placementId = fromId;
                existing.from.portId = fromPort;
                existing.to.placementId = toId;
                existing.to.portId = toPort;
                if (parts[5]) existing.layerId = parts[5];
                if (parts[6]) existing.label = parts[6];
              } else if (fromId && toId) {
                schematic.connectors.push({
                  id: wireId,
                  from: { placementId: fromId, portId: fromPort },
                  to: { placementId: toId, portId: toPort },
                  layerId: parts[5] || '0',
                  label: parts[6] || undefined,
                });
              }
            }
          });
        }
        return true;
      });
      store.showHint('CSV imported successfully.', 4000);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // --- Filtered Data ---
  const filteredPlacements = useMemo(() => {
    const q = search.toLowerCase();
    return schematic.placements.filter(
      (p) =>
        String(p.id).includes(q) ||
        (p.refdes && p.refdes.toLowerCase().includes(q)) ||
        p.definitionId.toLowerCase().includes(q)
    );
  }, [schematic.placements, search]);

  const filteredConnectors = useMemo(() => {
    const q = search.toLowerCase();
    return schematic.connectors.filter(
      (c) =>
        String(c.id).toLowerCase().includes(q) ||
        String(c.from.placementId).includes(q) ||
        String(c.to.placementId).includes(q) ||
        c.from.portId.toLowerCase().includes(q) ||
        c.to.portId.toLowerCase().includes(q) ||
        (c.label && c.label.toLowerCase().includes(q))
    );
  }, [schematic.connectors, search]);

  const filteredGroups = useMemo(() => {
    const q = search.toLowerCase();
    return schematic.groups.filter(
      (g) =>
        String(g.id).toLowerCase().includes(q) ||
        g.name.toLowerCase().includes(q)
    );
  }, [schematic.groups, search]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs select-none">
      <div className="flex h-[85vh] w-[95vw] max-w-6xl flex-col rounded-xl border border-[#454545] bg-[#1e1e1e] text-xs text-[#cccccc] shadow-2xl overflow-hidden">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between border-b border-[#333] bg-[#252526] px-5 py-3">
          <div className="flex items-center gap-3">
            <span className="text-xl">🔥</span>
            <div>
              <h2 className="font-mono text-sm font-bold text-[#f4902c] uppercase tracking-wider">
                CellHell Matrix Editor
              </h2>
              <p className="text-[11px] text-[#888]">
                Edit connections, placements, and groups directly in the CellHell interactive table spreadsheet
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded bg-[#383838] px-3 py-1.5 text-xs text-white hover:bg-[#4a4a4a] transition-colors"
            >
              Close ✕
            </button>
          </div>
        </div>

        {/* Toolbar & Tabs Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#333] bg-[#2a2a2b] px-5 py-2">
          {/* Tabs */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => { setActiveTab('placements'); setSelectedIds(new Set()); }}
              className={`rounded px-3 py-1.5 font-mono text-xs font-semibold transition-colors ${
                activeTab === 'placements'
                  ? 'bg-[#f4902c] text-white shadow-sm'
                  : 'bg-[#1e1e1e] text-[#aaa] hover:bg-[#333] hover:text-white'
              }`}
            >
              📦 Placements ({schematic.placements.length})
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('connectors'); setSelectedIds(new Set()); }}
              className={`rounded px-3 py-1.5 font-mono text-xs font-semibold transition-colors ${
                activeTab === 'connectors'
                  ? 'bg-[#f4902c] text-white shadow-sm'
                  : 'bg-[#1e1e1e] text-[#aaa] hover:bg-[#333] hover:text-white'
              }`}
            >
              🔌 Connection Table ({schematic.connectors.length})
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('groups'); setSelectedIds(new Set()); }}
              className={`rounded px-3 py-1.5 font-mono text-xs font-semibold transition-colors ${
                activeTab === 'groups'
                  ? 'bg-[#f4902c] text-white shadow-sm'
                  : 'bg-[#1e1e1e] text-[#aaa] hover:bg-[#333] hover:text-white'
              }`}
            >
              📁 Groups ({schematic.groups.length})
            </button>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="🔍 Search table..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded border border-[#444] bg-[#1e1e1e] px-2.5 py-1 text-xs text-white placeholder-[#666] focus:border-[#f4902c] focus:outline-none w-44"
            />

            {activeTab === 'placements' && (
              <button
                type="button"
                onClick={handleAddPlacement}
                className="rounded bg-[#38bdf8]/20 border border-[#38bdf8]/50 px-3 py-1 text-xs font-semibold text-[#38bdf8] hover:bg-[#38bdf8]/30 transition-colors"
              >
                + Add Block
              </button>
            )}
            {activeTab === 'connectors' && (
              <button
                type="button"
                onClick={handleAddConnector}
                className="rounded bg-[#38bdf8]/20 border border-[#38bdf8]/50 px-3 py-1 text-xs font-semibold text-[#38bdf8] hover:bg-[#38bdf8]/30 transition-colors"
              >
                + Add Wire Connection
              </button>
            )}
            {activeTab === 'groups' && (
              <button
                type="button"
                onClick={handleAddGroup}
                className="rounded bg-[#38bdf8]/20 border border-[#38bdf8]/50 px-3 py-1 text-xs font-semibold text-[#38bdf8] hover:bg-[#38bdf8]/30 transition-colors"
              >
                + Add Group
              </button>
            )}

            {selectedIds.size > 0 && (
              <button
                type="button"
                onClick={handleDeleteSelected}
                className="rounded bg-[#ef4444]/20 border border-[#ef4444]/50 px-3 py-1 text-xs font-semibold text-[#ef4444] hover:bg-[#ef4444]/30 transition-colors"
              >
                🗑️ Delete ({selectedIds.size})
              </button>
            )}

            <button
              type="button"
              onClick={handleExportCsv}
              className="rounded border border-[#555] bg-[#333] px-2.5 py-1 text-xs text-white hover:bg-[#444] transition-colors"
              title="Export current table view to CSV format"
            >
              📤 Export CSV
            </button>

            <label
              className="rounded border border-[#555] bg-[#333] px-2.5 py-1 text-xs text-white hover:bg-[#444] transition-colors cursor-pointer"
              title="Import CSV into spreadsheet table"
            >
              📥 Import CSV
              <input type="file" accept=".csv" onChange={handleImportCsv} className="hidden" />
            </label>
          </div>
        </div>

        {/* Main Interactive Table Grid Area */}
        <div className="flex-1 overflow-auto bg-[#141414] p-2">
          {/* TAB 1: PLACEMENTS SPREADSHEET TABLE */}
          {activeTab === 'placements' && (
            <table className="w-full border-collapse border border-[#333] text-left text-xs font-mono">
              <thead className="sticky top-0 bg-[#252526] text-[#888]">
                <tr>
                  <th className="w-8 border border-[#333] p-1.5 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.size > 0 && selectedIds.size >= filteredPlacements.length}
                      onChange={() => toggleSelectAll(filteredPlacements.map((p) => p.id))}
                    />
                  </th>
                  <th className="w-16 border border-[#333] p-1.5 text-center">ID</th>
                  <th className="border border-[#333] p-1.5">RefDes / Name</th>
                  <th className="border border-[#333] p-1.5">Definition Type</th>
                  <th className="border border-[#333] p-1.5">Group Owner</th>
                  <th className="w-20 border border-[#333] p-1.5 text-right">X Pos</th>
                  <th className="w-20 border border-[#333] p-1.5 text-right">Y Pos</th>
                  <th className="w-24 border border-[#333] p-1.5">Layer</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlacements.map((p) => {
                  const currentGroup = groupOf(schematic, p.id);
                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-[#2a2d2e] ${selectedIds.has(p.id) ? 'bg-[#f4902c]/15' : ''}`}
                    >
                      <td className="border border-[#262626] p-1.5 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(p.id)}
                          onChange={() => toggleSelect(p.id)}
                        />
                      </td>
                      <td className="border border-[#262626] p-1.5 text-center font-bold text-[#888]">
                        {p.id}
                      </td>

                      {/* Editable RefDes / Name */}
                      <td className="border border-[#262626] p-1">
                        <input
                          type="text"
                          value={p.refdes || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            store.editFlow(() => {
                              p.refdes = val;
                              return true;
                            });
                          }}
                          className="w-full bg-transparent px-1 font-bold text-white focus:bg-[#111] focus:outline-none focus:ring-1 focus:ring-[#f4902c]"
                        />
                      </td>

                      {/* Definition ID Dropdown */}
                      <td className="border border-[#262626] p-1">
                        <select
                          value={p.definitionId}
                          onChange={(e) => {
                            const val = e.target.value;
                            store.editFlow(() => {
                              p.definitionId = val;
                              return true;
                            });
                          }}
                          className="w-full bg-transparent px-1 text-[#38bdf8] focus:bg-[#111] focus:outline-none"
                        >
                          {schematic.definitions.map((def) => (
                            <option key={def.id} value={def.id} className="bg-[#222] text-white">
                              {def.name} ({def.id})
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Group Assignment */}
                      <td className="border border-[#262626] p-1">
                        <select
                          value={currentGroup ? currentGroup.id : ''}
                          onChange={(e) => {
                            const val = e.target.value ? Number(e.target.value) : null;
                            store.editFlow(() => {
                              // Detach from current group
                              schematic.groups.forEach((g) => {
                                g.members = g.members.filter((m) => m !== p.id);
                              });
                              // Attach to new group
                              if (val !== null) {
                                const targetG = schematic.groups.find((g) => g.id === val);
                                if (targetG && !targetG.members.includes(p.id)) {
                                  targetG.members.push(p.id);
                                }
                              }
                              return true;
                            });
                          }}
                          className="w-full bg-transparent px-1 text-[#f4902c] focus:bg-[#111] focus:outline-none"
                        >
                          <option value="" className="bg-[#222] text-[#888]">(None)</option>
                          {schematic.groups.map((g) => (
                            <option key={g.id} value={g.id} className="bg-[#222] text-white">
                              {g.name} (#{g.id})
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* X Position */}
                      <td className="border border-[#262626] p-1 text-right">
                        <input
                          type="number"
                          step="0.1"
                          value={p.at.x}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            store.editFlow(() => {
                              p.at.x = val;
                              return true;
                            });
                          }}
                          className="w-full text-right bg-transparent px-1 text-white focus:bg-[#111] focus:outline-none"
                        />
                      </td>

                      {/* Y Position */}
                      <td className="border border-[#262626] p-1 text-right">
                        <input
                          type="number"
                          step="0.1"
                          value={p.at.y}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            store.editFlow(() => {
                              p.at.y = val;
                              return true;
                            });
                          }}
                          className="w-full text-right bg-transparent px-1 text-white focus:bg-[#111] focus:outline-none"
                        />
                      </td>

                      {/* Layer */}
                      <td className="border border-[#262626] p-1">
                        <select
                          value={p.layerId || '0'}
                          onChange={(e) => {
                            const val = e.target.value;
                            store.editFlow(() => {
                              p.layerId = val;
                              return true;
                            });
                          }}
                          className="w-full bg-transparent px-1 text-[#aaa] focus:bg-[#111] focus:outline-none"
                        >
                          {Array.from(layers.values()).map((l) => (
                            <option key={l.id} value={l.id} className="bg-[#222] text-white">
                              {l.id}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {/* TAB 2: CONNECTORS (WIRES) SPREADSHEET TABLE */}
          {activeTab === 'connectors' && (
            <table className="w-full border-collapse border border-[#333] text-left text-xs font-mono">
              <thead className="sticky top-0 bg-[#252526] text-[#888]">
                <tr>
                  <th className="w-8 border border-[#333] p-1.5 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.size > 0 && selectedIds.size >= filteredConnectors.length}
                      onChange={() => toggleSelectAll(filteredConnectors.map((c) => c.id))}
                    />
                  </th>
                  <th className="w-16 border border-[#333] p-1.5 text-center">Wire ID</th>
                  <th className="border border-[#333] p-1.5">From Block</th>
                  <th className="w-28 border border-[#333] p-1.5">From Port</th>
                  <th className="border border-[#333] p-1.5">To Block</th>
                  <th className="w-28 border border-[#333] p-1.5">To Port</th>
                  <th className="border border-[#333] p-1.5">Signal Label</th>
                  <th className="w-24 border border-[#333] p-1.5">Layer</th>
                </tr>
              </thead>
              <tbody>
                {filteredConnectors.map((c) => (
                  <tr
                    key={c.id}
                    className={`hover:bg-[#2a2d2e] ${selectedIds.has(c.id) ? 'bg-[#f4902c]/15' : ''}`}
                  >
                    <td className="border border-[#262626] p-1.5 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(c.id)}
                        onChange={() => toggleSelect(c.id)}
                      />
                    </td>

                    {/* Wire ID */}
                    <td className="border border-[#262626] p-1 text-center font-bold text-[#888]">
                      {c.id}
                    </td>

                    {/* From Placement */}
                    <td className="border border-[#262626] p-1">
                      <select
                        value={c.from.placementId}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          store.editFlow(() => {
                            c.from.placementId = val;
                            return true;
                          });
                        }}
                        className="w-full bg-transparent px-1 font-bold text-[#38bdf8] focus:bg-[#111] focus:outline-none"
                      >
                        {schematic.placements.map((p) => (
                          <option key={p.id} value={p.id} className="bg-[#222] text-white">
                            {p.refdes || `Block ${p.id}`} (#{p.id})
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* From Port */}
                    <td className="border border-[#262626] p-1">
                      <input
                        type="text"
                        value={c.from.portId}
                        onChange={(e) => {
                          const val = e.target.value;
                          store.editFlow(() => {
                            c.from.portId = val;
                            return true;
                          });
                        }}
                        className="w-full bg-transparent px-1 text-[#4ade80] focus:bg-[#111] focus:outline-none uppercase"
                      />
                    </td>

                    {/* To Placement */}
                    <td className="border border-[#262626] p-1">
                      <select
                        value={c.to.placementId}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          store.editFlow(() => {
                            c.to.placementId = val;
                            return true;
                          });
                        }}
                        className="w-full bg-transparent px-1 font-bold text-[#38bdf8] focus:bg-[#111] focus:outline-none"
                      >
                        {schematic.placements.map((p) => (
                          <option key={p.id} value={p.id} className="bg-[#222] text-white">
                            {p.refdes || `Block ${p.id}`} (#{p.id})
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* To Port */}
                    <td className="border border-[#262626] p-1">
                      <input
                        type="text"
                        value={c.to.portId}
                        onChange={(e) => {
                          const val = e.target.value;
                          store.editFlow(() => {
                            c.to.portId = val;
                            return true;
                          });
                        }}
                        className="w-full bg-transparent px-1 text-[#4ade80] focus:bg-[#111] focus:outline-none uppercase"
                      />
                    </td>

                    {/* Signal Label */}
                    <td className="border border-[#262626] p-1">
                      <input
                        type="text"
                        value={c.label || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          store.editFlow(() => {
                            c.label = val || undefined;
                            return true;
                          });
                        }}
                        className="w-full bg-transparent px-1 text-white focus:bg-[#111] focus:outline-none"
                      />
                    </td>

                    {/* Layer */}
                    <td className="border border-[#262626] p-1">
                      <select
                        value={c.layerId || '0'}
                        onChange={(e) => {
                          const val = e.target.value;
                          store.editFlow(() => {
                            c.layerId = val;
                            return true;
                          });
                        }}
                        className="w-full bg-transparent px-1 text-[#aaa] focus:bg-[#111] focus:outline-none"
                      >
                        {Array.from(layers.values()).map((l) => (
                          <option key={l.id} value={l.id} className="bg-[#222] text-white">
                            {l.id}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* TAB 3: GROUPS SPREADSHEET TABLE */}
          {activeTab === 'groups' && (
            <table className="w-full border-collapse border border-[#333] text-left text-xs font-mono">
              <thead className="sticky top-0 bg-[#252526] text-[#888]">
                <tr>
                  <th className="w-8 border border-[#333] p-1.5 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.size > 0 && selectedIds.size >= filteredGroups.length}
                      onChange={() => toggleSelectAll(filteredGroups.map((g) => g.id))}
                    />
                  </th>
                  <th className="w-20 border border-[#333] p-1.5 text-center">Group ID</th>
                  <th className="border border-[#333] p-1.5">Group Name</th>
                  <th className="border border-[#333] p-1.5">Parent Group</th>
                  <th className="w-24 border border-[#333] p-1.5">Layer</th>
                  <th className="w-28 border border-[#333] p-1.5 text-right">Member Blocks</th>
                </tr>
              </thead>
              <tbody>
                {filteredGroups.map((g) => {
                  const parentGroup = parentOf(schematic, g.id);
                  return (
                    <tr
                      key={g.id}
                      className={`hover:bg-[#2a2d2e] ${selectedIds.has(g.id) ? 'bg-[#f4902c]/15' : ''}`}
                    >
                      <td className="border border-[#262626] p-1.5 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(g.id)}
                          onChange={() => toggleSelect(g.id)}
                        />
                      </td>

                      {/* Group ID */}
                      <td className="border border-[#262626] p-1 text-center font-bold text-[#888]">
                        {g.id}
                      </td>

                      {/* Group Name */}
                      <td className="border border-[#262626] p-1">
                        <input
                          type="text"
                          value={g.name}
                          onChange={(e) => {
                            const val = e.target.value;
                            store.editFlow(() => {
                              g.name = val;
                              return true;
                            });
                          }}
                          className="w-full bg-transparent px-1 font-bold text-[#f4902c] focus:bg-[#111] focus:outline-none"
                        />
                      </td>

                      {/* Parent Group */}
                      <td className="border border-[#262626] p-1">
                        <select
                          value={parentGroup ? parentGroup.id : ''}
                          onChange={(e) => {
                            const val = e.target.value ? Number(e.target.value) : null;
                            store.editFlow(() => {
                              // Detach from current parent
                              schematic.groups.forEach((other) => {
                                other.children = other.children.filter((ch) => ch !== g.id);
                              });
                              // Attach to new parent
                              if (val !== null) {
                                const newParent = schematic.groups.find((other) => other.id === val);
                                if (newParent && !newParent.children.includes(g.id)) {
                                  newParent.children.push(g.id);
                                }
                              }
                              return true;
                            });
                          }}
                          className="w-full bg-transparent px-1 text-[#aaa] focus:bg-[#111] focus:outline-none"
                        >
                          <option value="" className="bg-[#222] text-[#888]">(Top Level / None)</option>
                          {schematic.groups
                            .filter((other) => other.id !== g.id)
                            .map((other) => (
                              <option key={other.id} value={other.id} className="bg-[#222] text-white">
                                {other.name} (#{other.id})
                              </option>
                            ))}
                        </select>
                      </td>

                      {/* Layer */}
                      <td className="border border-[#262626] p-1">
                        <select
                          value={g.layerId || '0'}
                          onChange={(e) => {
                            const val = e.target.value;
                            store.editFlow(() => {
                              g.layerId = val;
                              return true;
                            });
                          }}
                          className="w-full bg-transparent px-1 text-[#aaa] focus:bg-[#111] focus:outline-none"
                        >
                          {Array.from(layers.values()).map((l) => (
                            <option key={l.id} value={l.id} className="bg-[#222] text-white">
                              {l.id}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Member Blocks Count */}
                      <td className="border border-[#262626] p-1 text-right font-bold text-white">
                        {g.members.length} block{g.members.length === 1 ? '' : 's'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[#333] bg-[#252526] px-5 py-2 text-[11px] text-[#888]">
          <span>
            Showing {activeTab === 'placements' ? filteredPlacements.length : activeTab === 'connectors' ? filteredConnectors.length : filteredGroups.length} row(s)
          </span>
          <span>
            💡 Double click or type in any cell to edit live. Changes immediately sync with the canvas drawing.
          </span>
        </div>
      </div>
    </div>
  );
}
