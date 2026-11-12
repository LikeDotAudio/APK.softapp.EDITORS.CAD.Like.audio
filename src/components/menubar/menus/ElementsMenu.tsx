// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { useUi } from '@state/useUi';
import { useDock } from '../../dock/DockContext';
import { MenuBarButton } from '../MenuBarButton';
import { MenuDivider } from '../MenuDivider';
import { MenuDropdown } from '../MenuDropdown';
import { MenuItem } from '../MenuItem';
import type { MenuProps } from '../MenuProps';

export interface ElementsActions {
  onOpenConceptLibrary?: () => void;
  onOpenCatalog?: () => void;
  onOpenBlockEditor?: () => void;
  onOpenElementsEditor?: () => void;
  onOpenBom?: () => void;
  onOpenSpreadsheet?: () => void;
  onOpenWireManager?: () => void;
  onToggleConnectors?: () => void;
  connectorsOpen?: boolean;
}

/**
 * Elements: ▾ — the one home of the blocks and elements (the owner, 2026-11-11:
 * "this is where the blocks and elements shall live"). Every block/element
 * surface opens from here and from nowhere else in the chrome: the library and
 * its catalogue, the editors, the BOM and CellHell, the wire manager, and the
 * Blocks, Connectors and Acoustics palettes (shown or put away).
 */
export function ElementsMenu({ open, onToggle, onClose, ...a }: MenuProps & ElementsActions) {
  const dock = useDock();
  const { palette } = useUi();
  const run = (f?: () => void) => () => {
    onClose();
    f?.();
  };
  const tick = (on: boolean) => (on ? '✓' : '');
  const acousticsAvailable = dock.available.has('palette');
  return (
    <div className="relative">
      <MenuBarButton label="Elements:" open={open} onToggle={onToggle} />
      {open && (
        <MenuDropdown width="w-64">
          <MenuItem icon="📚" label="Library" shortcut="Ctrl+Shift+L" onSelect={run(a.onOpenConceptLibrary)}
                    title="The BIM library: parts, the CAD's concepts and the connector vocabulary — a sash over the drawing (Ctrl+Shift+L; Esc closes)" />
          <MenuItem icon="📖" label="Catalog" onSelect={run(a.onOpenCatalog)}
                    title="The BIM library as an engineering catalogue: category › class, a Visual Catalog or an Engineering Specs Table (ROAD-3603)" />
          <MenuItem icon="🧱" label="Block Editor" onSelect={run(a.onOpenBlockEditor)}
                    title="Open CAD Block Editor (BEDIT) to design and edit reusable component symbols" />
          <MenuItem icon="🔲" label="Elements" onSelect={run(a.onOpenElementsEditor)}
                    title="Open CAD Elements Editor for text annotations, block symbols, and fill patterns" />
          <MenuItem icon="📋" label="BOM" onSelect={run(a.onOpenBom)}
                    title="Open interactive Bill of Materials (BOM) to link, inspect, and export component parts" />
          <MenuItem icon="🔥" label="CellHell" onSelect={run(a.onOpenSpreadsheet)}
                    title="Open CellHell spreadsheet matrix editor for connections, placements, and groups" />
          {a.onOpenWireManager && (
            <MenuItem icon="🧵" label="Wire Manager" onSelect={run(a.onOpenWireManager)}
                      title="Every wire on the drawing, From → To with its net — and the lines that are wires in fact but not declared yet" />
          )}
          <MenuDivider />
          <MenuItem icon="🧩" label="Blocks palette" shortcut={tick(dock.isShown('blocks'))} onSelect={run(() => dock.toggleShown('blocks'))}
                    title="📄 This drawing · 📦 Project · unplaced · 📚 Library — show or put away the Blocks palette" />
          <MenuItem icon="🔌" label="Connectors palette" shortcut={tick(!!a.connectorsOpen)} onSelect={run(a.onToggleConnectors)}
                    title="Show or put away the Connectors palette along the bottom — drag a connector onto a device to give it that port" />
          <MenuItem icon="🔊" label={palette?.title ? `Acoustics — ${palette.title}` : 'Acoustics'} shortcut={tick(dock.isShown('palette'))}
                    disabled={!acousticsAvailable} onSelect={run(() => dock.toggleShown('palette'))}
                    title={acousticsAvailable ? 'Show or put away the acoustic treatments palette' : 'The acoustic treatments palette comes with the Acoustic softapp (it sends its palette to the CAD)'} />
        </MenuDropdown>
      )}
    </div>
  );
}
