// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Layer } from '../../core/types';
import { useStore } from '@state/useStore';
import { MenuDivider } from '../menubar/MenuDivider';
import { MenuItem } from '../menubar/MenuItem';
import { LayerMenuHeader } from './LayerMenuHeader';
import { useLayerMenuDismiss } from './useLayerMenuDismiss';

export interface LayerContextMenuProps {
  x: number;
  y: number;
  targetLayer: Layer;
  onClose: () => void;
  onEditLayer: (layer: Layer) => void;
  onAddLayerPrompt: () => void;
}

/** Right-click menu on a layer row. Rows reuse the header menu primitives. */
export function LayerContextMenu({
  x,
  y,
  targetLayer,
  onClose,
  onEditLayer,
  onAddLayerPrompt,
}: LayerContextMenuProps) {
  const store = useStore();
  useLayerMenuDismiss(onClose);

  const run = (action: () => void) => () => {
    action();
    onClose();
  };
  const ifc = targetLayer.ifc;
  const isWalls = ifc?.entity === 'IfcWall';
  const wallSize = isWalls ? `${ifc.height_mm ?? '?'} × ${ifc.thickness_mm ?? '?'} mm` : '';
  const said = (v: boolean | undefined) => (v === undefined ? 'not said' : v ? 'yes' : 'no');
  const external = said(ifc?.isExternal);
  const loadBearing = said(ifc?.loadBearing);
  const rating = (v: string | undefined) => v ?? 'not said';

  return (
    <div
      style={{ top: y, left: x }}
      className="fixed z-50 w-56 select-none rounded-lg border border-[#454545] bg-[#252526] p-1 text-xs text-[#cccccc] shadow-2xl"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <LayerMenuHeader layer={targetLayer} />

      <MenuItem
        icon={targetLayer.visible ? '👁️' : '🕶️'}
        label="Toggle Visibility"
        shortcut="YV"
        onSelect={run(() => store.toggleLayerVisibility(targetLayer.id))}
      />
      <MenuItem
        icon={targetLayer.locked ? '🔒' : '🔓'}
        label="Toggle Lock Status"
        shortcut="YL"
        onSelect={run(() => store.toggleLayerLock(targetLayer.id))}
      />
      <MenuItem icon="📇" label="Show Only Active" shortcut="YO" onSelect={run(() => store.showOnlyActiveLayer())} />
      <MenuItem icon="👁️" label="Show All Layers" shortcut="YS" onSelect={run(() => store.showAllLayers())} />
      <MenuItem icon="👁️‍🗨️" label="Hide All Layers" shortcut="YH" onSelect={run(() => store.hideAllLayers())} />
      <MenuDivider />
      <MenuItem icon="🔒" label="Lock All Layers" shortcut="YK" onSelect={run(() => store.lockAllLayers())} />
      <MenuItem icon="🔓" label="Unlock All Layers" shortcut="YN" onSelect={run(() => store.unlockAllLayers())} />
      <MenuDivider />
      <MenuItem icon="➕" label="Add Layer..." shortcut="YA" onSelect={run(onAddLayerPrompt)} />
      <MenuItem icon="➖" label="Delete Layer" shortcut="YR" onSelect={run(() => store.deleteLayer(targetLayer.id))} />
      <MenuItem icon="✏️" label="Edit Layer..." shortcut="YE" onSelect={run(() => onEditLayer(targetLayer))} />
      <MenuDivider />
      {/* what the IFC export takes this layer's lines to be (ROAD-3581): never guessed */}
      <MenuItem
        icon="🧱"
        label={isWalls ? 'Walls (IfcWall) ✓' : 'Walls (IfcWall)'}
        onSelect={run(() => store.toggleWallLayer(targetLayer.id))}
      />
      {isWalls && (
        <>
          <MenuItem
            icon="📏"
            label={`Wall Size... ${wallSize}`}
            onSelect={run(() => store.promptWallSize(targetLayer.id))}
          />
          <MenuItem
            icon="🌦️"
            label={`External: ${external}`}
            onSelect={run(() => store.cycleWallExternal(targetLayer.id))}
          />
          {/* Pset_WallCommon: only what the user says, never inferred (ROAD-3581) */}
          <MenuItem
            icon="🏗️"
            label={`Load Bearing: ${loadBearing}`}
            onSelect={run(() => store.cycleWallLoadBearing(targetLayer.id))}
          />
          <MenuItem
            icon="🔇"
            label={`Acoustic Rating... ${rating(ifc.acousticRating)}`}
            onSelect={run(() => store.promptWallRating(targetLayer.id, 'acousticRating'))}
          />
          <MenuItem
            icon="🔥"
            label={`Fire Rating... ${rating(ifc.fireRating)}`}
            onSelect={run(() => store.promptWallRating(targetLayer.id, 'fireRating'))}
          />
        </>
      )}
      <MenuDivider />
      <MenuItem
        icon="📐"
        label="Select Layer Entities"
        shortcut="YC"
        onSelect={run(() => store.selectLayerEntities(targetLayer.id))}
      />
      <MenuItem
        icon="📑"
        label="Deselect Layer Entities"
        shortcut="YD"
        onSelect={run(() => store.deselectLayerEntities(targetLayer.id))}
      />
    </div>
  );
}
