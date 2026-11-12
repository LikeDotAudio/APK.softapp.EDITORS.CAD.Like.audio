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
import { ElementsMenu, type ElementsActions } from './menus/ElementsMenu';

type MenuBarProps = ElementsActions;

/**
 * The application header. It owns only "which menu is open" — every dropdown
 * lives in its own file under `menus/`.
 */
export function MenuBar(actions: MenuBarProps) {
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
          {/* the blocks and elements live here, and only here (the owner, 2026-11-11) */}
          <ElementsMenu {...menu('elements')} {...actions} />
        </div>
      </div>
    </div>
  );
}
