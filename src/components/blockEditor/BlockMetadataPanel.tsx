// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
/** BlockMetadataPanel.tsx — The inspector's head: the block's name, description and base point.
 *  Part of BlockEditorModal; reads the editor's state and handlers from `ed`. */
import type { BlockEditorState } from './useBlockEditor';

export function BlockMetadataPanel({ ed }: { ed: BlockEditorState }) {
  const {
    currentBlock, setCurrentBlock,
  } = ed;
  return (
    <>
      {/* Block Metadata */}
      <div className="border-b border-[#333] p-3 space-y-2 bg-[#252526]">
        <div>
          <label className="text-[10px] font-semibold text-[#888] uppercase tracking-wider">
            Block Name
          </label>
          <input
            type="text"
            value={currentBlock.name}
            onChange={(e) => setCurrentBlock({ ...currentBlock, name: e.target.value.toUpperCase() })}
            className="mt-0.5 w-full rounded border border-[#3c3c3c] bg-[#141414] px-2 py-1 font-mono text-sm text-accent font-bold"
          />
        </div>

        <div>
          <label className="text-[10px] font-semibold text-[#888] uppercase tracking-wider">
            Description
          </label>
          <input
            type="text"
            value={currentBlock.description || ''}
            onChange={(e) => setCurrentBlock({ ...currentBlock, description: e.target.value })}
            placeholder="e.g. 10k Resistor symbol"
            className="mt-0.5 w-full rounded border border-[#3c3c3c] bg-[#141414] px-2 py-0.5 text-xs text-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex-1">
            <label className="text-[10px] font-semibold text-[#888] uppercase tracking-wider">
              Base Point X
            </label>
            <input
              type="number"
              step="0.25"
              value={currentBlock.basePoint.x}
              onChange={(e) =>
                setCurrentBlock({
                  ...currentBlock,
                  basePoint: { ...currentBlock.basePoint, x: parseFloat(e.target.value) || 0 },
                })
              }
              className="mt-0.5 w-full rounded border border-[#3c3c3c] bg-[#141414] px-2 py-0.5 text-xs text-white"
            />
          </div>
          <div className="flex-1">
            <label className="text-[10px] font-semibold text-[#888] uppercase tracking-wider">
              Base Point Y
            </label>
            <input
              type="number"
              step="0.25"
              value={currentBlock.basePoint.y}
              onChange={(e) =>
                setCurrentBlock({
                  ...currentBlock,
                  basePoint: { ...currentBlock.basePoint, y: parseFloat(e.target.value) || 0 },
                })
              }
              className="mt-0.5 w-full rounded border border-[#3c3c3c] bg-[#141414] px-2 py-0.5 text-xs text-white"
            />
          </div>
        </div>
      </div>
    </>
  );
}
