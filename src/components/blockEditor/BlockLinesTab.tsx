// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
/** BlockLinesTab.tsx — Inspector tab Lines: the block's lines, paged and editable.
 *  Part of BlockEditorModal; reads the editor's state and handlers from `ed`. */
import type { BlockEditorState } from './useBlockEditor';

export function BlockLinesTab({ ed }: { ed: BlockEditorState }) {
  const {
    linesPage, setLinesPage, currentBlock, setCurrentBlock, activeTab,
  } = ed;
  return (
    <>
      {/* TAB: Lines List */}
      {activeTab === 'lines' && (() => {
        const LINES_PAGE_SIZE = 50;
        const totalLinesPages = Math.max(1, Math.ceil(currentBlock.lines.length / LINES_PAGE_SIZE));
        const currentLinesPage = Math.min(linesPage, totalLinesPages);
        const pagedLines = currentBlock.lines.slice(
          (currentLinesPage - 1) * LINES_PAGE_SIZE,
          currentLinesPage * LINES_PAGE_SIZE,
        );

        return (
          <div className="space-y-2">
            {totalLinesPages > 1 && (
              <div className="flex items-center justify-between text-xs text-[#aaa] bg-[#252526] px-2.5 py-1 rounded border border-[#333]">
                <button
                  onClick={() => setLinesPage((p) => Math.max(1, p - 1))}
                  disabled={currentLinesPage <= 1}
                  className="px-2 py-0.5 rounded bg-[#333] hover:bg-[#444] disabled:opacity-30 text-[11px]"
                >
                  ‹ Prev
                </button>
                <span className="font-mono text-[10px] text-accent">
                  Lines {(currentLinesPage - 1) * LINES_PAGE_SIZE + 1}–{Math.min(currentLinesPage * LINES_PAGE_SIZE, currentBlock.lines.length)} of {currentBlock.lines.length}
                </span>
                <button
                  onClick={() => setLinesPage((p) => Math.min(totalLinesPages, p + 1))}
                  disabled={currentLinesPage >= totalLinesPages}
                  className="px-2 py-0.5 rounded bg-[#333] hover:bg-[#444] disabled:opacity-30 text-[11px]"
                >
                  Next ›
                </button>
              </div>
            )}
            {currentBlock.lines.length === 0 ? (
              <p className="text-center text-xs text-[#666] py-6">No lines in this block.</p>
            ) : (
              pagedLines.map((line, pIdx) => {
                const idx = (currentLinesPage - 1) * LINES_PAGE_SIZE + pIdx;
                return (
                  <div
                    key={idx}
                    className="rounded border border-[#333] bg-[#252526] p-2 flex items-center justify-between text-xs"
                  >
                    <div className="grid grid-cols-4 gap-1 text-[11px] font-mono">
                      <span>
                        X1: <input
                          type="number"
                          step="0.25"
                          value={line.x1}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            const updated = [...currentBlock.lines];
                            updated[idx] = { ...line, x1: val };
                            setCurrentBlock({ ...currentBlock, lines: updated });
                          }}
                          className="w-12 bg-[#141414] border border-[#3c3c3c] rounded px-1"
                        />
                      </span>
                      <span>
                        Y1: <input
                          type="number"
                          step="0.25"
                          value={line.y1}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            const updated = [...currentBlock.lines];
                            updated[idx] = { ...line, y1: val };
                            setCurrentBlock({ ...currentBlock, lines: updated });
                          }}
                          className="w-12 bg-[#141414] border border-[#3c3c3c] rounded px-1"
                        />
                      </span>
                      <span>
                        X2: <input
                          type="number"
                          step="0.25"
                          value={line.x2}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            const updated = [...currentBlock.lines];
                            updated[idx] = { ...line, x2: val };
                            setCurrentBlock({ ...currentBlock, lines: updated });
                          }}
                          className="w-12 bg-[#141414] border border-[#3c3c3c] rounded px-1"
                        />
                      </span>
                      <span>
                        Y2: <input
                          type="number"
                          step="0.25"
                          value={line.y2}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            const updated = [...currentBlock.lines];
                            updated[idx] = { ...line, y2: val };
                            setCurrentBlock({ ...currentBlock, lines: updated });
                          }}
                          className="w-12 bg-[#141414] border border-[#3c3c3c] rounded px-1"
                        />
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        const updated = currentBlock.lines.filter((_, i) => i !== idx);
                        setCurrentBlock({ ...currentBlock, lines: updated });
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
