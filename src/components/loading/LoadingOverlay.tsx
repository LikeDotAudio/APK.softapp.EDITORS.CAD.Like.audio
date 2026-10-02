// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { useUi } from '../../state/useUi';

/**
 * Loading screen presented when opening huge files or when caching drawing data.
 * Displays "Opening drawings" and the current caching/parsing stage.
 */
export function LoadingOverlay() {
  const { loading } = useUi();

  if (!loading || !loading.active) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md select-none p-4 animate-in fade-in duration-200"
    >
      <div className="flex flex-col items-center max-w-sm w-full mx-4 p-8 rounded-2xl border border-[#3c3c3c] bg-[#1e1e1e] shadow-2xl text-center">
        {/* Animated CAD Crosshair & Compass Scanner */}
        <div className="relative w-20 h-20 mb-6 flex items-center justify-center">
          {/* Outer rotating dashed ring */}
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#388bfd]/80 animate-spin [animation-duration:8s]" />
          {/* Middle pulsing ring */}
          <div className="absolute inset-2 rounded-full border border-[#2ea043]/50 animate-ping [animation-duration:2.5s]" />
          {/* Inner precision circle */}
          <div className="relative w-12 h-12 rounded-full border border-[#58a6ff] bg-[#58a6ff]/10 flex items-center justify-center shadow-inner shadow-[#58a6ff]/20">
            {/* Crosshair lines */}
            <div className="absolute w-16 h-px bg-[#58a6ff]/60" />
            <div className="absolute h-16 w-px bg-[#58a6ff]/60" />
            <span className="text-xl select-none">📐</span>
          </div>
        </div>

        {/* Primary Screen Message: "Opening drawings" */}
        <h2 className="text-xl font-bold text-white tracking-wide">
          {loading.title || 'Opening drawings'}
        </h2>

        {/* Stage Subtitle */}
        <p className="text-xs font-mono text-[#58a6ff] mt-2.5 tracking-normal animate-pulse min-h-[1.25rem]">
          {loading.subtitle || 'Caching drawing data...'}
        </p>

        {/* CAD Animated Progress Bar */}
        <div className="w-full bg-[#2a2a2a] rounded-full h-1.5 mt-5 overflow-hidden border border-[#333]">
          <div className="h-full bg-gradient-to-r from-[#238636] via-[#388bfd] to-[#2ea043] rounded-full animate-pulse w-full" />
        </div>

        {/* Caching Status Pill */}
        <div className="mt-4 flex items-center gap-2 text-[11px] text-[#888]">
          <span className="inline-block w-2 h-2 rounded-full bg-[#2ea043] animate-ping" />
          <span>Caching session to browser memory</span>
        </div>
      </div>
    </div>
  );
}
