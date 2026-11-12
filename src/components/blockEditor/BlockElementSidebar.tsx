// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
/** BlockElementSidebar.tsx — The left column: every drawing element and block definition, searched, filtered and paged.
 *  Part of BlockEditorModal; reads the editor's state and handlers from `ed`. */
import type { BlockEditorState } from './useBlockEditor';

export function BlockElementSidebar({ ed }: { ed: BlockEditorState }) {
  const {
    store, selectedItemId, categoryFilter, setCategoryFilter, setSidebarPage, search, setSearch, handleSelectItem,
    allElementsList, filteredElements, categoryCounts, totalSidebarPages, currentSidebarPage, pagedSidebarElements,
  } = ed;
  return (
    <>
      {/* 1. Left Catalog Sidebar (All Elements in Drawings + Block Definitions) */}
      <div className="w-72 border-r border-[#333] bg-[#181818] flex flex-col overflow-hidden">
        {/* Search Box */}
        <div className="p-2 border-b border-[#333]">
          <input
            type="text"
            placeholder="Search elements & blocks..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSidebarPage(1);
            }}
            className="w-full rounded border border-[#3c3c3c] bg-[#141414] px-2 py-1 text-xs text-white placeholder-[#777]"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex border-b border-[#2d2d2d] bg-[#1f1f1f] p-1 gap-1 text-[11px]">
          {(['all', 'drawing', 'blocks', 'instances'] as const).map((cat) => {
            const count = categoryCounts[cat];

            return (
              <button
                key={cat}
                onClick={() => {
                  setCategoryFilter(cat);
                  setSidebarPage(1);
                }}
                className={`flex-1 rounded py-1 text-center font-medium capitalize transition-colors ${
                  categoryFilter === cat
                    ? 'bg-[#0e639c] text-white shadow-xs'
                    : 'text-[#888] hover:bg-[#2a2a2a] hover:text-[#ccc]'
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>

        {/* List of Drawing Elements and Blocks */}
        <div className="flex-1 overflow-y-auto p-1.5 space-y-1">
          {filteredElements.length === 0 ? (
            <div className="p-4 text-center text-xs text-[#777]">
              No matching elements found.
            </div>
          ) : (
            pagedSidebarElements.map((item) => {
              const active = item.id === selectedItemId;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectItem(item)}
                  className={`w-full text-left rounded-md px-2.5 py-1.5 text-xs transition-all flex items-start gap-2 border ${
                    active
                      ? 'bg-[#0e639c] text-white border-[#1177bb] shadow-sm'
                      : 'border-transparent text-[#bbb] hover:bg-[#252526] hover:text-white'
                  }`}
                >
                  <span className="text-sm mt-0.5 select-none">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-mono font-semibold truncate text-[11px] leading-tight">
                        {item.name}
                      </span>
                      <span
                        className={`shrink-0 px-1 py-0.2 rounded text-[9px] font-mono border ${item.badgeStyle}`}
                      >
                        {item.badge}
                      </span>
                    </div>
                    <div className="text-[10px] text-[#888] truncate mt-0.5">
                      {item.detail}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Sidebar Pagination Bar if multi-page */}
        {totalSidebarPages > 1 && (
          <div className="border-t border-[#2d2d2d] bg-[#1a1a1a] px-2 py-1 flex items-center justify-between text-[11px] text-[#aaa]">
            <button
              onClick={() => setSidebarPage((p) => Math.max(1, p - 1))}
              disabled={currentSidebarPage <= 1}
              className="rounded px-2 py-0.5 bg-[#252526] hover:bg-[#333] disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ‹ Prev
            </button>
            <span className="font-mono text-[10px] text-accent">
              Page {currentSidebarPage} / {totalSidebarPages}
            </span>
            <button
              onClick={() => setSidebarPage((p) => Math.min(totalSidebarPages, p + 1))}
              disabled={currentSidebarPage >= totalSidebarPages}
              className="rounded px-2 py-0.5 bg-[#252526] hover:bg-[#333] disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next ›
            </button>
          </div>
        )}

        {/* Sidebar Summary Footer */}
        <div className="border-t border-[#2d2d2d] bg-[#141414] px-2.5 py-1.5 text-[10px] text-[#777] flex items-center justify-between">
          <span>{allElementsList.length} elements in drawings</span>
          <span className="font-mono text-[#aaa]">
            {store.doc.blockInstances.size} placed inst
          </span>
        </div>
      </div>
    </>
  );
}
