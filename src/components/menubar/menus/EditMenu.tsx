// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { useStore } from '../../../state/useStore';
import { MenuBarButton } from '../MenuBarButton';
import { MenuDivider } from '../MenuDivider';
import { MenuDropdown } from '../MenuDropdown';
import { MenuItem } from '../MenuItem';
import type { MenuProps } from '../MenuProps';

/** Edit ▾ — undo, clipboard, selection and canvas clearing. */
export function EditMenu({ open, onToggle, onClose }: MenuProps) {
  const store = useStore();
  const run = (action: () => void) => () => {
    onClose();
    action();
  };

  return (
    <div className="relative">
      <MenuBarButton label="Edit" open={open} onToggle={onToggle} />
      {open && (
        <MenuDropdown width="w-52">
          <MenuItem icon="↩" label="Undo" shortcut="Ctrl+Z" onSelect={run(() => store.undo())} />
          <MenuDivider />
          <MenuItem icon="✂️" label="Cut" shortcut="Ctrl+X" onSelect={run(() => store.cutSelection())} />
          <MenuItem icon="📋" label="Copy" shortcut="Ctrl+C" onSelect={run(() => store.copySelection())} />
          <MenuItem
            icon="🎯"
            label="Copy from point"
            shortcut="Ctrl+Shift+C"
            onSelect={run(() => store.copySelectionWithReference())}
          />
          <MenuItem icon="📌" label="Paste" shortcut="Ctrl+V" onSelect={run(() => store.pasteClipboard())} />
          <MenuDivider />
          <MenuItem icon="🔳" label="Select All" shortcut="Ctrl+A" onSelect={run(() => store.selectAll())} />
          <MenuItem icon="🔲" label="Deselect All" shortcut="Esc" onSelect={run(() => store.deselectAll())} />
          <MenuItem icon="🗑️" label="Delete Selected" shortcut="Del" onSelect={run(() => store.deleteSelection())} />
          <MenuDivider />
          <MenuItem icon="✕" label="Clear Canvas" onSelect={run(() => store.clearAll())} />
        </MenuDropdown>
      )}
    </div>
  );
}
