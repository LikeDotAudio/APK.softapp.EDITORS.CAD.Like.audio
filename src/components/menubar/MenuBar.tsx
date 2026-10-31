// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { useCallback, useState } from 'react';
import { AppTitle } from './AppTitle';
import type { MenuId } from './MenuProps';
import { useMenuDismiss } from './useMenuDismiss';
import { DimensionMenu } from './menus/DimensionMenu';
import { DrawingMenu } from './menus/DrawingMenu';
import { EditMenu } from './menus/EditMenu';
import { FileMenu } from './menus/FileMenu';
import { ModifyMenu } from './menus/ModifyMenu';

interface MenuBarProps {
  onOpenSpreadsheet?: () => void;
  onOpenBom?: () => void;
  onOpenElementsEditor?: () => void;
  onOpenBlockEditor?: () => void;
  onOpenConceptLibrary?: () => void;
}

/**
 * The application header. It owns only "which menu is open" — every dropdown
 * lives in its own file under `menus/`.
 */
export function MenuBar({ onOpenSpreadsheet, onOpenBom, onOpenElementsEditor, onOpenBlockEditor, onOpenConceptLibrary }: MenuBarProps) {
  const [openMenu, setOpenMenu] = useState<MenuId | null>(null);
  const close = useCallback(() => setOpenMenu(null), []);
  useMenuDismiss(close);

  const menu = (id: MenuId) => ({
    open: openMenu === id,
    onToggle: () => setOpenMenu(openMenu === id ? null : id),
    onClose: close,
  });

  return (
    <div className="z-30 flex flex-shrink-0 select-none items-center justify-between border-b border-[#333] bg-[#252526] px-4 py-1.5 text-xs text-[#cccccc]">
      <div className="menu-container flex items-center gap-4">
        <AppTitle />
        <div className="flex items-center gap-1">
          <FileMenu {...menu('file')} />
          <EditMenu {...menu('edit')} />
          <ModifyMenu {...menu('modify')} />
          <DimensionMenu {...menu('dimension')} />
          <DrawingMenu {...menu('drawing')} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenConceptLibrary}
          className="flex items-center gap-1.5 rounded bg-[#007acc] px-2.5 py-1 text-xs font-semibold text-white hover:bg-[#1188dd] transition-colors font-mono tracking-wide"
          title="Open Universal Part & Concept Library (connectors, badges, ST 2110, codecs, adapters)"
        >
          <span>📚</span>
          <span>Library</span>
        </button>
        <button
          onClick={onOpenBlockEditor}
          className="flex items-center gap-1.5 rounded bg-[#2ea043] px-2.5 py-1 text-xs font-semibold text-white hover:bg-[#3fb950] transition-colors font-mono tracking-wide"
          title="Open CAD Block Editor (BEDIT) to design and edit reusable component symbols"
        >
          <span>🧱</span>
          <span>Block Editor</span>
        </button>
        <button
          onClick={onOpenElementsEditor}
          className="flex items-center gap-1.5 rounded bg-accent px-2.5 py-1 text-xs font-semibold text-black hover:bg-[#ffa552] transition-colors font-mono tracking-wide"
          title="Open CAD Elements Editor for text annotations, block symbols, and fill patterns"
        >
          <span>🔲</span>
          <span>Elements</span>
        </button>
        <button
          onClick={onOpenBom}
          className="flex items-center gap-1.5 rounded bg-[#9333ea] px-2.5 py-1 text-xs font-semibold text-white hover:bg-[#a855f7] transition-colors font-mono tracking-wide"
          title="Open interactive Bill of Materials (BOM) to link, inspect, and export component parts"
        >
          <span>📋</span>
          <span>BOM</span>
        </button>
        <button
          onClick={onOpenSpreadsheet}
          className="flex items-center gap-1.5 rounded bg-[#0e639c] px-2.5 py-1 text-xs font-semibold text-white hover:bg-[#1177bb] transition-colors font-mono tracking-wide"
          title="Open CellHell spreadsheet matrix editor for connections, placements, and groups"
        >
          <span>🔥</span>
          <span>CellHell</span>
        </button>
      </div>
    </div>
  );
}
