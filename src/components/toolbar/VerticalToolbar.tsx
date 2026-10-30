// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { ToolPalette } from './ToolPalette';

/** Left rail: the drawing tools. Grid and zoom live in the status bar. */
export function VerticalToolbar() {
  return (
    <div
      role="toolbar"
      aria-label="Drawing tools"
      aria-orientation="vertical"
      className="z-10 flex h-full w-7 flex-shrink-0 select-none flex-col border-r border-[#333] bg-[#252526] py-0"
    >
      <div className="flex min-h-0 w-full flex-col items-center overflow-y-auto overflow-x-hidden [scrollbar-width:none]">
        <ToolPalette />
      </div>
    </div>
  );
}
