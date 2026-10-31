// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Layer } from '../../../core/types';
import { useStore } from '@state/useStore';
import { useUi } from '@state/useUi';
import { LayerColorSwatch } from './LayerColorSwatch';

export interface LayerRowProps {
  layer: Layer;
  isActive: boolean;
  isEditing: boolean;
  editingName: string;
  colorPickerOpen: boolean;
  onEditingNameChange: (name: string) => void;
  onCommitRename: () => void;
  onCancelRename: () => void;
  onStartRename: () => void;
  onToggleColorPicker: () => void;
  onColorPicked: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

/** One layer in the list: active dot, visibility, name, its host finish (when a host sent a palette), colour. */
export function LayerRow({
  layer,
  isActive,
  isEditing,
  editingName,
  colorPickerOpen,
  onEditingNameChange,
  onCommitRename,
  onCancelRename,
  onStartRename,
  onToggleColorPicker,
  onColorPicked,
  onContextMenu,
}: LayerRowProps) {
  const store = useStore();
  const { palette } = useUi();
  // a host's finishes — the palette's area materials, not its sized products — grouped as its panel groups them
  const finishes = (palette?.items ?? []).filter((i) => !i.size);
  const groups = [...new Set(finishes.map((i) => i.category))];
  const chosen = finishes.find((i) => i.id === layer.finish);

  return (
    <div
      className={
        'flex cursor-pointer items-center justify-between rounded px-2 py-1 transition-colors ' +
        (isActive ? 'bg-[#f4902c] text-[#1e1e1e]' : 'text-[#cccccc] hover:bg-[#2a2d2e]')
      }
      onClick={() => store.setActiveLayer(layer.id)}
      onContextMenu={onContextMenu}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <div
          className={
            'h-2 w-2 flex-shrink-0 rounded-full transition-transform ' +
            (isActive ? 'scale-125 bg-[#f4902c]' : 'border border-[#666] bg-transparent')
          }
          title={isActive ? 'Active Layer' : 'Click to set active'}
        />

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            store.toggleLayerVisibility(layer.id);
          }}
          className="flex-shrink-0 text-[11px] hover:opacity-100"
        >
          {layer.visible ? '👁️' : '🕶️'}
        </button>

        {isEditing ? (
          <input
            type="text"
            autoFocus
            value={editingName}
            onChange={(e) => onEditingNameChange(e.target.value)}
            onBlur={onCommitRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onCommitRename();
              if (e.key === 'Escape') onCancelRename();
            }}
            className="w-full border border-[#f4902c] bg-[#1e1e1e] px-1 py-0 text-[11px] text-white focus:outline-none"
          />
        ) : (
          <span
            onDoubleClick={(e) => {
              e.stopPropagation();
              onStartRename();
            }}
            className={'truncate font-mono text-[11px] ' + (!layer.visible ? 'line-through opacity-40' : '')}
          >
            {layer.name}
          </span>
        )}
      </div>

      {finishes.length > 0 && (
        <select
          value={layer.finish ?? ''}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => store.setLayerFinish(layer.id, e.target.value || null)}
          title={chosen ? `Finish of everything on ${layer.name}: ${chosen.name}` : `Give ${layer.name} a finish: its walls, ceiling or floor are made of it unless a painted patch says otherwise`}
          className="mr-1 w-[74px] flex-shrink-0 truncate rounded border border-[#3c3c3c] bg-[#1e1e1e] px-0.5 py-0 text-[10px] text-[#cccccc]"
          style={chosen ? { borderColor: chosen.color } : undefined}
        >
          <option value="">— finish —</option>
          {groups.map((g) => (
            <optgroup key={g} label={g}>
              {finishes
                .filter((i) => i.category === g)
                .map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                  </option>
                ))}
            </optgroup>
          ))}
        </select>
      )}

      <LayerColorSwatch
        layerId={layer.id}
        color={layer.color}
        title={`Change color for layer ${layer.name}`}
        open={colorPickerOpen}
        onToggle={onToggleColorPicker}
        onPicked={onColorPicked}
      />
    </div>
  );
}
