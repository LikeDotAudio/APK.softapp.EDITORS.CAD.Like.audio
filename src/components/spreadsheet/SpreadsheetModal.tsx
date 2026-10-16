// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { useState, useMemo } from 'react';
import { useStore } from '../../state/useStore';
import { useUi } from '../../state/useUi';
import { CATALOG } from '../../flow/catalog';
import { groupOf, parentOf } from '../../flow/groups';

interface SpreadsheetModalProps {
  onClose: () => void;
  initialTab?: TabType;
}

export type TabType = 'placements' | 'connectors' | 'groups' | 'bom';

export interface BomItem {
  key: string;
  kind: 'flow' | 'cad';
  partName: string;
  displayName: string;
  description: string;
  quantity: number;
  instances: Array<{
    id: number;
    refdes: string;
    layerId: string;
    x: number;
    y: number;
    attributes?: Record<string, string>;
  }>;
  layers: string[];
  attributesSummary: Record<string, string>;
}

export function SpreadsheetModal({ onClose, initialTab = 'placements' }: SpreadsheetModalProps) {
  const store = useStore();
  const { layers } = useUi();
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
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
    } else if (activeTab === 'bom') {
      filename = `bill_of_materials_${new Date().toISOString().slice(0, 10)}.csv`;
      csvContent = 'Item,Component,Category,Qty,Designators,Layers,Description,Attributes\n';
      filteredBom.forEach((b, idx) => {
        const desig = b.instances.map((i) => i.refdes).join('; ');
        const layersStr = b.layers.join('; ');
        const attrsStr = Object.entries(b.attributesSummary)
          .map(([k, v]) => `${k}=${v}`)
          .join('; ');
        csvContent += `"${idx + 1}","${b.displayName}","${b.kind === 'flow' ? 'Flow Block' : 'CAD Block'}","${b.quantity}","${desig}","${layersStr}","${b.description || ''}","${attrsStr}"\n`;
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

  // --- BOM Items Extraction & Grouping ---
  const bomItems = useMemo<BomItem[]>(() => {
    const list: BomItem[] = [];

    // 1. Group Flow placements
    const flowMap = new Map<string, BomItem>();
    for (const p of schematic.placements) {
      let item = flowMap.get(p.definitionId);
      if (!item) {
        const cat = CATALOG.find((c) => c.id === p.definitionId);
        item = {
          key: `flow:${p.definitionId}`,
          kind: 'flow',
          partName: p.definitionId,
          displayName: cat?.name || p.definitionId,
          description: cat?.description || '',
          quantity: 0,
          instances: [],
          layers: [],
          attributesSummary: {},
        };
        flowMap.set(p.definitionId, item);
      }
      item.quantity += 1;
      const ref = p.refdes || `FLOW_${p.id}`;
      item.instances.push({
        id: p.id,
        refdes: ref,
        layerId: p.layerId || '0',
        x: p.at.x,
        y: p.at.y,
      });
      if (p.layerId && !item.layers.includes(p.layerId)) {
        item.layers.push(p.layerId);
      }
    }
    list.push(...flowMap.values());

    // 2. Group CAD Block instances
    const cadMap = new Map<string, BomItem>();
    for (const inst of store.doc.blockInstances.values()) {
      let item = cadMap.get(inst.blockName);
      if (!item) {
        const def = store.doc.blocks.get(inst.blockName);
        item = {
          key: `cad:${inst.blockName}`,
          kind: 'cad',
          partName: inst.blockName,
          displayName: inst.blockName,
          description: def?.description || '',
          quantity: 0,
          instances: [],
          layers: [],
          attributesSummary: {},
        };
        cadMap.set(inst.blockName, item);
      }
      item.quantity += 1;
      const ref = inst.uuid ? inst.uuid.slice(0, 8) : `#${inst.id}`;
      item.instances.push({
        id: inst.id,
        refdes: ref,
        layerId: inst.layerId || '0',
        x: inst.x,
        y: inst.y,
        attributes: inst.attributes,
      });
      if (inst.layerId && !item.layers.includes(inst.layerId)) {
        item.layers.push(inst.layerId);
      }
      if (inst.attributes) {
        Object.assign(item.attributesSummary, inst.attributes);
      }
    }
    list.push(...cadMap.values());

    return list;
  }, [schematic.placements, store.doc.blockInstances, store.doc.blocks]);

  const filteredBom = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return bomItems;
    return bomItems.filter(
      (b) =>
        b.displayName.toLowerCase().includes(q) ||
        b.partName.toLowerCase().includes(q) ||
        b.description.toLowerCase().includes(q) ||
        b.instances.some((i) => i.refdes.toLowerCase().includes(q)) ||
        b.layers.some((l) => l.toLowerCase().includes(q)) ||
        Object.entries(b.attributesSummary).some(([k, v]) =>
          k.toLowerCase().includes(q) || v.toLowerCase().includes(q)
        ),
    );
  }, [bomItems, search]);

  const handleLocateBomItem = (item: BomItem) => {
    store.selection.clear();
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    if (item.kind === 'cad') {
      for (const inst of item.instances) {
        store.selection.add(inst.id);
        minX = Math.min(minX, inst.x - 2);
        minY = Math.min(minY, inst.y - 2);
        maxX = Math.max(maxX, inst.x + 2);
        maxY = Math.max(maxY, inst.y + 2);
      }
    } else {
      for (const inst of item.instances) {
        minX = Math.min(minX, inst.x - 2);
        minY = Math.min(minY, inst.y - 2);
        maxX = Math.max(maxX, inst.x + 2);
        maxY = Math.max(maxY, inst.y + 2);
      }
    }

    if (isFinite(minX) && isFinite(minY) && isFinite(maxX) && isFinite(maxY)) {
      store.view.zoomToFit({ x1: minX, y1: minY, x2: maxX, y2: maxY });
    }
    store.requestDraw();
    store.emit();
    store.showHint(
      `🎯 Located and selected ${item.instances.length} instance(s) of "${item.displayName}" on canvas.`,
      4000,
    );
  };

  const handleEditAttributes = (item: BomItem) => {
    const attrKey = window.prompt(
      `Enter attribute name for "${item.displayName}" (e.g. Value, Manufacturer, PartNumber, Footprint):`,
      'Value',
    );
    if (!attrKey) return;
    const cleanKey = attrKey.trim();
    if (!cleanKey) return;
    const existingVal = item.attributesSummary[cleanKey] || '';
    const attrVal = window.prompt(`Enter value for attribute "${cleanKey}":`, existingVal);
    if (attrVal === null) return;

    if (item.kind === 'cad') {
      store.history.push(store.doc.snapshot());
      for (const instInfo of item.instances) {
        const inst = store.doc.blockInstances.get(instInfo.id);
        if (inst) {
          if (!inst.attributes) inst.attributes = {};
          inst.attributes[cleanKey] = attrVal.trim();
        }
      }
      store.markDocChanged();
      store.requestDraw();
      store.emit();
      store.showHint(`Updated attribute "${cleanKey}" across ${item.instances.length} instance(s).`, 3000);
    } else {
      store.showHint(`Attribute updated for ${item.displayName}.`, 3000);
    }
  };

  const handleCopyBomTable = () => {
    let md = '| Component | Category | Qty | Designators | Layers | Attributes |\n';
    md += '|---|---|---|---|---|---|\n';
    for (const b of filteredBom) {
      const des = b.instances.map((i) => i.refdes).join(', ');
      const attrs = Object.entries(b.attributesSummary)
        .map(([k, v]) => `${k}: ${v}`)
        .join('; ');
      md += `| ${b.displayName} | ${b.kind === 'flow' ? 'Flow Block' : 'CAD Block'} | ${b.quantity} | ${des} | ${b.layers.join(', ')} | ${attrs} |\n`;
    }
    void navigator.clipboard.writeText(md).then(() => {
      store.showHint('BOM table copied to clipboard as markdown.', 3000);
    });
  };

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
            <button
              type="button"
              onClick={() => { setActiveTab('bom'); setSelectedIds(new Set()); }}
              className={`rounded px-3 py-1.5 font-mono text-xs font-semibold transition-colors ${
                activeTab === 'bom'
                  ? 'bg-[#9333ea] text-white shadow-sm'
                  : 'bg-[#1e1e1e] text-[#aaa] hover:bg-[#333] hover:text-white'
              }`}
            >
              📋 BOM / Parts List ({bomItems.length})
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

            {activeTab === 'bom' && (
              <button
                type="button"
                onClick={handleCopyBomTable}
                className="rounded bg-[#9333ea]/20 border border-[#9333ea]/50 px-2.5 py-1 text-xs font-semibold text-[#c084fc] hover:bg-[#9333ea]/30 transition-colors"
                title="Copy formatted markdown table of BOM to clipboard"
              >
                📋 Copy Markdown
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

          {/* BOM (Bill of Materials) Table */}
          {activeTab === 'bom' && (
            <table className="w-full border-collapse text-left font-mono">
              <thead className="sticky top-0 z-10 border-b border-[#333] bg-[#222] text-[#888]">
                <tr>
                  <th className="border border-[#262626] p-1.5 text-center w-8">
                    <input
                      type="checkbox"
                      checked={selectedIds.size >= filteredBom.length && filteredBom.length > 0}
                      onChange={() => toggleSelectAll(filteredBom.map((b) => b.key))}
                      className="cursor-pointer"
                    />
                  </th>
                  <th className="border border-[#262626] p-1.5 w-12 text-center">#</th>
                  <th className="border border-[#262626] p-1.5">Component / Symbol</th>
                  <th className="border border-[#262626] p-1.5 w-28">Category</th>
                  <th className="border border-[#262626] p-1.5 w-16 text-center">Qty</th>
                  <th className="border border-[#262626] p-1.5">Designators / Instances</th>
                  <th className="border border-[#262626] p-1.5 w-24">Layers</th>
                  <th className="border border-[#262626] p-1.5">Attributes & Properties</th>
                  <th className="border border-[#262626] p-1.5 w-36 text-center">Interactive Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBom.map((item, idx) => {
                  const isSelected = selectedIds.has(item.key);
                  return (
                    <tr
                      key={item.key}
                      className={`border-b border-[#262626] hover:bg-[#252528] ${
                        isSelected ? 'bg-[#9333ea]/15' : idx % 2 === 0 ? 'bg-[#1a1a1a]' : 'bg-[#1e1e1e]'
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="border border-[#262626] p-1 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(item.key)}
                          className="cursor-pointer"
                        />
                      </td>

                      {/* Item # */}
                      <td className="border border-[#262626] p-1 text-center text-[#666]">
                        {idx + 1}
                      </td>

                      {/* Component / Symbol Name */}
                      <td className="border border-[#262626] p-1">
                        <div className="flex flex-col">
                          <span className="font-semibold text-white">{item.displayName}</span>
                          {item.partName !== item.displayName && (
                            <span className="text-[10px] text-[#777]">{item.partName}</span>
                          )}
                          {item.description && (
                            <span className="text-[10px] text-[#888] italic">{item.description}</span>
                          )}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="border border-[#262626] p-1">
                        <span
                          className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                            item.kind === 'flow'
                              ? 'bg-[#0e639c]/30 text-[#38bdf8] border border-[#0e639c]/50'
                              : 'bg-[#2ea043]/30 text-[#4ade80] border border-[#2ea043]/50'
                          }`}
                        >
                          {item.kind === 'flow' ? '⚡ Flow Block' : '🧱 CAD Block'}
                        </span>
                      </td>

                      {/* Quantity */}
                      <td className="border border-[#262626] p-1 text-center font-bold text-white text-xs">
                        <span className="rounded bg-[#333] px-2 py-0.5">{item.quantity}</span>
                      </td>

                      {/* Designators / Instances */}
                      <td className="border border-[#262626] p-1">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {item.instances.map((inst) => (
                            <span
                              key={inst.id}
                              className="rounded bg-[#2a2a2a] border border-[#444] px-1.5 py-0.5 text-[10px] text-[#ddd]"
                              title={`Instance ID: ${inst.id} @ (${inst.x.toFixed(1)}, ${inst.y.toFixed(1)})`}
                            >
                              {inst.refdes}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Layers */}
                      <td className="border border-[#262626] p-1 text-[#aaa]">
                        {item.layers.join(', ') || '0'}
                      </td>

                      {/* Attributes */}
                      <td className="border border-[#262626] p-1">
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(item.attributesSummary).length === 0 ? (
                            <span className="text-[10px] text-[#555] italic">None</span>
                          ) : (
                            Object.entries(item.attributesSummary).map(([k, v]) => (
                              <span
                                key={k}
                                className="rounded bg-[#333]/60 border border-[#555] px-1.5 py-0.5 text-[10px] text-[#f4902c]"
                              >
                                <b>{k}:</b> {v}
                              </span>
                            ))
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="border border-[#262626] p-1 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleLocateBomItem(item)}
                            className="rounded bg-[#38bdf8]/20 border border-[#38bdf8]/50 px-2 py-1 text-[11px] font-semibold text-[#38bdf8] hover:bg-[#38bdf8]/30 transition-colors"
                            title="Highlight and zoom to all instances of this component on the canvas"
                          >
                            🎯 Locate
                          </button>
                          {item.kind === 'cad' && (
                            <button
                              type="button"
                              onClick={() => handleEditAttributes(item)}
                              className="rounded bg-[#f4902c]/20 border border-[#f4902c]/50 px-2 py-1 text-[11px] font-semibold text-[#f4902c] hover:bg-[#f4902c]/30 transition-colors"
                              title="Set or update attributes (e.g. Value, Part#, Vendor) on all instances"
                            >
                              ✏️ Attr
                            </button>
                          )}
                        </div>
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
            Showing {activeTab === 'placements' ? filteredPlacements.length : activeTab === 'connectors' ? filteredConnectors.length : activeTab === 'groups' ? filteredGroups.length : filteredBom.length} row(s)
          </span>
          <span>
            {activeTab === 'bom'
              ? '💡 Click "🎯 Locate" to highlight and zoom to components on canvas. Click "✏️ Attr" to assign attributes.'
              : '💡 Double click or type in any cell to edit live. Changes immediately sync with the canvas drawing.'}
          </span>
        </div>
      </div>
    </div>
  );
}
