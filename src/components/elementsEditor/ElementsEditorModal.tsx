// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { useMemo, useState } from 'react';
import { useStore } from '@state/useStore';
import { useUi } from '@state/useUi';
import { ApkTable, h, inputNode, numberNode, selectNode, buttonNode } from '../common/ApkTable';

interface ElementsEditorModalProps {
  onClose: () => void;
  onOpenBlockEditor?: (blockName?: string) => void;
}

type TabType = 'texts' | 'blocks' | 'fills';

const PAGE_SIZE = 50;

/* THE ONE TABLE (ROAD-3494): the texts, block instances and fills lists are
   APKTables (cad-elements-texts / -block-instances / -fills; ../common/ApkTable).
   A field commits when it is left or Enter is pressed — one undo step per edit,
   not one per keystroke. */
const INPUT = 'rounded border border-[#3c3c3c] bg-[#141414] px-1 py-0.5 text-white';
const DELETE = 'rounded bg-red-900/40 px-2 py-0.5 text-red-300 hover:bg-red-800';

function PaginationBar({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (p: number) => void;
}) {
  if (totalItems <= pageSize) {
    return (
      <div className="flex items-center justify-between text-[11px] text-[#888] px-1 py-1">
        <span>Showing all {totalItems} item{totalItems === 1 ? '' : 's'}</span>
      </div>
    );
  }

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex items-center justify-between bg-[#1f1f1f] border border-[#333] rounded px-3 py-1.5 text-xs text-[#ccc]">
      <span>
        Showing <span className="font-semibold text-white">{start}–{end}</span> of{' '}
        <span className="font-semibold text-white">{totalItems}</span>
      </span>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage <= 1}
          className="rounded px-2 py-0.5 bg-[#2a2a2a] hover:bg-[#383838] disabled:opacity-30 disabled:cursor-not-allowed text-[11px]"
        >
          « First
        </button>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="rounded px-2 py-0.5 bg-[#2a2a2a] hover:bg-[#383838] disabled:opacity-30 disabled:cursor-not-allowed text-[11px]"
        >
          ‹ Prev
        </button>
        <span className="px-2 font-mono text-[11px] text-accent">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="rounded px-2 py-0.5 bg-[#2a2a2a] hover:bg-[#383838] disabled:opacity-30 disabled:cursor-not-allowed text-[11px]"
        >
          Next ›
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage >= totalPages}
          className="rounded px-2 py-0.5 bg-[#2a2a2a] hover:bg-[#383838] disabled:opacity-30 disabled:cursor-not-allowed text-[11px]"
        >
          Last »
        </button>
      </div>
    </div>
  );
}

