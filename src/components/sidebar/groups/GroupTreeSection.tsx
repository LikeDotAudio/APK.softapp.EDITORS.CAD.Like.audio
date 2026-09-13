// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { renameGroup, toggleCollapsed, ungroup } from '../../../flow/groups';
import { useStore } from '../../../state/useStore';
import { useUi } from '../../../state/useUi';
import { PanelSectionTitle } from '../PanelSectionTitle';
import { BigPictureStatus } from './BigPictureStatus';

/**
 * THE GROUPS OF GROUPS, as a list you can read.
 *
 * The sheet shows the nesting as boxes inside boxes, which stops being legible
 * about three levels down and on a sheet wider than the window. This is the
 * same tree as an index: indent is depth, and every row says what it holds —
 * `held` counts everything inside including its children's, which is what the
 * box on the sheet actually encloses, and the reason both numbers are shown is
 * that a group of groups holds nothing directly and would otherwise read as
 * empty.
 *
 * Rows are already flat (see `groupRows` in `buildUi`), so this renders as a
 * map and cannot recurse into a malformed tree read off disk.
 */
export function GroupTreeSection() {
  const store = useStore();
  const { groups, flow } = useUi();

  return (
    <div className="flex flex-shrink-0 flex-col border-b border-[#333]">
      <PanelSectionTitle label="Groups">
        <span className="font-mono text-[10px] text-[#777]">
          {flow.groups} group{flow.groups === 1 ? '' : 's'}
        </span>
      </PanelSectionTitle>

      <BigPictureStatus />

      {groups.length === 0 ? (
        <p className="px-2.5 py-2 text-[11px] leading-relaxed text-[#777]">
          Nothing is grouped. Take the <span className="text-[#f4902c]">Group</span> tool (G) and
          drag a box round the blocks that belong together. Enclose a whole group and it nests —
          that is how a group of groups is drawn.
        </p>
      ) : (
        <div className="flex max-h-56 flex-col overflow-y-auto py-1">
          {groups.map((row) => (
            <div
              key={row.id}
              className="group/row flex items-center gap-1.5 px-2.5 py-1 text-[12px] text-[#cccccc] hover:bg-[#2a2d2e]"
              style={{ paddingLeft: 10 + row.depth * 12 }}
            >
              <button
                type="button"
                title={row.collapsed ? 'Unfold on the sheet' : 'Fold shut on the sheet'}
                onClick={() => store.editFlow(() => toggleCollapsed(store.schematic, row.id))}
                className="w-3 flex-shrink-0 font-mono text-[10px] text-[#777] hover:text-white"
              >
                {row.children > 0 ? (row.collapsed ? '▸' : '▾') : '·'}
              </button>

              <button
                type="button"
                title="Rename"
                onClick={() => {
                  const next = window.prompt('Rename this group:', row.name);
                  if (next === null) return;
                  store.editFlow(() => renameGroup(store.schematic, row.id, next));
                }}
                className="flex-1 truncate text-left font-mono text-[11px] text-[#f4902c]"
              >
                {row.name}
              </button>

              <span className="flex-shrink-0 font-mono text-[10px] text-[#777]" title={
                `${row.held} block${row.held === 1 ? '' : 's'} inside · ${row.members} held directly` +
                (row.children > 0 ? ` · ${row.children} group${row.children === 1 ? '' : 's'}` : '')
              }>
                {row.held}
                {row.children > 0 ? `·${row.children}g` : ''}
              </span>

              <button
                type="button"
                title="Ungroup — the contents go to its parent, or to the sheet"
                onClick={() => store.editFlow(() => ungroup(store.schematic, row.id))}
                className="flex-shrink-0 px-1 font-mono text-[11px] text-[#777] opacity-0 hover:text-[#ef4444] group-hover/row:opacity-100"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
