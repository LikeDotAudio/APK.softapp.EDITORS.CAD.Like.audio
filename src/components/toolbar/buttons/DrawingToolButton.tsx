// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { useStore } from '../../../state/useStore';
import { useUi } from '../../../state/useUi';
import type { AnyTool } from '../../../tools/types';
import { PaletteButton } from '../PaletteButton';

export interface DrawingToolButtonProps {
  tool: AnyTool;
}

/** One registry tool in the palette. Its icon and title come from the tool file. */
export function DrawingToolButton({ tool }: DrawingToolButtonProps) {
  const store = useStore();
  const { toolId } = useUi();

  return (
    <PaletteButton title={tool.title} active={tool.id === toolId} onSelect={() => store.setTool(tool.id)}>
      <div className="h-4 w-4">{tool.icon}</div>
    </PaletteButton>
  );
}