export function ElementsEditorModal({ onClose, onOpenBlockEditor }: ElementsEditorModalProps) {
  const store = useStore();
  const { layers, activeLayerId, selectionSize } = useUi();
  const layerOptions = layers.map((l) => ({ value: l.id, label: l.name }));
  /** One undoable edit from a table cell. */
  const edit = (fn: () => void) => store.edit(() => { fn(); return true; });
  const [activeTab, setActiveTab] = useState<TabType>('texts');
  const [search, setSearch] = useState('');

  // Pagination states
  const [textPage, setTextPage] = useState(1);
  const [instancePage, setInstancePage] = useState(1);
  const [fillPage, setFillPage] = useState(1);

  // Local state for adding a text
  const [newTextStr, setNewTextStr] = useState('NOTE');
  const [newTextX, setNewTextX] = useState('0');
  const [newTextY, setNewTextY] = useState('0');
  const [newTextH, setNewTextH] = useState('0.5');

  // Local state for creating a block from selection
  const [newBlockName, setNewBlockName] = useState('MY_CUSTOM_BLOCK');

  // Local state for adding a fill box
  const [fillX, setFillX] = useState('-2');
  const [fillY, setFillY] = useState('-2');
  const [fillW, setFillW] = useState('4');
  const [fillH, setFillH] = useState('4');
  const [fillType, setFillType] = useState<'solid' | 'hatch'>('solid');

  const texts = useMemo(() => Array.from(store.doc.texts.values()), [store.doc.texts]);
  const fills = useMemo(() => Array.from(store.doc.fills.values()), [store.doc.fills]);
  const blocks = useMemo(() => Array.from(store.doc.blocks.values()), [store.doc.blocks]);
  const blockInstances = useMemo(() => Array.from(store.doc.blockInstances.values()), [store.doc.blockInstances]);

  const filteredTexts = useMemo(() => {
    if (!search.trim()) return texts;
    const q = search.toLowerCase();
    return texts.filter(
      (t) =>
        t.text.toLowerCase().includes(q) ||
        t.layerId.toLowerCase().includes(q) ||
        String(t.id).includes(q),
    );
  }, [texts, search]);

  const filteredBlocks = useMemo(() => {
    if (!search.trim()) return blocks;
    const q = search.toLowerCase();
    return blocks.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        (b.description && b.description.toLowerCase().includes(q)),
    );
  }, [blocks, search]);

  const filteredInstances = useMemo(() => {
    if (!search.trim()) return blockInstances;
    const q = search.toLowerCase();
    return blockInstances.filter(
      (i) =>
        i.blockName.toLowerCase().includes(q) ||
        i.layerId.toLowerCase().includes(q) ||
        (i.uuid && i.uuid.toLowerCase().includes(q)) ||
        String(i.id).includes(q),
    );
  }, [blockInstances, search]);

  const filteredFills = useMemo(() => {
    if (!search.trim()) return fills;
    const q = search.toLowerCase();
    return fills.filter(
      (f) =>
        f.layerId.toLowerCase().includes(q) ||
        f.type.toLowerCase().includes(q) ||
        String(f.id).includes(q),
    );
  }, [fills, search]);

  // Paginated slices
  const totalTextPages = Math.max(1, Math.ceil(filteredTexts.length / PAGE_SIZE));
  const currentTextPage = Math.min(textPage, totalTextPages);
  const pagedTexts = useMemo(() => {
    const start = (currentTextPage - 1) * PAGE_SIZE;
    return filteredTexts.slice(start, start + PAGE_SIZE);
  }, [filteredTexts, currentTextPage]);

  const totalInstancePages = Math.max(1, Math.ceil(filteredInstances.length / PAGE_SIZE));
  const currentInstancePage = Math.min(instancePage, totalInstancePages);
  const pagedInstances = useMemo(() => {
    const start = (currentInstancePage - 1) * PAGE_SIZE;
    return filteredInstances.slice(start, start + PAGE_SIZE);
  }, [filteredInstances, currentInstancePage]);

  const totalFillPages = Math.max(1, Math.ceil(filteredFills.length / PAGE_SIZE));
  const currentFillPage = Math.min(fillPage, totalFillPages);
  const pagedFills = useMemo(() => {
    const start = (currentFillPage - 1) * PAGE_SIZE;
    return filteredFills.slice(start, start + PAGE_SIZE);
  }, [filteredFills, currentFillPage]);

  const handleAddText = () => {
    const x = parseFloat(newTextX) || 0;
    const y = parseFloat(newTextY) || 0;
    const h = parseFloat(newTextH) || 0.5;
    store.edit(() => {
      store.doc.addText(newTextStr, x, y, h, 0, activeLayerId);
      return true;
    });
    store.showHint(`Added text: "${newTextStr}"`, 2000);
    setNewTextStr('NOTE');
  };

  const handleCreateBlockFromSelection = () => {
    if (store.selection.size === 0) {
      alert('Please select geometry on the canvas first to create a block from selection.');
      return;
    }
    let created = false;
    store.edit(() => {
      const res = store.doc.createBlockFromSelection(newBlockName, store.selection);
      created = res !== null;
      return created;
    });
    if (created) {
      store.showHint(`Block definition "${newBlockName}" created!`, 2500);
    }
  };

  const handleInsertBlock = (blockName: string) => {
    store.edit(() => {
      store.doc.addBlockInstance(blockName, 0, 0, 1, 0, activeLayerId);
      return true;
    });
    store.showHint(`Inserted "${blockName}" instance at (0, 0).`, 2000);
  };

  const handleExplodeBlock = (id: number) => {
    store.edit(() => store.doc.explodeBlockInstance(id));
    store.showHint(`Exploded block instance #${id}.`, 2000);
  };

  const handleAddFillBox = () => {
    const x = parseFloat(fillX) || 0;
    const y = parseFloat(fillY) || 0;
    const w = parseFloat(fillW) || 2;
    const h = parseFloat(fillH) || 2;
    const points = [
      { x, y },
      { x: x + w, y },
      { x: x + w, y: y + h },
      { x, y: y + h },
    ];
    store.edit(() => {
      store.doc.addFill(points, fillType, activeLayerId, undefined, 0.35);
      return true;
    });
    store.showHint(`Created ${fillType} box fill.`, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="flex h-[88vh] w-[95vw] max-w-5xl flex-col rounded-lg border border-[#3c3c3c] bg-[#1e1e1e] shadow-2xl overflow-hidden font-sans text-xs text-[#cccccc]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#333] bg-[#252526] px-4 py-2.5">
          <div className="flex items-center gap-3">
            <span className="text-lg">🔲</span>
            <div>
              <h2 className="text-sm font-semibold tracking-wide text-white">
                CAD Elements Editor: Text, Blocks &amp; Fills
              </h2>
              <p className="text-[10px] text-[#888]">
                Inspect, author, and manage annotations, reusable symbols, and fill patterns
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Search items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-48 rounded border border-[#3c3c3c] bg-[#141414] px-2.5 py-1 text-xs text-white placeholder-[#666] focus:border-accent focus:outline-none"
            />
            <button
              onClick={onClose}
              className="rounded p-1 text-[#888] hover:bg-[#333] hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#333] bg-[#1c1c1c] px-4">
          <button
            onClick={() => setActiveTab('texts')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 font-medium transition-colors ${
              activeTab === 'texts'
                ? 'border-accent text-white'
                : 'border-transparent text-[#888] hover:text-[#ccc]'
            }`}
          >
            <span>📝</span>
            <span>Text Annotations</span>
            <span className="rounded-full bg-[#333] px-1.5 py-0.5 text-[10px] text-[#aaa]">
              {texts.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('blocks')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 font-medium transition-colors ${
              activeTab === 'blocks'
                ? 'border-accent text-white'
                : 'border-transparent text-[#888] hover:text-[#ccc]'
            }`}
          >
            <span>🧱</span>
            <span>CAD Blocks &amp; Definitions</span>
            <span className="rounded-full bg-[#333] px-1.5 py-0.5 text-[10px] text-[#aaa]">
              {blocks.length} defs / {blockInstances.length} inst
            </span>
          </button>
          <button
            onClick={() => setActiveTab('fills')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 font-medium transition-colors ${
              activeTab === 'fills'
                ? 'border-accent text-white'
                : 'border-transparent text-[#888] hover:text-[#ccc]'
            }`}
          >
            <span>🎨</span>
            <span>Fills &amp; Hatches</span>
            <span className="rounded-full bg-[#333] px-1.5 py-0.5 text-[10px] text-[#aaa]">
              {fills.length}
            </span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-auto p-4">
          {/* -------------------- TEXTS TAB -------------------- */}
          {activeTab === 'texts' && (
            <div className="space-y-4">
              {/* Add Text Bar */}
              <div className="flex flex-wrap items-center gap-2 rounded border border-[#333] bg-[#252526] p-3">
                <span className="font-semibold text-white">Add New Text:</span>
                <input
                  type="text"
                  placeholder="Text content"
                  value={newTextStr}
                  onChange={(e) => setNewTextStr(e.target.value)}
                  className="rounded border border-[#3c3c3c] bg-[#1e1e1e] px-2 py-1 text-white"
                />
                <label className="text-[#888]">X:</label>
                <input
                  type="number"
                  value={newTextX}
                  onChange={(e) => setNewTextX(e.target.value)}
                  className="w-16 rounded border border-[#3c3c3c] bg-[#1e1e1e] px-2 py-1 text-white"
                />
                <label className="text-[#888]">Y:</label>
                <input
                  type="number"
                  value={newTextY}
                  onChange={(e) => setNewTextY(e.target.value)}
                  className="w-16 rounded border border-[#3c3c3c] bg-[#1e1e1e] px-2 py-1 text-white"
                />
                <label className="text-[#888]">Height:</label>
                <input
                  type="number"
                  step="0.1"
                  value={newTextH}
                  onChange={(e) => setNewTextH(e.target.value)}
                  className="w-16 rounded border border-[#3c3c3c] bg-[#1e1e1e] px-2 py-1 text-white"
                />
                <button
                  onClick={handleAddText}
                  className="rounded bg-[#0e639c] px-3 py-1 font-semibold text-white hover:bg-[#1177bb]"
                >
                  + Add Text Note
                </button>
              </div>

              {/* Texts Table */}
              <PaginationBar
                currentPage={currentTextPage}
                totalPages={totalTextPages}
                totalItems={filteredTexts.length}
                pageSize={PAGE_SIZE}
                onPageChange={setTextPage}
              />

              <div className="rounded border border-[#333] overflow-hidden">
                <ApkTable
                  id="cad-elements-texts"
                  sortable={false}
                  className="cad-apk"
                  rows={pagedTexts}
                  columns={[
                    { key: 'id', label: 'ID', text: (t) => `#${t.id}`, style: () => ({ color: '#888' }) },
                    { key: 'text', label: 'Content', node: (t) => inputNode(t.text, (v) => edit(() => { t.text = v; }), `w-48 ${INPUT}`) },
                    { key: 'x', label: 'X', node: (t) => numberNode(t.x, '0.1', (v) => edit(() => { t.x = v; }), 0, `w-16 ${INPUT}`) },
                    { key: 'y', label: 'Y', node: (t) => numberNode(t.y, '0.1', (v) => edit(() => { t.y = v; }), 0, `w-16 ${INPUT}`) },
                    { key: 'height', label: 'Height', node: (t) => numberNode(t.height, '0.05', (v) => edit(() => { t.height = v; }), 0.1, `w-16 ${INPUT}`) },
                    { key: 'rotation', label: 'Rotation (°)', value: (t) => t.rotation ?? 0, node: (t) => numberNode(t.rotation ?? 0, '15', (v) => edit(() => { t.rotation = v; }), 0, `w-16 ${INPUT}`) },
                    { key: 'layerId', label: 'Layer', node: (t) => selectNode(layerOptions, t.layerId, (v) => edit(() => { t.layerId = v; }), INPUT) },
                    { key: 'actions', label: 'Actions', value: () => '', node: (t) => buttonNode('Delete', () => edit(() => { store.doc.removeText(t.id); }), DELETE) },
                  ]}
                />
                {filteredTexts.length === 0 && (
                  <div className="p-4 text-center text-[#666]">No text entities found. Use the Text tool (X) or the bar above to add one.</div>
                )}
              </div>

              <PaginationBar
                currentPage={currentTextPage}
                totalPages={totalTextPages}
                totalItems={filteredTexts.length}
                pageSize={PAGE_SIZE}
                onPageChange={setTextPage}
              />
            </div>
          )}

          {/* -------------------- BLOCKS TAB -------------------- */}
          {activeTab === 'blocks' && (
            <div className="space-y-6">
              {/* Block Definitions */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h3 className="text-sm font-semibold text-white">Block Definitions (Library)</h3>
                    <button
                      onClick={() => {
                        onClose();
                        onOpenBlockEditor?.();
                      }}
                      className="rounded bg-go px-2.5 py-0.5 text-xs font-semibold text-white hover:bg-go-hover transition-colors"
                    >
                      🧱 Open Block Editor (BEDIT)
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Block name"
                      value={newBlockName}
                      onChange={(e) => setNewBlockName(e.target.value)}
                      className="rounded border border-[#3c3c3c] bg-[#141414] px-2 py-1 text-white text-xs"
                    />
                    <button
                      onClick={handleCreateBlockFromSelection}
                      disabled={selectionSize === 0}
                      className="rounded bg-accent px-3 py-1 font-semibold text-black hover:bg-[#ffa552] disabled:opacity-40 text-xs"
                    >
                      Create From Selection ({selectionSize})
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredBlocks.map((b) => (
                    <div
                      key={b.name}
                      className="flex flex-col justify-between rounded border border-[#333] bg-[#252526] p-3"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-sm font-bold text-accent">{b.name}</span>
                          <span className="text-[10px] text-[#888]">
                            {b.lines.length} lines, {b.circles.length} circles, {b.arcs.length} arcs
                          </span>
                        </div>
                        {b.description && (
                          <p className="mt-1 text-[11px] text-[#aaa]">{b.description}</p>
                        )}
                      </div>
                      <div className="mt-3 flex items-center justify-between border-t border-[#333] pt-2 gap-1.5">
                        <button
                          onClick={() => {
                            onClose();
                            onOpenBlockEditor?.(b.name);
                          }}
                          className="rounded bg-go/80 px-2 py-1 text-xs text-white hover:bg-go"
                          title="Open in CAD Block Editor"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleInsertBlock(b.name)}
                          className="rounded bg-[#0e639c] px-2 py-1 text-xs text-white hover:bg-[#1177bb]"
                        >
                          + Insert
                        </button>
                        <button
                          onClick={() => {
                            store.setTool('block');
                            onClose();
                          }}
                          className="text-[#888] hover:text-[#ccc] text-xs"
                        >
                          Pick (K)
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Block Instances */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">
                    Placed Block Instances ({filteredInstances.length})
                  </h3>
                </div>

                <PaginationBar
                  currentPage={currentInstancePage}
                  totalPages={totalInstancePages}
                  totalItems={filteredInstances.length}
                  pageSize={PAGE_SIZE}
                  onPageChange={setInstancePage}
                />

                <div className="rounded border border-[#333] overflow-hidden">
                  <ApkTable
                    id="cad-elements-block-instances"
                    sortable={false}
                    className="cad-apk"
                    rows={pagedInstances}
                    columns={[
                      { key: 'id', label: 'ID', text: (i) => `#${i.id}`, style: () => ({ color: '#888' }) },
                      { key: 'blockName', label: 'Block Name', mono: true, style: () => ({ color: 'var(--color-accent)' }) },
                      { key: 'x', label: 'X', node: (i) => numberNode(i.x, '0.5', (v) => edit(() => { i.x = v; }), 0, `w-16 ${INPUT}`) },
                      { key: 'y', label: 'Y', node: (i) => numberNode(i.y, '0.5', (v) => edit(() => { i.y = v; }), 0, `w-16 ${INPUT}`) },
                      { key: 'scale', label: 'Scale', node: (i) => numberNode(i.scale, '0.1', (v) => edit(() => { i.scale = v; }), 1, `w-16 ${INPUT}`) },
                      { key: 'rotation', label: 'Rotation (°)', node: (i) => numberNode(i.rotation, '15', (v) => edit(() => { i.rotation = v; }), 0, `w-16 ${INPUT}`) },
                      { key: 'layerId', label: 'Layer', node: (i) => selectNode(layerOptions, i.layerId, (v) => edit(() => { i.layerId = v; }), INPUT) },
                      { key: 'actions', label: 'Actions', value: () => '', node: (i) => {
                        const box = h('span', { display: 'flex', alignItems: 'center', gap: '6px' });
                        box.appendChild(buttonNode('Explode', () => handleExplodeBlock(i.id), 'rounded bg-amber-900/40 px-2 py-0.5 text-amber-300 hover:bg-amber-800', 'Unpack into native editable geometry'));
                        box.appendChild(buttonNode('Delete', () => edit(() => { store.doc.removeBlockInstance(i.id); }), DELETE));
                        return box;
                      } },
                    ]}
                  />
                  {filteredInstances.length === 0 && (
                    <div className="p-4 text-center text-[#666]">No block instances placed on sheet. Use the &quot;Insert&quot; buttons above or Block tool (K) to place one.</div>
                  )}
                </div>

                <PaginationBar
                  currentPage={currentInstancePage}
                  totalPages={totalInstancePages}
                  totalItems={filteredInstances.length}
                  pageSize={PAGE_SIZE}
                  onPageChange={setInstancePage}
                />
              </div>
            </div>
          )}

          {/* -------------------- FILLS TAB -------------------- */}
          {activeTab === 'fills' && (
            <div className="space-y-4">
              {/* Add Fill Box Bar */}
              <div className="flex flex-wrap items-center gap-2 rounded border border-[#333] bg-[#252526] p-3">
                <span className="font-semibold text-white">Add Box Fill / Hatch:</span>
                <label className="text-[#888]">Type:</label>
                <select
                  value={fillType}
                  onChange={(e) => setFillType(e.target.value as 'solid' | 'hatch')}
                  className="rounded border border-[#3c3c3c] bg-[#1e1e1e] px-2 py-1 text-white"
                >
                  <option value="solid">Solid Fill</option>
                  <option value="hatch">Diagonal Hatch</option>
                </select>
                <label className="text-[#888]">X:</label>
                <input
                  type="number"
                  value={fillX}
                  onChange={(e) => setFillX(e.target.value)}
                  className="w-16 rounded border border-[#3c3c3c] bg-[#1e1e1e] px-2 py-1 text-white"
                />
                <label className="text-[#888]">Y:</label>
                <input
                  type="number"
                  value={fillY}
                  onChange={(e) => setFillY(e.target.value)}
                  className="w-16 rounded border border-[#3c3c3c] bg-[#1e1e1e] px-2 py-1 text-white"
                />
                <label className="text-[#888]">W:</label>
                <input
                  type="number"
                  value={fillW}
                  onChange={(e) => setFillW(e.target.value)}
                  className="w-16 rounded border border-[#3c3c3c] bg-[#1e1e1e] px-2 py-1 text-white"
                />
                <label className="text-[#888]">H:</label>
                <input
                  type="number"
                  value={fillH}
                  onChange={(e) => setFillH(e.target.value)}
                  className="w-16 rounded border border-[#3c3c3c] bg-[#1e1e1e] px-2 py-1 text-white"
                />
                <button
                  onClick={handleAddFillBox}
                  className="rounded bg-[#0e639c] px-3 py-1 font-semibold text-white hover:bg-[#1177bb]"
                >
                  + Add Fill Region
                </button>
              </div>

              {/* Fills Table */}
              <PaginationBar
                currentPage={currentFillPage}
                totalPages={totalFillPages}
                totalItems={filteredFills.length}
                pageSize={PAGE_SIZE}
                onPageChange={setFillPage}
              />

              <div className="rounded border border-[#333] overflow-hidden">
                <ApkTable
                  id="cad-elements-fills"
                  sortable={false}
                  className="cad-apk"
                  rows={pagedFills}
                  columns={[
                    { key: 'id', label: 'ID', text: (f) => `#${f.id}`, style: () => ({ color: '#888' }) },
                    { key: 'type', label: 'Type', node: (f) => selectNode([{ value: 'solid', label: 'Solid' }, { value: 'hatch', label: 'Hatch' }], f.type, (v) => edit(() => { f.type = v as 'solid' | 'hatch'; }), `${INPUT} capitalize`) },
                    { key: 'vertices', label: 'Vertices', value: (f) => f.points.length, text: (f) => `${f.points.length} vertices`, style: () => ({ color: '#aaa' }) },
                    { key: 'opacity', label: 'Opacity', value: (f) => f.opacity ?? 0.35, node: (f) => {
                      const box = h('span', { display: 'flex', alignItems: 'center', gap: '8px' });
                      const r = h('input', undefined, null, 'w-24') as HTMLInputElement;
                      r.type = 'range'; r.min = '0.1'; r.max = '1.0'; r.step = '0.05'; r.value = String(f.opacity ?? 0.35);
                      const pct = h('span', { color: '#aaa', fontSize: '11px' }, `${Math.round((f.opacity ?? 0.35) * 100)}%`);
                      r.oninput = () => { pct.textContent = `${Math.round(parseFloat(r.value) * 100)}%`; };
                      r.onchange = () => edit(() => { f.opacity = parseFloat(r.value); });
                      box.appendChild(r); box.appendChild(pct);
                      return box;
                    } },
                    { key: 'layerId', label: 'Layer', node: (f) => selectNode(layerOptions, f.layerId, (v) => edit(() => { f.layerId = v; }), INPUT) },
                    { key: 'actions', label: 'Actions', value: () => '', node: (f) => buttonNode('Delete', () => edit(() => { store.doc.removeFill(f.id); }), DELETE) },
                  ]}
                />
                {filteredFills.length === 0 && (
                  <div className="p-4 text-center text-[#666]">No fill or hatch regions found. Use the Fill tool (H) or the bar above to create one.</div>
                )}
              </div>

              <PaginationBar
                currentPage={currentFillPage}
                totalPages={totalFillPages}
                totalItems={filteredFills.length}
                pageSize={PAGE_SIZE}
                onPageChange={setFillPage}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[#333] bg-[#252526] px-4 py-2 text-[11px] text-[#888]">
          <div>
            Total: {texts.length} text annotations · {blocks.length} block definitions ·{' '}
            {blockInstances.length} instances · {fills.length} fills
          </div>
          <button
            onClick={onClose}
            className="rounded bg-[#3c3c3c] px-4 py-1 text-white hover:bg-[#4a4a4a]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
