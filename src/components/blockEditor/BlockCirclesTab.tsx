// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
/** BlockCirclesTab.tsx — Inspector tab Circles: the block's circles, paged and editable.
 *  Part of BlockEditorModal; reads the editor's state and handlers from `ed`. */
import type { BlockEditorState } from './useBlockEditor';

export function BlockCirclesTab({ ed }: { ed: BlockEditorState }) {
  const {
    circlesPage, setCirclesPage, currentBlock, setCurrentBlock, activeTab,
  } = ed;
  return (
    <>
      {/* TAB: Circles List */}
      {activeTab === 'circles' && (() => {
        const CIRCLES_PAGE_SIZE = 50;
        const totalCirclesPages = Math.max(1, Math.ceil(currentBlock.circles.length / CIRCLES_PAGE_SIZE));
        const currentCirclesPage = Math.min(circlesPage, totalCirclesPages);
        const pagedCircles = currentBlock.circles.slice(
          (currentCirclesPage - 1) * CIRCLES_PAGE_SIZE,
          currentCirclesPage * CIRCLES_PAGE_SIZE,
        );

        return (
          <div className="space-y-2">
            {totalCirclesPages > 1 && (
              <div className="flex items-center justify-between text-xs text-[#aaa] bg-[#252526] px-2.5 py-1 rounded border border-[#333]">
                <button
                  onClick={() => setCirclesPage((p) => Math.max(1, p - 1))}
                  disabled={currentCirclesPage <= 1}
                  className="px-2 py-0.5 rounded bg-[#333] hover:bg-[#444] disabled:opacity-30 text-[11px]"
                >
                  ‹ Prev
                </button>
                <span className="font-mono text-[10px] text-accent">
                  Circles {(currentCirclesPage - 1) * CIRCLES_PAGE_SIZE + 1}–{Math.min(currentCirclesPage * CIRCLES_PAGE_SIZE, currentBlock.circles.length)} of {currentBlock.circles.length}
                </span>
                <button
                  onClick={() => setCirclesPage((p) => Math.min(totalCirclesPages, p + 1))}
                  disabled={currentCirclesPage >= totalCirclesPages}
                  className="px-2 py-0.5 rounded bg-[#333] hover:bg-[#444] disabled:opacity-30 text-[11px]"
                >
                  Next ›
                </button>
              </div>
            )}
            {currentBlock.circles.length === 0 ? (
              <p className="text-center text-xs text-[#666] py-6">No circles in this block.</p>
            ) : (
              pagedCircles.map((c, pIdx) => {
                const idx = (currentCirclesPage - 1) * CIRCLES_PAGE_SIZE + pIdx;
                return (
                  <div
                    key={idx}
                    className="rounded border border-[#333] bg-[#252526] p-2 flex items-center justify-between text-xs"
                  >
                    <div className="flex gap-2 text-[11px] font-mono">
                      <span>
                        CX: <input
                          type="number"
                          step="0.25"
                          value={c.cx}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            const updated = [...currentBlock.circles];
                            updated[idx] = { ...c, cx: val };
                            setCurrentBlock({ ...currentBlock, circles: updated });
                          }}
                          className="w-14 bg-[#141414] border border-[#3c3c3c] rounded px-1"
                        />
                      </span>
                      <span>
                        CY: <input
                          type="number"
                          step="0.25"
                          value={c.cy}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            const updated = [...currentBlock.circles];
                            updated[idx] = { ...c, cy: val };
                            setCurrentBlock({ ...currentBlock, circles: updated });
                          }}
                          className="w-14 bg-[#141414] border border-[#3c3c3c] rounded px-1"
                        />
                      </span>
                      <span>
                        R: <input
                          type="number"
                          step="0.1"
                          value={c.r}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0.1;
                            const updated = [...currentBlock.circles];
                            updated[idx] = { ...c, r: val };
                            setCurrentBlock({ ...currentBlock, circles: updated });
                          }}
                          className="w-12 bg-[#141414] border border-[#3c3c3c] rounded px-1"
                        />
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        const updated = currentBlock.circles.filter((_, i) => i !== idx);
                        setCurrentBlock({ ...currentBlock, circles: updated });
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
