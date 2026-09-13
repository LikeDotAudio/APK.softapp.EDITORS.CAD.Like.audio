// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { CATALOG } from '../../../flow/catalog';
import { PORT_SIDES } from '../../../core/types';
import { SIDE_COLOR } from '../../../render/flow/flowColors';
import { useStore } from '../../../state/useStore';
import { useUi } from '../../../state/useUi';
import { PanelSectionTitle } from '../PanelSectionTitle';

/**
 * The Flow set, as a list you place from.
 *
 * The four side dots under each name are the whole convention on the card:
 * every symbol shows which of its four edges are spoken for, so a reader can
 * see that a source has no input before placing one.
 */
export function FlowCatalogSection() {
  const store = useStore();
  const { flow } = useUi();

  return (
    <div className="flex flex-shrink-0 flex-col border-b border-[#333]">
      <PanelSectionTitle label="Flow">
        <span className="font-mono text-[10px] text-[#777]">
          {flow.placements} block{flow.placements === 1 ? '' : 's'} · {flow.connectors} wire
          {flow.connectors === 1 ? '' : 's'}
        </span>
      </PanelSectionTitle>

      <div className="flex flex-col py-1">
        {CATALOG.map((def) => {
          const active = def.id === flow.definitionId;
          return (
            <button
              key={def.id}
              type="button"
              title={def.description}
              onClick={() => store.setFlowDefinition(def.id)}
              className={`flex items-center justify-between px-2.5 py-1.5 text-left text-[12px] ${
                active ? 'bg-[#37373d] text-white' : 'text-[#cccccc] hover:bg-[#2a2d2e]'
              }`}
            >
              <span className="font-mono text-[11px]">{def.name}</span>
              <span className="flex items-center gap-1">
                {PORT_SIDES.map((side) => {
                  const has = def.ports.some((p) => p.side === side);
                  return (
                    <span
                      key={side}
                      title={side}
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: has ? SIDE_COLOR[side] : '#3a3a3a' }}
                    />
                  );
                })}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
