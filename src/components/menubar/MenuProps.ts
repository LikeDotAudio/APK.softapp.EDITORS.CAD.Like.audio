// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
/** Every dropdown in the header is driven by the same open/close contract. */
export interface MenuProps {
  open: boolean;
  /** Toggle this menu, closing whichever one was open. */
  onToggle: () => void;
  /** Close all menus — call after acting on a row. */
  onClose: () => void;
}

/** Identifies which header menu is currently open. */
export type MenuId = 'file' | 'edit' | 'modify' | 'dimension' | 'drawing';
