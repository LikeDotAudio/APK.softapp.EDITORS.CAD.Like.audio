// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { ValidationPill } from '../ValidationPill';
import { BuildStamp } from './BuildStamp';
import { CursorReadout } from './CursorReadout';
import { EdgeCountReadout } from './EdgeCountReadout';
import { FlowReadout } from './FlowReadout';
import { GridPalette } from './GridPalette';
import { MeasurementReadout } from './MeasurementReadout';
import { RepositoryLink } from './RepositoryLink';
import { SymmetryPill } from './SymmetryPill';
import { ZoomPalette } from './ZoomPalette';

interface StatusBarProps {
  onToggleConnectors?: () => void;
  isConnectorsOpen?: boolean;
}

/**
 * Bottom strip: cursor position, live measurement, validation and edge count on
 * the left; grid mode, zoom, build revision and repository link pinned to the
 * right.
 */
export function StatusBar({ onToggleConnectors, isConnectorsOpen }: StatusBarProps) {
  return (
    <div className="flex flex-shrink-0 items-center gap-[18px] border-t border-[#333] bg-[#252526] px-4 py-1.5 font-mono text-xs text-[#888]">
      <CursorReadout />
      <MeasurementReadout />
      <ValidationPill />
      <SymmetryPill />
      <EdgeCountReadout />
      <FlowReadout />

      {onToggleConnectors && (
        <button
          onClick={onToggleConnectors}
          className={`flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-sans font-medium transition-colors ${
            isConnectorsOpen
              ? 'bg-[#F4902C] text-black font-semibold'
              : 'bg-[#333] text-[#ccc] hover:bg-[#444]'
          }`}
          title="Toggle Connectors Dock"
        >
          <span>🔌</span>
          <span>Connectors</span>
        </button>
      )}

      <div className="ml-auto flex items-center gap-4">
        <GridPalette />
        <ZoomPalette />
        <BuildStamp />
        <RepositoryLink />
      </div>
    </div>
  );
}
