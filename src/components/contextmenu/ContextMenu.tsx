// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { useStore } from '../../state/useStore';
import { useUi } from '../../state/useUi';
import { MenuDivider } from '../menubar/MenuDivider';
import { MenuItem } from '../menubar/MenuItem';
import { SendToLayerSubmenu } from './SendToLayerSubmenu';
import { useContextMenuPosition } from './useContextMenuPosition';

/** Right-click menu over the canvas. Rows reuse the header menu primitives. */
export function ContextMenu() {
  const store = useStore();
  const { selectionSize } = useUi();
  const { at, close } = useContextMenuPosition();

  if (!at) return null;

  const run = (action: () => void) => () => {
    action();
    close();
  };
  const hasSelection = selectionSize > 0;

  return (
    <div
      className="context-menu fixed z-50 w-52 select-none rounded border border-[#454545] bg-[#252526] p-1 text-xs text-[#cccccc] shadow-2xl"
      style={{ left: at.x, top: at.y }}
    >
      <MenuItem icon="✋" label="Move / Select" onSelect={run(() => store.setTool('select'))} />
      <MenuDivider />
      <MenuItem icon="✂️" label="Cut" shortcut="Ctrl+X" disabled={!hasSelection} onSelect={run(() => store.cutSelection())} />
      <MenuItem icon="📋" label="Copy" shortcut="Ctrl+C" disabled={!hasSelection} onSelect={run(() => store.copySelection())} />
      <MenuItem
        icon="🎯"
        label="Copy from point"
        shortcut="Ctrl+Shift+C"
        disabled={!hasSelection}
        onSelect={run(() => store.copySelectionWithReference())}
      />
      <MenuItem icon="📌" label="Paste" shortcut="Ctrl+V" onSelect={run(() => store.pasteClipboard())} />
      <MenuItem icon="🗑️" label="Delete" shortcut="Del" disabled={!hasSelection} onSelect={run(() => store.deleteSelection())} />
      <MenuDivider />
      <MenuItem
        icon="📦"
        label="Group Elements"
        shortcut="GP"
        disabled={selectionSize <= 1}
        onSelect={run(() => store.groupSelection())}
      />
      <MenuItem
        icon="💥"
        label="Ungroup / Explode"
        shortcut="XP"
        disabled={!hasSelection}
        onSelect={run(() => store.explodeSelection())}
      />
      <MenuDivider />
      <SendToLayerSubmenu onDone={close} />
      <MenuDivider />
      <MenuItem icon="🔍" label="Zoom to Fit Extent" onSelect={run(() => store.zoomToFit())} />
      <MenuItem icon="🔳" label="Select All" shortcut="Ctrl+A" onSelect={run(() => store.selectAll())} />
      <MenuItem icon="🔲" label="Deselect All" shortcut="Esc" onSelect={run(() => store.deselectAll())} />
    </div>
  );
}
