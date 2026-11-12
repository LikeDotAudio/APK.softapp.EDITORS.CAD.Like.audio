// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
/** layerSlice.ts — Layers: visibility, locks, colours, finishes, IFC walls and rooms, selection layer.
 *  Bound onto EditorStore's prototype in EditorStore.ts; each method keeps the signature and body it had
 *  in the class (`this` is the store). */
import type { EditorStore } from '../EditorStore';
import type { CadSpace, LayerIfc } from '../../core/types';
import { addLayer } from '../actions/addLayer';
import { deleteLayer } from '../actions/deleteLayer';
import { deselectLayerEntities } from '../actions/deselectLayerEntities';
import { hideAllLayers } from '../actions/hideAllLayers';
import { lockAllLayers } from '../actions/lockAllLayers';
import { renameLayer } from '../actions/renameLayer';
import { selectLayerEntities } from '../actions/selectLayerEntities';
import { setActiveLayer } from '../actions/setActiveLayer';
import { setLayerColor } from '../actions/setLayerColor';
import { setLayerFinish } from '../actions/setLayerFinish';
import { cycleWallExternal, cycleWallLoadBearing, declareRoomFromSelection, promptWallRating, promptWallSize, setLayerIfc, toggleWallLayer, undeclareRoomsInSelection, type WallRating } from '../actions/roomsAndWalls';
import { setLayerStyle, type LayerStyle } from '../actions/setLayerStyle';
import { setSelectionLayer } from '../actions/setSelectionLayer';
import { setSelectionProtected } from '../actions/setSelectionProtected';
import { showAllLayers } from '../actions/showAllLayers';
import { showOnlyActiveLayer } from '../actions/showOnlyActiveLayer';
import { toggleLayerLock } from '../actions/toggleLayerLock';
import { toggleLayerVisibility } from '../actions/toggleLayerVisibility';
import { unlockAllLayers } from '../actions/unlockAllLayers';

export const layerSlice = {
  // ------------------------------------------------------------------- layers

  setActiveLayer(this: EditorStore, id: string): void {
    setActiveLayer(this, id);
  },

  addLayer(this: EditorStore, name: string, color = '#3b82f6'): void {
    addLayer(this, name, color);
  },

  toggleLayerVisibility(this: EditorStore, id: string): void {
    toggleLayerVisibility(this, id);
  },

  toggleLayerLock(this: EditorStore, id: string): void {
    toggleLayerLock(this, id);
  },

  showOnlyActiveLayer(this: EditorStore): void {
    showOnlyActiveLayer(this);
  },

  showAllLayers(this: EditorStore): void {
    showAllLayers(this);
  },

  hideAllLayers(this: EditorStore): void {
    hideAllLayers(this);
  },

  lockAllLayers(this: EditorStore): void {
    lockAllLayers(this);
  },

  unlockAllLayers(this: EditorStore): void {
    unlockAllLayers(this);
  },

  deleteLayer(this: EditorStore, id: string): void {
    deleteLayer(this, id);
  },

  selectLayerEntities(this: EditorStore, id: string): void {
    selectLayerEntities(this, id);
  },

  deselectLayerEntities(this: EditorStore, id: string): void {
    deselectLayerEntities(this, id);
  },

  setLayerColor(this: EditorStore, id: string, color: string, aci?: number): void {
    setLayerColor(this, id, color, aci);
  },

  setLayerFinish(this: EditorStore, id: string, finish: string | null): void {
    setLayerFinish(this, id, finish);
  },

  // walls and rooms for the IFC export (roomsAndWalls.ts, ROAD-3581)
  setLayerIfc(this: EditorStore, id: string, ifc: LayerIfc | null): void {
    setLayerIfc(this, id, ifc);
  },

  toggleWallLayer(this: EditorStore, id: string): void {
    toggleWallLayer(this, id);
  },

  promptWallSize(this: EditorStore, id: string): void {
    promptWallSize(this, id);
  },

  cycleWallExternal(this: EditorStore, id: string): void {
    cycleWallExternal(this, id);
  },

  /** Layer menu ▸ Load Bearing: Pset_WallCommon.LoadBearing (true → false → not said). */
  cycleWallLoadBearing(this: EditorStore, id: string): void {
    cycleWallLoadBearing(this, id);
  },

  /** Layer menu ▸ Acoustic / Fire Rating...: Pset_WallCommon AcousticRating / FireRating, as written. */
  promptWallRating(this: EditorStore, id: string, key: WallRating): void {
    promptWallRating(this, id, key);
  },

  declareRoomFromSelection(this: EditorStore): CadSpace | null {
    return declareRoomFromSelection(this);
  },

  undeclareRoomsInSelection(this: EditorStore): number {
    return undeclareRoomsInSelection(this);
  },

  setLayerStyle(this: EditorStore, id: string, style: LayerStyle): void {
    setLayerStyle(this, id, style);
  },

  renameLayer(this: EditorStore, id: string, newName: string): void {
    renameLayer(this, id, newName);
  },

  setSelectionLayer(this: EditorStore, layerId: string): void {
    setSelectionLayer(this, layerId);
  },

  setSelectionProtected(this: EditorStore, isProtected: boolean): void {
    setSelectionProtected(this, isProtected);
  },
};
