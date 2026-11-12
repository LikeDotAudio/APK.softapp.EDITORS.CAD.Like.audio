// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
/** BlockAttributesTab.tsx — Inspector tab Attributes: the placed instance's UUID, placement and attributes.
 *  Part of BlockEditorModal; reads the editor's state and handlers from `ed`. */
import type { BlockEditorState } from './useBlockEditor';

export function BlockAttributesTab({ ed }: { ed: BlockEditorState }) {
  const {
    store, selectedInstance, setSelectedInstance, copiedUuid, newAttrKey, setNewAttrKey, newAttrVal, setNewAttrVal,
    currentBlock, activeTab, handleInsertOnSheet, handleCopyUuid, handleRegenerateInstanceUuid, handleUpdateInstanceField, handleAddInstanceAttribute, handleDeleteInstanceAttribute,
  } = ed;
  return (
    <>
      {/* TAB: Attributes & UUID */}
      {activeTab === 'attributes' && (
        <div className="space-y-4">
          {selectedInstance ? (
            <div className="space-y-4">
              {/* Instance Header Info */}
              <div className="rounded border border-[#333] bg-[#252526] p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>🏷️</span> Placed Instance
                  </span>
                  <span className="rounded bg-[#0e639c]/30 px-2 py-0.5 text-[10px] font-mono text-[#4fc1ff] border border-[#0e639c]/40">
                    ID: #{selectedInstance.id}
                  </span>
                </div>
                <div className="text-xs text-[#aaa]">
                  Block: <span className="font-mono font-bold text-accent">{selectedInstance.blockName}</span>
                </div>
                <div className="text-xs text-[#aaa]">
                  Layer: <span className="font-mono text-white">{selectedInstance.layerId}</span>
                </div>
              </div>

              {/* UUID Section */}
              <div className="rounded border border-[#333] bg-[#252526] p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-semibold text-[#888] uppercase tracking-wider">
                    Instance UUID
                  </label>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleCopyUuid(selectedInstance.uuid || '')}
                      className="rounded bg-[#2d2d2d] hover:bg-[#383838] px-2 py-0.5 text-[10px] text-[#ccc] border border-[#444] transition-colors"
                      title="Copy UUID to clipboard"
                    >
                      {copiedUuid ? '✓ Copied' : '📋 Copy'}
                    </button>
                    <button
                      onClick={handleRegenerateInstanceUuid}
                      className="rounded bg-[#2d2d2d] hover:bg-[#383838] px-2 py-0.5 text-[10px] text-[#ccc] border border-[#444] transition-colors"
                      title="Regenerate a new UUID for this instance"
                    >
                      🔄 Regenerate
                    </button>
                  </div>
                </div>
                <div className="p-2 rounded bg-[#141414] border border-[#3c3c3c] font-mono text-xs text-[#388bfd] break-all select-all">
                  {selectedInstance.uuid || 'No UUID assigned'}
                </div>
              </div>

              {/* Placement Transforms */}
              <div className="rounded border border-[#333] bg-[#252526] p-3 space-y-2">
                <span className="text-[10px] font-semibold text-[#888] uppercase tracking-wider block">
                  Placement Transforms
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] text-[#888]">Pos X</label>
                    <input
                      type="number"
                      step="0.5"
                      value={selectedInstance.x}
                      onChange={(e) =>
                        handleUpdateInstanceField('x', parseFloat(e.target.value) || 0)
                      }
                      className="mt-0.5 w-full rounded border border-[#3c3c3c] bg-[#141414] px-1.5 py-0.5 font-mono text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#888]">Pos Y</label>
                    <input
                      type="number"
                      step="0.5"
                      value={selectedInstance.y}
                      onChange={(e) =>
                        handleUpdateInstanceField('y', parseFloat(e.target.value) || 0)
                      }
                      className="mt-0.5 w-full rounded border border-[#3c3c3c] bg-[#141414] px-1.5 py-0.5 font-mono text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#888]">Scale</label>
                    <input
                      type="number"
                      step="0.1"
                      value={selectedInstance.scale ?? 1}
                      onChange={(e) =>
                        handleUpdateInstanceField('scale', parseFloat(e.target.value) || 1)
                      }
                      className="mt-0.5 w-full rounded border border-[#3c3c3c] bg-[#141414] px-1.5 py-0.5 font-mono text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#888]">Rotation (°)</label>
                    <input
                      type="number"
                      step="15"
                      value={selectedInstance.rotation ?? 0}
                      onChange={(e) =>
                        handleUpdateInstanceField('rotation', parseFloat(e.target.value) || 0)
                      }
                      className="mt-0.5 w-full rounded border border-[#3c3c3c] bg-[#141414] px-1.5 py-0.5 font-mono text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Custom Attributes Table */}
              <div className="rounded border border-[#333] bg-[#252526] p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>✨</span> Key-Value Attributes
                  </span>
                  <span className="text-[10px] text-[#888]">
                    {Object.keys(selectedInstance.attributes ?? {}).length} custom
                  </span>
                </div>

                {/* List of attributes */}
                {Object.entries(selectedInstance.attributes ?? {}).length === 0 ? (
                  <p className="text-center text-xs text-[#666] py-3">
                    No attributes defined on this instance yet.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {Object.entries(selectedInstance.attributes ?? {}).map(([key, val]) => (
                      <div
                        key={key}
                        className="flex items-center gap-2 rounded bg-[#141414] border border-[#333] px-2 py-1 text-xs"
                      >
                        <span className="font-mono text-accent font-semibold truncate w-1/3" title={key}>
                          {key}:
                        </span>
                        <input
                          type="text"
                          value={val}
                          onChange={(e) => {
                            const nextVal = e.target.value;
                            store.history.push(store.doc.snapshot());
                            store.edit(() => {
                              const inst = store.doc.blockInstances.get(selectedInstance.id);
                              if (inst) {
                                inst.attributes = { ...(inst.attributes ?? {}), [key]: nextVal };
                              }
                              return true;
                            });
                            setSelectedInstance((prev) =>
                              prev
                                ? { ...prev, attributes: { ...(prev.attributes ?? {}), [key]: nextVal } }
                                : null,
                            );
                          }}
                          className="flex-1 bg-[#1e1e1e] border border-[#3c3c3c] rounded px-1.5 py-0.5 text-white font-mono text-[11px]"
                        />
                        <button
                          onClick={() => handleDeleteInstanceAttribute(key)}
                          className="text-red-400 hover:text-red-200 px-1"
                          title="Delete attribute"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Attribute Row */}
                <div className="border-t border-[#333] pt-2 space-y-1.5">
                  <label className="text-[10px] font-semibold text-[#888] uppercase tracking-wider">
                    Add New Attribute
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="Key (e.g. PART_NO)"
                      value={newAttrKey}
                      onChange={(e) => setNewAttrKey(e.target.value)}
                      className="w-1/2 rounded border border-[#3c3c3c] bg-[#141414] px-1.5 py-1 text-xs text-white"
                    />
                    <input
                      type="text"
                      placeholder="Value"
                      value={newAttrVal}
                      onChange={(e) => setNewAttrVal(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddInstanceAttribute();
                      }}
                      className="flex-1 rounded border border-[#3c3c3c] bg-[#141414] px-1.5 py-1 text-xs text-white"
                    />
                    <button
                      onClick={handleAddInstanceAttribute}
                      className="rounded bg-[#0e639c] px-2.5 py-1 text-xs font-semibold text-white hover:bg-[#1177bb] transition-colors"
                    >
                      + Add
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded border border-[#333] bg-[#252526] p-4 text-center space-y-2">
              <span className="text-2xl">📦</span>
              <h4 className="text-xs font-bold text-white">Block Definition Mode</h4>
              <p className="text-[11px] text-[#888] leading-relaxed">
                Select a placed instance from the left sidebar ("Instances" tab) to inspect and edit its unique UUID and custom key-value attributes.
              </p>
              <p className="text-[11px] text-[#888] leading-relaxed">
                Currently viewing definition <span className="font-mono text-accent font-bold">{currentBlock.name}</span>.
              </p>
              <div className="pt-2">
                <button
                  onClick={handleInsertOnSheet}
                  className="rounded bg-[#0e639c] px-3 py-1.5 text-xs text-white hover:bg-[#1177bb] transition-colors"
                >
                  + Place Instance on Canvas
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
