// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { useId, useMemo, useRef, useState } from 'react';
import type { CadViewport } from '../../core/types';
import { useStore } from '../../state/useStore';
import { useUi } from '../../state/useUi';

/**
 * Bottom tabs strip (AutoCAD Model / Layout Tabs style).
 * Offers:
 * - "ALL" tab to view entire Model Space extents.
 * - Discovered sheet tabs to zoom directly to individual sheets.
 * - Searchable jump-to-sheet popup menu for drawings with dozens/hundreds of sheets.
 */
export function ViewportTabs() {
  const store = useStore();
  const { viewports, activeViewportId } = useUi();
  const [showSearch, setShowSearch] = useState(false);
  const [query, setQuery] = useState('');
  const tabsScrollRef = useRef<HTMLDivElement>(null);
  const searchInputId = useId();

  const filteredSheets = useMemo(() => {
    if (!query.trim()) return viewports;
    const q = query.toLowerCase();
    return viewports.filter(
      (v) => v.name.toLowerCase().includes(q) || (v.subtitle && v.subtitle.toLowerCase().includes(q)),
    );
  }, [viewports, query]);

  const handleSelectViewport = (id: string) => {
    store.setActiveViewport(id);
    setShowSearch(false);
  };

  const handleScroll = (delta: number) => {
    if (tabsScrollRef.current) {
      tabsScrollRef.current.scrollBy({ left: delta, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative flex h-[30px] shrink-0 items-stretch border-t border-[#333] bg-[#1a1a1a] select-none font-sans text-xs">
      {/* Search / Sheets dropdown toggle button */}
      {viewports.length > 0 && (
        <div className="flex items-center border-r border-[#333] px-2 bg-[#222]">
          <button
            onClick={() => setShowSearch((prev) => !prev)}
            className="flex items-center gap-1.5 rounded px-2 py-1 text-[11px] font-semibold text-[#8b949e] hover:bg-[#333] hover:text-white transition-colors"
            title="Search and jump to any discovered sheet"
          >
            <span>📑</span>
            <span>Sheets ({viewports.length})</span>
            <span className="text-[9px]">▾</span>
          </button>
        </div>
      )}

      {/* Scroll Left Button */}
      {viewports.length > 6 && (
        <button
          onClick={() => handleScroll(-200)}
          className="flex w-6 items-center justify-center border-r border-[#333] text-[#777] hover:bg-[#252526] hover:text-white"
          title="Scroll tabs left"
        >
          ◀
        </button>
      )}

      {/* Tabs Container */}
      <div
        ref={tabsScrollRef}
        onWheel={(e) => {
          if (tabsScrollRef.current && e.deltaY) {
            tabsScrollRef.current.scrollLeft += e.deltaY;
          }
        }}
        className="flex flex-1 items-stretch overflow-x-auto no-scrollbar scroll-smooth"
      >
        {/* Model Space / ALL Tab */}
        <button
          onClick={() => handleSelectViewport('ALL')}
          className={`flex items-center gap-1 px-3 py-1 text-xs font-medium transition-colors border-r border-[#333] whitespace-nowrap cursor-pointer ${
            activeViewportId === 'ALL'
              ? 'bg-[#1f6feb] text-white font-bold border-b-2 border-white'
              : 'bg-[#21262d] text-[#8b949e] hover:bg-[#2c333d] hover:text-white'
          }`}
          title="ALL: Fit all drawings and entire Model Space"
        >
          <span className="text-sm">🌐</span>
          <span>ALL (Model Space)</span>
        </button>

        {/* Individual Sheet Tabs */}
        {viewports.map((vp: CadViewport) => {
          const isActive = activeViewportId === vp.id;
          return (
            <button
              key={vp.id}
              onClick={() => handleSelectViewport(vp.id)}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-mono transition-colors border-r border-[#333] whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-[#2d333b] text-[#58a6ff] font-bold border-b-2 border-[#1f6feb]'
                  : 'bg-[#181a1f] text-[#8b949e] hover:bg-[#22272e] hover:text-[#c9d1d9]'
              }`}
              title={`${vp.name}${vp.subtitle ? ` — ${vp.subtitle}` : ''} [Click to view sheet]`}
            >
              <span className="text-[11px] opacity-70">📐</span>
              <span>{vp.name}</span>
              {vp.subtitle && (
                <span className="max-w-[120px] truncate text-[10px] opacity-50 font-sans">
                  {vp.subtitle}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Scroll Right Button */}
      {viewports.length > 6 && (
        <button
          onClick={() => handleScroll(200)}
          className="flex w-6 items-center justify-center border-l border-[#333] text-[#777] hover:bg-[#252526] hover:text-white"
          title="Scroll tabs right"
        >
          ▶
        </button>
      )}

      {/* Search / Jump Popup */}
      {showSearch && (
        <div className="absolute bottom-[32px] left-2 z-50 flex w-80 flex-col rounded-lg border border-[#444] bg-[#22272e] text-[#c9d1d9] shadow-2xl overflow-hidden animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-[#373e47] bg-[#1c2128] px-3 py-2">
            <span className="font-semibold text-xs text-white">Jump to Sheet / Viewport</span>
            <button
              onClick={() => setShowSearch(false)}
              className="text-[#888] hover:text-white text-xs px-1"
            >
              ✕
            </button>
          </div>
          <div className="p-2 border-b border-[#373e47] bg-[#161b22]">
            <input
              id={searchInputId}
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search sheet name or title..."
              className="w-full rounded bg-[#0d1117] border border-[#30363d] px-2.5 py-1 text-xs text-white placeholder-[#6e7681] focus:outline-none focus:border-[#1f6feb]"
            />
          </div>
          <div className="max-h-64 overflow-y-auto p-1 divide-y divide-[#30363d]/40">
            <button
              onClick={() => handleSelectViewport('ALL')}
              className={`flex w-full items-center justify-between px-3 py-1.5 rounded text-left text-xs transition-colors ${
                activeViewportId === 'ALL'
                  ? 'bg-[#1f6feb] text-white font-bold'
                  : 'hover:bg-[#30363d] text-[#e6edf3]'
              }`}
            >
              <div className="flex items-center gap-2">
                <span>🌐</span>
                <span className="font-semibold">ALL</span>
              </div>
              <span className="text-[10px] opacity-70">Model Space</span>
            </button>
            {filteredSheets.map((vp: CadViewport) => (
              <button
                key={vp.id}
                onClick={() => handleSelectViewport(vp.id)}
                className={`flex w-full items-center justify-between px-3 py-1.5 rounded text-left text-xs transition-colors ${
                  activeViewportId === vp.id
                    ? 'bg-[#1f6feb] text-white font-bold'
                    : 'hover:bg-[#30363d] text-[#e6edf3]'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="opacity-70">📐</span>
                  <span className="font-mono font-medium">{vp.name}</span>
                </div>
                {vp.subtitle && (
                  <span className="ml-2 max-w-[130px] truncate text-[10px] text-[#8b949e]">
                    {vp.subtitle}
                  </span>
                )}
              </button>
            ))}
            {filteredSheets.length === 0 && (
              <div className="py-4 text-center text-xs text-[#8b949e]">
                No matching sheets found.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
