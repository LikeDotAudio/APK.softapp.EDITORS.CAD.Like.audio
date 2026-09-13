// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { useEntrance } from '../../shell/EntranceContext';
import { TOOLS } from '../../tools/registry';
import { DrawingToolButton } from './buttons/DrawingToolButton';
import { PaletteGrid } from './PaletteGrid';

/**
 * The drawing tools, in registration order. The Flow, Wire and Group tools
 * belong to the Big Picture entrance only — 07b · Drawing is the sketch, and
 * offering it a block palette it has no panel for would be the
 * two-tiles-one-page problem again, one level down (PLAN-60.07). Group joins
 * them for the same reason and one more: it groups PLACEMENTS, so on a sheet
 * with no placements every drag it accepts would report that the box held
 * nothing.
 */
export function ToolPalette() {
  const { showsFlowPanel } = useEntrance();
  const tools = showsFlowPanel
    ? TOOLS
    : TOOLS.filter((tool) => tool.id !== 'flow' && tool.id !== 'wire' && tool.id !== 'group');

  return (
    <PaletteGrid label="Drawing tools">
      {tools.map((tool) => (
        <DrawingToolButton key={tool.id} tool={tool} />
      ))}
    </PaletteGrid>
  );
}
