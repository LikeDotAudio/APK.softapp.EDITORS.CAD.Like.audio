// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { useStore } from '@state/useStore';
import { useUi } from '@state/useUi';

/**
 * Status bar control pill for Virtual Mirror & Symmetrical CAD Mode.
 * Displays whether Symmetrical Mode is active and X coordinate of mirror.
 */
export function SymmetryPill() {
  const store = useStore();
  const { mirror } = useUi();

  const handleToggle = () => {
    store.toggleSymmetryMode();
  };

  return (
    <button
      onClick={handleToggle}
      className={`flex items-center gap-1.5 rounded px-2 py-0.5 text-[11px] font-sans font-medium transition-all ${
        mirror.enabled
          ? 'bg-[#00f7ff]/20 text-[#00f7ff] border border-[#00f7ff] shadow-[0_0_8px_rgba(0,247,255,0.4)]'
          : 'bg-[#333] text-[#aaa] border border-[#444] hover:bg-[#444] hover:text-white'
      }`}
      title={
        mirror.enabled
          ? `Symmetrical Mode ACTIVE at X = ${mirror.x.toFixed(2)}. Click to toggle off.`
          : 'Click to enable Symmetrical Mode (Virtual Mirror).'
      }
    >
      <span>🪞</span>
      <span>
        {mirror.enabled ? `Mirror: ON (X=${mirror.x.toFixed(1)})` : 'Mirror: OFF'}
      </span>
    </button>
  );
}
