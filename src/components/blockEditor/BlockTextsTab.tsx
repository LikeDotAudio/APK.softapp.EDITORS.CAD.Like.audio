// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
/** BlockTextsTab.tsx — Inspector tab Texts: the block's texts, paged and editable.
 *  Part of BlockEditorModal; reads the editor's state and handlers from `ed`. */
import type { BlockEditorState } from './useBlockEditor';

export function BlockTextsTab({ ed }: { ed: BlockEditorState }) {
  const {
    textsPage, setTextsPage, currentBlock, setCurrentBlock, activeTab,
  } = ed;
  return (
    <>
      {/* TAB: Texts List */}
      {activeTab === 'texts' && (() => {
        const allTexts = currentBlock.texts ?? [];
        const TEXTS_PAGE_SIZE = 50;
        const totalTextsPages = Math.max(1, Math.ceil(allTexts.length / TEXTS_PAGE_SIZE));
        const currentTextsPage = Math.min(textsPage, totalTextsPages);
        const pagedTexts = allTexts.slice(
          (currentTextsPage - 1) * TEXTS_PAGE_SIZE,
          currentTextsPage * TEXTS_PAGE_SIZE,
        );

        return (
          <div className="space-y-2">
            {totalTextsPages > 1 && (
              <div className="flex items-center justify-between text-xs text-[#aaa] bg-[#252526] px-2.5 py-1 rounded border border-[#333]">
                <button
                  onClick={() => setTextsPage((p) => Math.max(1, p - 1))}
                  disabled={currentTextsPage <= 1}
                  className="px-2 py-0.5 rounded bg-[#333] hover:bg-[#444] disabled:opacity-30 text-[11px]"
                >
                  ‹ Prev
                </button>
                <span className="font-mono text-[10px] text-accent">
                  Texts {(currentTextsPage - 1) * TEXTS_PAGE_SIZE + 1}–{Math.min(currentTextsPage * TEXTS_PAGE_SIZE, allTexts.length)} of {allTexts.length}
                </span>
                <button
                  onClick={() => setTextsPage((p) => Math.min(totalTextsPages, p + 1))}
                  disabled={currentTextsPage >= totalTextsPages}
                  className="px-2 py-0.5 rounded bg-[#333] hover:bg-[#444] disabled:opacity-30 text-[11px]"
                >
                  Next ›
                </button>
              </div>
            )}
            {allTexts.length === 0 ? (
              <p className="text-center text-xs text-[#666] py-6">No text entities in this block.</p>
            ) : (
              pagedTexts.map((t, pIdx) => {
                const idx = (currentTextsPage - 1) * TEXTS_PAGE_SIZE + pIdx;
                return (
                  <div
                    key={idx}
                    className="rounded border border-[#333] bg-[#252526] p-2 flex items-center justify-between text-xs"
                  >
                    <div className="flex-1 space-y-1">
                      <input
                        type="text"
                        value={t.text}
                        onChange={(e) => {
                          const val = e.target.value;
                          const updated = [...(currentBlock.texts ?? [])];
                          updated[idx] = { ...t, text: val };
                          setCurrentBlock({ ...currentBlock, texts: updated });
                        }}
                        className="w-full bg-[#141414] border border-[#3c3c3c] rounded px-1.5 py-0.5 text-white"
                      />
                      <div className="flex gap-2 text-[10px] text-[#888] font-mono">
                        <span>
                          X: <input
                            type="number"
                            step="0.25"
                            value={t.x}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              const updated = [...(currentBlock.texts ?? [])];
                              updated[idx] = { ...t, x: val };
                              setCurrentBlock({ ...currentBlock, texts: updated });
                            }}
                            className="w-12 bg-[#141414] border border-[#3c3c3c] rounded px-1 text-white"
                          />
                        </span>
                        <span>
                          Y: <input
                            type="number"
                            step="0.25"
                            value={t.y}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              const updated = [...(currentBlock.texts ?? [])];
                              updated[idx] = { ...t, y: val };
                              setCurrentBlock({ ...currentBlock, texts: updated });
                            }}
                            className="w-12 bg-[#141414] border border-[#3c3c3c] rounded px-1 text-white"
                          />
                        </span>
                        <span>
                          H: <input
                            type="number"
                            step="0.1"
                            value={t.height}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0.1;
                              const updated = [...(currentBlock.texts ?? [])];
                              updated[idx] = { ...t, height: val };
                              setCurrentBlock({ ...currentBlock, texts: updated });
                            }}
                            className="w-12 bg-[#141414] border border-[#3c3c3c] rounded px-1 text-white"
                          />
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const updated = (currentBlock.texts ?? []).filter((_, i) => i !== idx);
                        setCurrentBlock({ ...currentBlock, texts: updated });
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
