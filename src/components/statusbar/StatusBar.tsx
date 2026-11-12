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

/**
 * Bottom strip: cursor position, live measurement, validation and edge count on
 * the left; grid mode, zoom, build revision and repository link pinned to the
 * right. One line always: in a narrow host pane it scrolls sideways rather than
 * wrapping.
 */
export function StatusBar() {
  return (
    <div className="flex flex-shrink-0 items-center gap-[18px] overflow-x-auto whitespace-nowrap border-t border-[#333] bg-[#252526] px-4 py-1.5 font-mono text-xs text-[#888] [scrollbar-width:none] [&>*]:flex-shrink-0">
      <CursorReadout />
      <MeasurementReadout />
      <ValidationPill />
      <SymmetryPill />
      <EdgeCountReadout />
      <FlowReadout />

      <div className="ml-auto flex items-center gap-4">
        <GridPalette />
        <ZoomPalette />
        <BuildStamp />
        <RepositoryLink />
      </div>
    </div>
  );
}
