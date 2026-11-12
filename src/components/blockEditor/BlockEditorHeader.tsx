// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
/** BlockEditorHeader.tsx — The top bar: title, the block in hand, and New / Duplicate / Delete / Close.
 *  Part of BlockEditorModal; reads the editor's state and handlers from `ed`. */
import type { BlockEditorState } from './useBlockEditor';

export function BlockEditorHeader({ ed, onClose }: { ed: BlockEditorState; onClose: () => void }) {
  const {
    selectedBlockName, selectedInstance, currentBlock, handleNewBlock, handleDuplicateBlock, handleDeleteBlock, handleInsertOnSheet, handleApplyToDrawing,
    handleSaveAsNewBlock,
  } = ed;
  return (
    <>
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-[#333] bg-[#252526] px-4 py-2.5">
        <div className="flex items-center gap-3">
          <span className="text-xl">🧱</span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-wide">CAD Block Editor</h2>
              <span className="rounded bg-go/30 px-2 py-0.5 text-[11px] font-mono font-semibold text-go-hover border border-go/40">
                BEDIT
              </span>
              <span className="text-xs text-[#888]">Editing definition:</span>
              <span className="font-mono text-sm font-bold text-accent">{currentBlock.name}</span>
            </div>
            <p className="text-[11px] text-[#888]">
              Design symbols, port terminals, insertion base points, and reusable CAD block definitions.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {selectedBlockName === 'ACTIVE_DRAWING' && (
            <>
              <button
                onClick={handleApplyToDrawing}
                className="rounded bg-[#1f6feb] px-3 py-1 text-xs font-semibold text-white hover:bg-[#388bfd] transition-colors shadow-sm"
                title="Apply changes made in block editor back to active drawing canvas"
              >
                Apply to Drawing
              </button>
              <button
                onClick={handleSaveAsNewBlock}
                className="rounded bg-go-deep px-3 py-1 text-xs font-semibold text-white hover:bg-go transition-colors shadow-sm"
                title="Package current drawing into a reusable block definition"
              >
                Save as Block...
              </button>
            </>
          )}
          {selectedInstance && (
            <button
              onClick={handleInsertOnSheet}
              className="rounded bg-[#0e639c] px-3 py-1 text-xs font-semibold text-white hover:bg-[#1177bb] transition-colors shadow-sm"
              title="Insert another copy of this block on canvas"
            >
              + Insert Instance
            </button>
          )}
          <button
            onClick={handleNewBlock}
            className="rounded bg-go-deep px-3 py-1 text-xs font-semibold text-white hover:bg-go transition-colors"
          >
            + New Block
          </button>
          <button
            onClick={handleDuplicateBlock}
            className="rounded border border-[#444] bg-[#2d2d2d] px-3 py-1 text-xs text-white hover:bg-[#383838] transition-colors"
          >
            Duplicate
          </button>
          <button
            onClick={handleDeleteBlock}
            className="rounded bg-red-950/40 border border-red-800/50 px-2.5 py-1 text-xs text-red-300 hover:bg-red-900/60 transition-colors"
          >
            Delete
          </button>
          <button
            onClick={onClose}
            className="ml-3 rounded p-1 text-[#888] hover:bg-[#333] hover:text-white"
          >
            ✕
          </button>
        </div>
      </div>
    </>
  );
}
