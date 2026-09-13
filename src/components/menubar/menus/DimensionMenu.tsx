// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { useStore } from '../../../state/useStore';
import { MenuBarButton } from '../MenuBarButton';
import { MenuDivider } from '../MenuDivider';
import { MenuDropdown } from '../MenuDropdown';
import { MenuItem } from '../MenuItem';
import type { MenuProps } from '../MenuProps';

/** Dimension ▾ — every entry currently arms the measure tool. */
export function DimensionMenu({ open, onToggle, onClose }: MenuProps) {
  const store = useStore();
  const measure = () => {
    onClose();
    store.setTool('measure');
  };

  return (
    <div className="relative">
      <MenuBarButton label="Dimension" open={open} onToggle={onToggle} />
      {open && (
        <MenuDropdown width="w-56" scroll>
          <MenuItem icon="📏" label="Aligned" shortcut="DA" onSelect={measure} />
          <MenuItem icon="↔️" label="Horizontal" shortcut="DH" onSelect={measure} />
          <MenuItem icon="↕️" label="Vertical" shortcut="DV" onSelect={measure} />
          <MenuDivider />
          <MenuItem icon="⭕" label="Radial" shortcut="DR" onSelect={measure} />
          <MenuItem icon="⌀" label="Diametric" shortcut="DD" onSelect={measure} />
          <MenuItem icon="📐" label="Angular" shortcut="DN" onSelect={measure} />
        </MenuDropdown>
      )}
    </div>
  );
}
