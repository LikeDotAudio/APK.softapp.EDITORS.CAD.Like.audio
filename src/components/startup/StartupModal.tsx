// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { useEffect, useState } from 'react';
import { loadSessionFromBrowser } from '../../io/browserStorage/loadSessionFromBrowser';
import type { SavedSession } from '../../io/browserStorage/SavedSession';
import { useStore } from '../../state/useStore';

interface StartupModalProps {
  onClose: () => void;
}

export function StartupModal({ onClose }: StartupModalProps) {
  const store = useStore();
  const [cachedSession, setCachedSession] = useState<SavedSession | null | undefined>(undefined);
  const [isChecking, setIsChecking] = useState(true);
  const [isPasting, setIsPasting] = useState(false);

  useEffect(() => {
    let active = true;
    void loadSessionFromBrowser().then((session) => {
      if (active) {
        setCachedSession(session);
        setIsChecking(false);
      }
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      active = false;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const handleOpenCached = async () => {
    await store.restoreBrowserSession();
    onClose();
  };

  const handleOpenAnother = () => {
    onClose();
    // Allow modal to unmount before triggering native file picker dialog
    setTimeout(() => {
      store.openFileDialog();
    }, 50);
  };

  const handleCreateFromClipboard = async () => {
    setIsPasting(true);
    try {
      const success = await store.createFromClipboard();
      if (success) {
        onClose();
      }
    } finally {
      setIsPasting(false);
    }
  };

  const handleNewDrawing = () => {
    store.clearAll();
    onClose();
  };

  const hasCachedSession = Boolean(
    cachedSession &&
      ((cachedSession.docSnapshot?.edges?.length ?? 0) > 0 ||
        (cachedSession.docSnapshot?.texts?.length ?? 0) > 0 ||
        (cachedSession.schematic?.placements?.length ?? 0) > 0 ||
        Boolean(cachedSession.tracing)),
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs select-none p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex flex-col w-full max-w-[700px] rounded-xl border border-[#3c3c3c] bg-[#1e1e1e] text-[#cccccc] shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#333] bg-[#252526] px-5 py-3.5">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📐</span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  Welcome to CAD.LIKE.AUDIO
                </h2>
                <span className="rounded bg-[#2ea043]/30 px-2 py-0.5 text-[11px] font-mono font-semibold text-[#3fb950] border border-[#2ea043]/40">
                  STARTUP
                </span>
              </div>
              <p className="text-xs text-[#888]">
                Choose how you would like to begin your drawing session
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-[#888] hover:bg-[#333] hover:text-white transition-colors"
            title="Close (Esc)"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Modal Body / Choices */}
        <div className="p-5 flex flex-col gap-3.5 max-h-[75vh] overflow-y-auto">
          {/* Card 1: Open Cached File */}
          <div
            className={`rounded-lg border p-4 transition-all ${
              hasCachedSession
                ? 'border-[#2ea043]/60 bg-[#252a26] hover:border-[#3fb950] hover:bg-[#28322a]'
                : 'border-[#333] bg-[#232323] opacity-60'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl mt-0.5">💾</span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">Open Cached File</h3>
                    {hasCachedSession && (
                      <span className="rounded bg-[#2ea043]/20 px-1.5 py-0.2 text-[10px] font-mono font-semibold text-[#3fb950] border border-[#2ea043]/30">
                        RECOVERABLE SESSION
                      </span>
                    )}
                  </div>
                  {isChecking ? (
                    <p className="text-xs text-[#888] mt-1">Checking browser storage...</p>
                  ) : hasCachedSession && cachedSession ? (
                    <div className="text-xs text-[#aaa] mt-1 space-y-0.5">
                      <p>
                        <span className="text-[#888]">File: </span>
                        <span className="font-semibold text-white">
                          {cachedSession.currentFileName || 'Untitled Drawing'}
                        </span>
                        <span className="text-[#888] ml-2">Units: </span>
                        <span className="font-mono text-white">
                          {(cachedSession.units || 'in').toUpperCase()}
                        </span>
                      </p>
                      <p>
                        <span className="text-[#888]">Last modified: </span>
                        <span className="text-[#ddd]">
                          {new Date(cachedSession.timestamp).toLocaleString()}
                        </span>
                      </p>
                      <p className="text-[#888]">
                        Entities:{' '}
                        <span className="text-[#ddd]">
                          {cachedSession.docSnapshot?.edges?.length ?? 0} edges,{' '}
                          {cachedSession.docSnapshot?.texts?.length ?? 0} texts
                          {cachedSession.docSnapshot?.blocks?.length
                            ? `, ${cachedSession.docSnapshot.blocks.length} block definitions`
                            : ''}
                          {cachedSession.schematic?.placements?.length
                            ? `, ${cachedSession.schematic.placements.length} Flow blocks`
                            : ''}
                          {cachedSession.tracing ? ', tracing image' : ''}
                        </span>
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-[#888] mt-1">
                      No previous session saved in browser memory.
                    </p>
                  )}
                </div>
              </div>
              <button
                disabled={!hasCachedSession}
                onClick={() => void handleOpenCached()}
                className={`shrink-0 rounded px-3.5 py-2 text-xs font-semibold transition-all ${
                  hasCachedSession
                    ? 'bg-[#238636] text-white hover:bg-[#2ea043] shadow-md shadow-green-950/40 cursor-pointer'
                    : 'bg-[#333] text-[#777] cursor-not-allowed'
                }`}
              >
                Open Cached Drawing →
              </button>
            </div>
          </div>

          {/* Card 2: Open Another File... */}
          <div className="rounded-lg border border-[#3c3c3c] bg-[#252526] p-4 hover:border-[#0969da] hover:bg-[#262c35] transition-all">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl mt-0.5">📂</span>
                <div>
                  <h3 className="text-sm font-bold text-white">Open Another File...</h3>
                  <p className="text-xs text-[#aaa] mt-1">
                    Load an existing DXF drawing (AutoCAD R12–2018) or an image (PNG, JPG) for
                    tracing from your computer.
                  </p>
                </div>
              </div>
              <button
                onClick={handleOpenAnother}
                className="shrink-0 rounded bg-[#1f6feb] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#388bfd] transition-colors shadow-md shadow-blue-950/40 cursor-pointer"
              >
                Browse Files...
              </button>
            </div>
          </div>

          {/* Card 3: Create from Clipboard */}
          <div className="rounded-lg border border-[#3c3c3c] bg-[#252526] p-4 hover:border-[#d29922] hover:bg-[#302b23] transition-all">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl mt-0.5">📋</span>
                <div>
                  <h3 className="text-sm font-bold text-white">Create Drawing from Clipboard</h3>
                  <p className="text-xs text-[#aaa] mt-1">
                    Instantly create a drawing from copied DXF geometry, JSON CAD data, an image, or
                    text notes on your clipboard.
                  </p>
                </div>
              </div>
              <button
                disabled={isPasting}
                onClick={() => void handleCreateFromClipboard()}
                className="shrink-0 rounded bg-[#9e6a03] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#bb8009] transition-colors shadow-md shadow-yellow-950/40 cursor-pointer"
              >
                {isPasting ? 'Reading...' : 'Paste & Create'}
              </button>
            </div>
          </div>

          {/* Card 4: New Blank Drawing */}
          <div className="rounded-lg border border-[#333] bg-[#222223] p-4 hover:border-[#555] hover:bg-[#272728] transition-all">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl mt-0.5">📄</span>
                <div>
                  <h3 className="text-sm font-bold text-white">Start New Blank Drawing</h3>
                  <p className="text-xs text-[#aaa] mt-1">
                    Start drafting immediately on a clean, empty canvas with standard layers and
                    grid settings.
                  </p>
                </div>
              </div>
              <button
                onClick={handleNewDrawing}
                className="shrink-0 rounded border border-[#444] bg-[#2d2d2d] px-3.5 py-2 text-xs font-semibold text-[#ddd] hover:bg-[#383838] hover:text-white transition-colors cursor-pointer"
              >
                New Canvas
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-[#333] bg-[#252526] px-5 py-3 text-xs text-[#888]">
          <span>Tip: Press Esc or click anywhere outside to skip to canvas.</span>
          <button
            onClick={onClose}
            className="rounded px-3 py-1 text-xs text-[#aaa] hover:bg-[#333] hover:text-white transition-colors"
          >
            Skip to Canvas
          </button>
        </div>
      </div>
    </div>
  );
}
