// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
/** editingSlice.ts — Editing: selection, clipboard, undo, transforms, the Virtual Mirror, groups.
 *  Bound onto EditorStore's prototype in EditorStore.ts; each method keeps the signature and body it had
 *  in the class (`this` is the store). */
import type { EditorStore } from '../EditorStore';
import type { VirtualMirror } from '../../core/mirror';
import { cancelBasePointPick } from '../actions/cancelBasePointPick';
import { captureClipboard } from '../actions/captureClipboard';
import { clearAll } from '../actions/clearAll';
import { closeFile } from '../actions/closeFile';
import { copySelection } from '../actions/copySelection';
import { copySelectionWithReference } from '../actions/copySelectionWithReference';
import { cutSelection } from '../actions/cutSelection';
import { deleteSelection } from '../actions/deleteSelection';
import { deselectAll } from '../actions/deselectAll';
import { explodeSelection } from '../actions/explodeSelection';
import { finishBasePointPick } from '../actions/finishBasePointPick';
import { flipHorizontalSelection } from '../actions/flipHorizontalSelection';
import { flipVerticalSelection } from '../actions/flipVerticalSelection';
import { groupSelection } from '../actions/groupSelection';
import { pasteClipboard } from '../actions/pasteClipboard';
import { mirrorAnotherMirror } from '../actions/mirrorAnotherMirror';
import { reflectSelectionAcrossMirror } from '../actions/reflectSelectionAcrossMirror';
import { rotateSelectionPrompt } from '../actions/rotateSelectionPrompt';
import { scaleSelectionPrompt } from '../actions/scaleSelectionPrompt';
import { selectAll } from '../actions/selectAll';
import { selectVirtualMirror } from '../actions/selectVirtualMirror';
import { setVirtualMirror } from '../actions/setVirtualMirror';
import { toggleSymmetryMode } from '../actions/toggleSymmetryMode';
import { undo } from '../actions/undo';

export const editingSlice = {
  // ----------------------------------------------------------------- editing

  selectAll(this: EditorStore): void {
    selectAll(this);
  },

  deselectAll(this: EditorStore): void {
    deselectAll(this);
  },

  copySelection(this: EditorStore): void {
    copySelection(this);
  },

  /**
   * AutoCAD-style copy with base point: the next click names the reference point,
   * and paste puts that exact point under the cursor instead of the bbox centre.
   */
  copySelectionWithReference(this: EditorStore): void {
    copySelectionWithReference(this);
  },

  cancelBasePointPick(this: EditorStore): void {
    cancelBasePointPick(this);
  },

  finishBasePointPick(this: EditorStore): void {
    finishBasePointPick(this);
  },

  /** Store the selection in the clipboard, relative to the given world origin. */
  captureClipboard(this: EditorStore, cx: number, cy: number): number {
    return captureClipboard(this, cx, cy);
  },

  cutSelection(this: EditorStore): void {
    cutSelection(this);
  },

  pasteClipboard(this: EditorStore): void {
    pasteClipboard(this);
  },

  deleteSelection(this: EditorStore): void {
    deleteSelection(this);
  },

  undo(this: EditorStore): void {
    undo(this);
  },

  clearAll(this: EditorStore): void {
    clearAll(this);
  },

  async closeFile(this: EditorStore): Promise<void> {
    return await closeFile(this);
  },

  rotateSelectionPrompt(this: EditorStore): void {
    rotateSelectionPrompt(this);
  },

  scaleSelectionPrompt(this: EditorStore): void {
    scaleSelectionPrompt(this);
  },

  flipHorizontalSelection(this: EditorStore): void {
    flipHorizontalSelection(this);
  },

  flipVerticalSelection(this: EditorStore): void {
    flipVerticalSelection(this);
  },

  setVirtualMirror(this: EditorStore, x: number, enabled = true, selected = true): void {
    setVirtualMirror(this, x, enabled, selected);
  },

  toggleSymmetryMode(this: EditorStore): boolean {
    return toggleSymmetryMode(this);
  },

  selectVirtualMirror(this: EditorStore, selected: boolean): void {
    selectVirtualMirror(this, selected);
  },

  reflectSelectionAcrossMirror(this: EditorStore): void {
    reflectSelectionAcrossMirror(this);
  },

  mirrorAnotherMirror(this: EditorStore): VirtualMirror[] {
    return mirrorAnotherMirror(this);
  },

  groupSelection(this: EditorStore): void {
    groupSelection(this);
  },

  explodeSelection(this: EditorStore): void {
    explodeSelection(this);
  },
};
