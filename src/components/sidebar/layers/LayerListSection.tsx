// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { useState } from 'react';
import type { Layer } from '../../../core/types';
import { useStore } from '../../../state/useStore';
import { useUi } from '../../../state/useUi';
import { LayerContextMenu } from '../../layermenu/LayerContextMenu';
import { PanelSectionTitle } from '../PanelSectionTitle';
import { AddLayerForm } from './AddLayerForm';
import { LayerRow } from './LayerRow';
import { LayerVisibilityActions } from './LayerVisibilityActions';

/** Top half of the sidebar: the layer list and everything that acts on it. */
export function LayerListSection() {
  const store = useStore();
  const { layers, activeLayerId } = useUi();
  const [colorPickerFor, setColorPickerFor] = useState<string | null>(null);
  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; layer: Layer } | null>(null);

  const commitRename = (id: string) => {
    if (editingName.trim() && editingName.trim() !== id) store.renameLayer(id, editingName.trim());
    setEditingLayerId(null);
  };

  const startRename = (layer: Layer) => {
    setEditingLayerId(layer.id);
    setEditingName(layer.name);
  };

  return (
    <div className="flex max-h-[50%] min-h-[220px] flex-1 flex-col border-b border-[#333]">
      <PanelSectionTitle label="Layer List">
        <button
          type="button"
          onClick={() => {
            const name = prompt('New layer name:');
            if (name) store.addLayer(name);
          }}
          className="rounded bg-[#3c3c3c] px-1.5 py-0.5 text-[11px] text-white hover:bg-[#4a4a4a]"
          title="Add Layer"
        >
          +
        </button>
      </PanelSectionTitle>

      <LayerVisibilityActions />
      <AddLayerForm />

      <div className="flex-1 space-y-0.5 overflow-y-auto overflow-x-hidden p-1">
        {layers.map((layer) => (
          <LayerRow
            key={layer.id}
            layer={layer}
            isActive={layer.id === activeLayerId}
            isEditing={editingLayerId === layer.id}
            editingName={editingName}
            colorPickerOpen={colorPickerFor === layer.id}
            onEditingNameChange={setEditingName}
            onCommitRename={() => commitRename(layer.id)}
            onCancelRename={() => setEditingLayerId(null)}
            onStartRename={() => startRename(layer)}
            onToggleColorPicker={() => setColorPickerFor(colorPickerFor === layer.id ? null : layer.id)}
            onColorPicked={() => setColorPickerFor(null)}
            onContextMenu={(e) => {
              e.preventDefault();
              setContextMenu({ x: e.clientX, y: e.clientY, layer });
            }}
          />
        ))}
      </div>

      {contextMenu && (
        <LayerContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          targetLayer={contextMenu.layer}
          onClose={() => setContextMenu(null)}
          onEditLayer={startRename}
          onAddLayerPrompt={() => {
            const name = window.prompt('Enter new layer name:');
            if (name && name.trim()) store.addLayer(name.trim());
          }}
        />
      )}
    </div>
  );
}
