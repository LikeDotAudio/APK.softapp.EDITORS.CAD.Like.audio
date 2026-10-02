// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { useState } from 'react';
import { useStore } from '../../state/useStore';
import { useUi } from '../../state/useUi';

interface ElementsEditorModalProps {
  onClose: () => void;
}

type TabType = 'texts' | 'blocks' | 'fills';

export function ElementsEditorModal({ onClose }: ElementsEditorModalProps) {
  const store = useStore();
  const { layers, activeLayerId, selectionSize } = useUi();
  const [activeTab, setActiveTab] = useState<TabType>('texts');
  const [search, setSearch] = useState('');

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

  const texts = Array.from(store.doc.texts.values());
  const fills = Array.from(store.doc.fills.values());
  const blocks = Array.from(store.doc.blocks.values());
  const blockInstances = Array.from(store.doc.blockInstances.values());

  const filteredTexts = texts.filter(
    (t) =>
      t.text.toLowerCase().includes(search.toLowerCase()) ||
      t.layerId.toLowerCase().includes(search.toLowerCase()),
  );

  const filteredBlocks = blocks.filter(
    (b) =>
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      (b.description && b.description.toLowerCase().includes(search.toLowerCase())),
  );

  const filteredInstances = blockInstances.filter(
    (i) =>
      i.blockName.toLowerCase().includes(search.toLowerCase()) ||
      i.layerId.toLowerCase().includes(search.toLowerCase()),
  );

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
              className="w-48 rounded border border-[#3c3c3c] bg-[#141414] px-2.5 py-1 text-xs text-white placeholder-[#666] focus:border-[#f4902c] focus:outline-none"
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
                ? 'border-[#f4902c] text-white'
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
                ? 'border-[#f4902c] text-white'
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
                ? 'border-[#f4902c] text-white'
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
              <div className="rounded border border-[#333] overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-[#2d2d2d] text-[#aaa]">
                    <tr>
                      <th className="p-2.5">ID</th>
                      <th className="p-2.5">Content</th>
                      <th className="p-2.5">X</th>
                      <th className="p-2.5">Y</th>
                      <th className="p-2.5">Height</th>
                      <th className="p-2.5">Rotation (°)</th>
                      <th className="p-2.5">Layer</th>
                      <th className="p-2.5">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2a2a2a] bg-[#1e1e1e]">
                    {filteredTexts.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-4 text-center text-[#666]">
                          No text entities found. Use the Text tool (X) or the bar above to add one.
                        </td>
                      </tr>
                    ) : (
                      filteredTexts.map((text) => (
                        <tr key={text.id} className="hover:bg-[#252526]">
                          <td className="p-2.5 text-[#888]">#{text.id}</td>
                          <td className="p-2.5">
                            <input
                              type="text"
                              value={text.text}
                              onChange={(e) => {
                                const val = e.target.value;
                                store.edit(() => {
                                  text.text = val;
                                  return true;
                                });
                              }}
                              className="w-48 rounded border border-[#3c3c3c] bg-[#141414] px-2 py-0.5 text-white"
                            />
                          </td>
                          <td className="p-2.5">
                            <input
                              type="number"
                              step="0.1"
                              value={text.x}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                store.edit(() => {
                                  text.x = val;
                                  return true;
                                });
                              }}
                              className="w-16 rounded border border-[#3c3c3c] bg-[#141414] px-1 py-0.5 text-white"
                            />
                          </td>
                          <td className="p-2.5">
                            <input
                              type="number"
                              step="0.1"
                              value={text.y}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                store.edit(() => {
                                  text.y = val;
                                  return true;
                                });
                              }}
                              className="w-16 rounded border border-[#3c3c3c] bg-[#141414] px-1 py-0.5 text-white"
                            />
                          </td>
                          <td className="p-2.5">
                            <input
                              type="number"
                              step="0.05"
                              value={text.height}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0.1;
                                store.edit(() => {
                                  text.height = val;
                                  return true;
                                });
                              }}
                              className="w-16 rounded border border-[#3c3c3c] bg-[#141414] px-1 py-0.5 text-white"
                            />
                          </td>
                          <td className="p-2.5">
                            <input
                              type="number"
                              step="15"
                              value={text.rotation ?? 0}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                store.edit(() => {
                                  text.rotation = val;
                                  return true;
                                });
                              }}
                              className="w-14 rounded border border-[#3c3c3c] bg-[#141414] px-1 py-0.5 text-white"
                            />
                          </td>
                          <td className="p-2.5">
                            <select
                              value={text.layerId}
                              onChange={(e) => {
                                const val = e.target.value;
                                store.edit(() => {
                                  text.layerId = val;
                                  return true;
                                });
                              }}
                              className="rounded border border-[#3c3c3c] bg-[#141414] px-2 py-0.5 text-white"
                            >
                              {layers.map((l) => (
                                <option key={l.id} value={l.id}>
                                  {l.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="p-2.5">
                            <button
                              onClick={() => {
                                store.edit(() => {
                                  store.doc.removeText(text.id);
                                  return true;
                                });
                              }}
                              className="rounded bg-red-900/40 px-2 py-0.5 text-red-300 hover:bg-red-800"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* -------------------- BLOCKS TAB -------------------- */}
          {activeTab === 'blocks' && (
            <div className="space-y-6">
              {/* Block Definitions */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">Block Definitions (Library)</h3>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Block name"
                      value={newBlockName}
                      onChange={(e) => setNewBlockName(e.target.value)}
                      className="rounded border border-[#3c3c3c] bg-[#141414] px-2 py-1 text-white"
                    />
                    <button
                      onClick={handleCreateBlockFromSelection}
                      disabled={selectionSize === 0}
                      className="rounded bg-[#f4902c] px-3 py-1 font-semibold text-black hover:bg-[#ffa552] disabled:opacity-40"
                    >
                      Create Block From Selection ({selectionSize})
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
                          <span className="font-mono text-sm font-bold text-[#f4902c]">{b.name}</span>
                          <span className="text-[10px] text-[#888]">
                            {b.lines.length} lines, {b.circles.length} circles, {b.arcs.length} arcs
                          </span>
                        </div>
                        {b.description && (
                          <p className="mt-1 text-[11px] text-[#aaa]">{b.description}</p>
                        )}
                      </div>
                      <div className="mt-3 flex items-center justify-between border-t border-[#333] pt-2">
                        <button
                          onClick={() => handleInsertBlock(b.name)}
                          className="rounded bg-[#0e639c] px-2.5 py-1 text-white hover:bg-[#1177bb]"
                        >
                          + Insert on Sheet
                        </button>
                        <button
                          onClick={() => {
                            store.setTool('block');
                            onClose();
                          }}
                          className="text-[#888] hover:text-[#ccc]"
                        >
                          Pick with Tool (K)
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Block Instances */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-white">
                  Placed Block Instances ({blockInstances.length})
                </h3>
                <div className="rounded border border-[#333] overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-[#2d2d2d] text-[#aaa]">
                      <tr>
                        <th className="p-2.5">ID</th>
                        <th className="p-2.5">Block Name</th>
                        <th className="p-2.5">X</th>
                        <th className="p-2.5">Y</th>
                        <th className="p-2.5">Scale</th>
                        <th className="p-2.5">Rotation (°)</th>
                        <th className="p-2.5">Layer</th>
                        <th className="p-2.5">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2a2a2a] bg-[#1e1e1e]">
                      {filteredInstances.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-4 text-center text-[#666]">
                            No block instances placed on sheet. Use the "Insert" buttons above or
                            Block tool (K) to place one.
                          </td>
                        </tr>
                      ) : (
                        filteredInstances.map((inst) => (
                          <tr key={inst.id} className="hover:bg-[#252526]">
                            <td className="p-2.5 text-[#888]">#{inst.id}</td>
                            <td className="p-2.5 font-mono text-[#f4902c]">{inst.blockName}</td>
                            <td className="p-2.5">
                              <input
                                type="number"
                                step="0.5"
                                value={inst.x}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  store.edit(() => {
                                    inst.x = val;
                                    return true;
                                  });
                                }}
                                className="w-16 rounded border border-[#3c3c3c] bg-[#141414] px-1 py-0.5 text-white"
                              />
                            </td>
                            <td className="p-2.5">
                              <input
                                type="number"
                                step="0.5"
                                value={inst.y}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  store.edit(() => {
                                    inst.y = val;
                                    return true;
                                  });
                                }}
                                className="w-16 rounded border border-[#3c3c3c] bg-[#141414] px-1 py-0.5 text-white"
                              />
                            </td>
                            <td className="p-2.5">
                              <input
                                type="number"
                                step="0.1"
                                value={inst.scale}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 1;
                                  store.edit(() => {
                                    inst.scale = val;
                                    return true;
                                  });
                                }}
                                className="w-14 rounded border border-[#3c3c3c] bg-[#141414] px-1 py-0.5 text-white"
                              />
                            </td>
                            <td className="p-2.5">
                              <input
                                type="number"
                                step="15"
                                value={inst.rotation}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  store.edit(() => {
                                    inst.rotation = val;
                                    return true;
                                  });
                                }}
                                className="w-14 rounded border border-[#3c3c3c] bg-[#141414] px-1 py-0.5 text-white"
                              />
                            </td>
                            <td className="p-2.5">
                              <select
                                value={inst.layerId}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  store.edit(() => {
                                    inst.layerId = val;
                                    return true;
                                  });
                                }}
                                className="rounded border border-[#3c3c3c] bg-[#141414] px-2 py-0.5 text-white"
                              >
                                {layers.map((l) => (
                                  <option key={l.id} value={l.id}>
                                    {l.name}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="p-2.5 flex items-center gap-1.5">
                              <button
                                onClick={() => handleExplodeBlock(inst.id)}
                                className="rounded bg-amber-900/40 px-2 py-0.5 text-amber-300 hover:bg-amber-800"
                                title="Unpack into native editable geometry"
                              >
                                Explode
                              </button>
                              <button
                                onClick={() => {
                                  store.edit(() => {
                                    store.doc.removeBlockInstance(inst.id);
                                    return true;
                                  });
                                }}
                                className="rounded bg-red-900/40 px-2 py-0.5 text-red-300 hover:bg-red-800"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
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
              <div className="rounded border border-[#333] overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-[#2d2d2d] text-[#aaa]">
                    <tr>
                      <th className="p-2.5">ID</th>
                      <th className="p-2.5">Type</th>
                      <th className="p-2.5">Vertices</th>
                      <th className="p-2.5">Opacity</th>
                      <th className="p-2.5">Layer</th>
                      <th className="p-2.5">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2a2a2a] bg-[#1e1e1e]">
                    {fills.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-4 text-center text-[#666]">
                          No fill or hatch regions found. Use the Fill tool (H) or the bar above to
                          create one.
                        </td>
                      </tr>
                    ) : (
                      fills.map((fill) => (
                        <tr key={fill.id} className="hover:bg-[#252526]">
                          <td className="p-2.5 text-[#888]">#{fill.id}</td>
                          <td className="p-2.5">
                            <select
                              value={fill.type}
                              onChange={(e) => {
                                const val = e.target.value as 'solid' | 'hatch';
                                store.edit(() => {
                                  fill.type = val;
                                  return true;
                                });
                              }}
                              className="rounded border border-[#3c3c3c] bg-[#141414] px-2 py-0.5 text-white capitalize"
                            >
                              <option value="solid">Solid</option>
                              <option value="hatch">Hatch</option>
                            </select>
                          </td>
                          <td className="p-2.5 text-[#aaa]">{fill.points.length} vertices</td>
                          <td className="p-2.5">
                            <input
                              type="range"
                              min="0.1"
                              max="1.0"
                              step="0.05"
                              value={fill.opacity ?? 0.35}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                store.edit(() => {
                                  fill.opacity = val;
                                  return true;
                                });
                              }}
                              className="w-24 accent-[#f4902c]"
                            />
                            <span className="ml-2 text-[#888]">
                              {Math.round((fill.opacity ?? 0.35) * 100)}%
                            </span>
                          </td>
                          <td className="p-2.5">
                            <select
                              value={fill.layerId}
                              onChange={(e) => {
                                const val = e.target.value;
                                store.edit(() => {
                                  fill.layerId = val;
                                  return true;
                                });
                              }}
                              className="rounded border border-[#3c3c3c] bg-[#141414] px-2 py-0.5 text-white"
                            >
                              {layers.map((l) => (
                                <option key={l.id} value={l.id}>
                                  {l.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="p-2.5">
                            <button
                              onClick={() => {
                                store.edit(() => {
                                  store.doc.removeFill(fill.id);
                                  return true;
                                });
                              }}
                              className="rounded bg-red-900/40 px-2 py-0.5 text-red-300 hover:bg-red-800"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
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
