// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { useEffect, useState } from 'react';
import type { Point } from '../../core/types';

export interface ContextMenuPosition {
  at: Point | null;
  close: () => void;
}

/** Opens on right-click over the canvas; closes on outside click or Escape. */
export function useContextMenuPosition(): ContextMenuPosition {
  const [at, setAt] = useState<Point | null>(null);

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      if ((e.target as HTMLElement).tagName !== 'CANVAS') return;
      e.preventDefault();
      setAt({ x: e.clientX, y: e.clientY });
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.context-menu')) setAt(null);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAt(null);
    };

    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return { at, close: () => setAt(null) };
}
