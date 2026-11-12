// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
/** BlockInspectorTabs.tsx — The inspector's tab bar.
 *  Part of BlockEditorModal; reads the editor's state and handlers from `ed`. */
import type { BlockEditorState } from './useBlockEditor';

export function BlockInspectorTabs({ ed }: { ed: BlockEditorState }) {
  const {
    selectedInstance, currentBlock, activeTab, setActiveTab,
  } = ed;
  return (
    <>
      {/* Inspector Tabs */}
      <div className="flex border-b border-[#333] bg-[#1a1a1a] text-xs">
        <button
          onClick={() => setActiveTab('quickAdd')}
          className={`flex-1 py-1.5 font-medium border-b-2 transition-colors ${
            activeTab === 'quickAdd'
              ? 'border-accent text-white bg-[#252526]'
              : 'border-transparent text-[#888] hover:text-[#ccc]'
          }`}
        >
          + Tools
        </button>
        <button
          onClick={() => setActiveTab('lines')}
          className={`flex-1 py-1.5 font-medium border-b-2 transition-colors ${
            activeTab === 'lines'
              ? 'border-accent text-white bg-[#252526]'
              : 'border-transparent text-[#888] hover:text-[#ccc]'
          }`}
        >
          Lines ({currentBlock.lines.length})
        </button>
        <button
          onClick={() => setActiveTab('circles')}
          className={`flex-1 py-1.5 font-medium border-b-2 transition-colors ${
            activeTab === 'circles'
              ? 'border-accent text-white bg-[#252526]'
              : 'border-transparent text-[#888] hover:text-[#ccc]'
          }`}
        >
          Circles ({currentBlock.circles.length})
        </button>
        <button
          onClick={() => setActiveTab('arcs')}
          className={`flex-1 py-1.5 font-medium border-b-2 transition-colors ${
            activeTab === 'arcs'
              ? 'border-accent text-white bg-[#252526]'
              : 'border-transparent text-[#888] hover:text-[#ccc]'
          }`}
        >
          Arcs ({currentBlock.arcs.length})
        </button>
        <button
          onClick={() => setActiveTab('texts')}
          className={`flex-1 py-1.5 font-medium border-b-2 transition-colors ${
            activeTab === 'texts'
              ? 'border-accent text-white bg-[#252526]'
              : 'border-transparent text-[#888] hover:text-[#ccc]'
          }`}
        >
          Text ({(currentBlock.texts ?? []).length})
        </button>
        <button
          onClick={() => setActiveTab('attributes')}
          className={`flex-1 py-1.5 font-medium border-b-2 transition-colors ${
            activeTab === 'attributes'
              ? 'border-accent text-white bg-[#252526]'
              : 'border-transparent text-[#888] hover:text-[#ccc]'
          }`}
          title="UUID and Key-Value Attributes"
        >
          Attrs {selectedInstance ? `(${Object.keys(selectedInstance.attributes ?? {}).length})` : ''}
        </button>
      </div>
    </>
  );
}
