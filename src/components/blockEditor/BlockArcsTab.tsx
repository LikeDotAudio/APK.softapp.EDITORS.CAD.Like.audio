// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
/** BlockArcsTab.tsx — Inspector tab Arcs: the block's arcs, paged and editable.
 *  Part of BlockEditorModal; reads the editor's state and handlers from `ed`. */
import type { BlockEditorState } from './useBlockEditor';

export function BlockArcsTab({ ed }: { ed: BlockEditorState }) {
  const {
    arcsPage, setArcsPage, currentBlock, setCurrentBlock, activeTab,
  } = ed;
  return (
    <>
      {/* TAB: Arcs List */}
      {activeTab === 'arcs' && (() => {
        const ARCS_PAGE_SIZE = 50;
        const totalArcsPages = Math.max(1, Math.ceil(currentBlock.arcs.length / ARCS_PAGE_SIZE));
        const currentArcsPage = Math.min(arcsPage, totalArcsPages);
        const pagedArcs = currentBlock.arcs.slice(
          (currentArcsPage - 1) * ARCS_PAGE_SIZE,
          currentArcsPage * ARCS_PAGE_SIZE,
        );

        return (
          <div className="space-y-2">
            {totalArcsPages > 1 && (
              <div className="flex items-center justify-between text-xs text-[#aaa] bg-[#252526] px-2.5 py-1 rounded border border-[#333]">
                <button
                  onClick={() => setArcsPage((p) => Math.max(1, p - 1))}
                  disabled={currentArcsPage <= 1}
                  className="px-2 py-0.5 rounded bg-[#333] hover:bg-[#444] disabled:opacity-30 text-[11px]"
                >
                  ‹ Prev
                </button>
                <span className="font-mono text-[10px] text-accent">
                  Arcs {(currentArcsPage - 1) * ARCS_PAGE_SIZE + 1}–{Math.min(currentArcsPage * ARCS_PAGE_SIZE, currentBlock.arcs.length)} of {currentBlock.arcs.length}
                </span>
                <button
                  onClick={() => setArcsPage((p) => Math.min(totalArcsPages, p + 1))}
                  disabled={currentArcsPage >= totalArcsPages}
                  className="px-2 py-0.5 rounded bg-[#333] hover:bg-[#444] disabled:opacity-30 text-[11px]"
                >
                  Next ›
                </button>
              </div>
            )}
            {currentBlock.arcs.length === 0 ? (
              <p className="text-center text-xs text-[#666] py-6">No arcs in this block.</p>
            ) : (
              pagedArcs.map((a, pIdx) => {
                const idx = (currentArcsPage - 1) * ARCS_PAGE_SIZE + pIdx;
                return (
                  <div
                    key={idx}
                    className="rounded border border-[#333] bg-[#252526] p-2 flex items-center justify-between text-xs"
                  >
                    <div className="grid grid-cols-3 gap-1.5 text-[11px] font-mono">
                      <span>
                        CX: <input
                          type="number"
                          step="0.25"
                          value={a.cx}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            const updated = [...currentBlock.arcs];
                            updated[idx] = { ...a, cx: val };
                            setCurrentBlock({ ...currentBlock, arcs: updated });
                          }}
                          className="w-12 bg-[#141414] border border-[#3c3c3c] rounded px-1"
                        />
                      </span>
                      <span>
                        CY: <input
                          type="number"
                          step="0.25"
                          value={a.cy}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            const updated = [...currentBlock.arcs];
                            updated[idx] = { ...a, cy: val };
                            setCurrentBlock({ ...currentBlock, arcs: updated });
                          }}
                          className="w-12 bg-[#141414] border border-[#3c3c3c] rounded px-1"
                        />
                      </span>
                      <span>
                        R: <input
                          type="number"
                          step="0.1"
                          value={a.r}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0.1;
                            const updated = [...currentBlock.arcs];
                            updated[idx] = { ...a, r: val };
                            setCurrentBlock({ ...currentBlock, arcs: updated });
                          }}
                          className="w-12 bg-[#141414] border border-[#3c3c3c] rounded px-1"
                        />
                      </span>
                      <span>
                        A1: <input
                          type="number"
                          step="15"
                          value={a.a1}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            const updated = [...currentBlock.arcs];
                            updated[idx] = { ...a, a1: val };
                            setCurrentBlock({ ...currentBlock, arcs: updated });
                          }}
                          className="w-12 bg-[#141414] border border-[#3c3c3c] rounded px-1"
                        />
                      </span>
                      <span>
                        A2: <input
                          type="number"
                          step="15"
                          value={a.a2}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            const updated = [...currentBlock.arcs];
                            updated[idx] = { ...a, a2: val };
                            setCurrentBlock({ ...currentBlock, arcs: updated });
                          }}
                          className="w-12 bg-[#141414] border border-[#3c3c3c] rounded px-1"
                        />
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        const updated = currentBlock.arcs.filter((_, i) => i !== idx);
                        setCurrentBlock({ ...currentBlock, arcs: updated });
                      }}
                      className="ml-2 text-red-400 hover:text-red-200"
                    >
                      ✕
                    </button>
                  </div>
                );
              })
            )}
          </div>
        );
      })()}
    </>
  );
}
