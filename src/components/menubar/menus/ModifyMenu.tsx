// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { useStore } from '../../../state/useStore';
import { MenuBarButton } from '../MenuBarButton';
import { MenuDivider } from '../MenuDivider';
import { MenuDropdown } from '../MenuDropdown';
import { MenuItem } from '../MenuItem';
import type { MenuProps } from '../MenuProps';

/** Modify ▾ — the QCAD-style transform commands. */
export function ModifyMenu({ open, onToggle, onClose }: MenuProps) {
  const store = useStore();
  const run = (action: () => void) => () => {
    onClose();
    action();
  };

  return (
    <div className="relative">
      <MenuBarButton label="Modify" open={open} onToggle={onToggle} />
      {open && (
        <MenuDropdown width="w-56" scroll>
          <MenuItem icon="↔️" label="Move / Copy" shortcut="MV" onSelect={run(() => store.setTool('select'))} />
          <MenuItem icon="🔄" label="Rotate..." shortcut="RO" onSelect={run(() => store.rotateSelectionPrompt())} />
          <MenuItem icon="📐" label="Scale..." shortcut="SZ" onSelect={run(() => store.scaleSelectionPrompt())} />
          <MenuDivider />
          <MenuItem
            icon="↔️"
            label="Flip Horizontal"
            shortcut="FH"
            onSelect={run(() => store.flipHorizontalSelection())}
          />
          <MenuItem
            icon="↕️"
            label="Flip Vertical"
            shortcut="FV"
            onSelect={run(() => store.flipVerticalSelection())}
          />
          <MenuDivider />
          <MenuItem icon="📏" label="Offset (Parallel)" shortcut="OF" onSelect={run(() => store.setTool('parallel'))} />
          <MenuItem
            icon="✂️"
            label="Trim / Break Segment"
            shortcut="RM"
            onSelect={run(() => store.setTool('break'))}
          />
          <MenuDivider />
          <MenuItem icon="💥" label="Explode Groups" shortcut="XP" onSelect={run(() => store.explodeSelection())} />
          <MenuItem
            icon="🧱"
            label="Create Block from Selection"
            shortcut="CB"
            onSelect={run(() => {
              if (store.selection.size === 0) {
                store.showHint('Select geometry first to create a block.', 2500);
                return;
              }
              const name = window.prompt('Enter block name:', 'CUSTOM_BLOCK');
              if (!name) return;
              store.edit(() => store.doc.createBlockFromSelection(name, store.selection) !== null);
              store.showHint(`Created block "${name}".`, 2000);
            })}
          />
          <MenuItem icon="📥" label="Insert CAD Block..." shortcut="K" onSelect={run(() => store.setTool('block'))} />
        </MenuDropdown>
      )}
    </div>
  );
}
