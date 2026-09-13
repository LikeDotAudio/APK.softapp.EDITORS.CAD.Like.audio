// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { MenuBarButton } from '../MenuBarButton';
import { MenuDropdown } from '../MenuDropdown';
import type { MenuProps } from '../MenuProps';
import { GridModeRow } from './drawing/GridModeRow';
import { GridSizeRow } from './drawing/GridSizeRow';
import { ShapeModeRow } from './drawing/ShapeModeRow';
import { SnapToggleRow } from './drawing/SnapToggleRow';
import { UnitsRow } from './drawing/UnitsRow';
import { ZoomToFitRow } from './drawing/ZoomToFitRow';

/** Drawing ▾ — document-wide settings rather than commands. */
export function DrawingMenu({ open, onToggle, onClose }: MenuProps) {
  return (
    <div className="relative">
      <MenuBarButton label="Drawing" open={open} onToggle={onToggle} />
      {open && (
        <MenuDropdown width="w-60" roomy>
          <UnitsRow />
          <GridSizeRow />
          <GridModeRow />
          <SnapToggleRow />
          <ZoomToFitRow onDone={onClose} />
          <div className="border-t border-[#3c3c3c]" />
          <ShapeModeRow />
        </MenuDropdown>
      )}
    </div>
  );
}
