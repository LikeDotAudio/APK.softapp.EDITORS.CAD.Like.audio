// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
/** imageSlice.ts — The tracing image, its calibration, and the type-to-size (dyn) box.
 *  Bound onto EditorStore's prototype in EditorStore.ts; each method keeps the signature and body it had
 *  in the class (`this` is the store). */
import type { EditorStore } from '../EditorStore';
import type { Point } from '../../core/types';
import type { DynUi } from '../UiState';
import type { RecentFileEntry } from '../../io/recentFiles/RecentFileEntry';
import { applyCalibration } from '../actions/applyCalibration';
import { applyLoadedImage } from '../actions/applyLoadedImage';
import { buildDynUi } from '../actions/buildDynUi';
import { cancelCalibration } from '../actions/cancelCalibration';
import { cancelDyn } from '../actions/cancelDyn';
import { closeDynInput } from '../actions/closeDynInput';
import { commitDyn } from '../actions/commitDyn';
import { cycleDynMode } from '../actions/cycleDynMode';
import { dynNumbers } from '../actions/dynNumbers';
import { handleCalibrationClick } from '../actions/handleCalibrationClick';
import { importImage } from '../actions/importImage';
import { loadRecentFile } from '../actions/loadRecentFile';
import { loadRecentImage } from '../actions/loadRecentImage';
import { openDynInput } from '../actions/openDynInput';
import { removeImage } from '../actions/removeImage';
import { resolveDyn } from '../actions/resolveDyn';
import { setDynValue } from '../actions/setDynValue';
import { setImageOpacity } from '../actions/setImageOpacity';
import { setImageWorldWidth } from '../actions/setImageWorldWidth';
import { startCalibration } from '../actions/startCalibration';
import { toggleImageVisible } from '../actions/toggleImageVisible';

export const imageSlice = {
  // ------------------------------------------------------------------- image

  async importImage(this: EditorStore, file: File): Promise<void> {
    return await importImage(this, file);
  },

  async loadRecentImage(this: EditorStore, dataUrl: string): Promise<void> {
    return await loadRecentImage(this, dataUrl);
  },

  applyLoadedImage(this: EditorStore, img: HTMLImageElement): void {
    applyLoadedImage(this, img);
  },

  async loadRecentFile(this: EditorStore, entry: RecentFileEntry): Promise<void> {
    return await loadRecentFile(this, entry);
  },

  removeImage(this: EditorStore): void {
    removeImage(this);
  },

  toggleImageVisible(this: EditorStore): void {
    toggleImageVisible(this);
  },

  setImageOpacity(this: EditorStore, opacity: number): void {
    setImageOpacity(this, opacity);
  },

  setImageWorldWidth(this: EditorStore, width: number): void {
    setImageWorldWidth(this, width);
  },

  // ------------------------------------------------------------- calibration

  startCalibration(this: EditorStore): void {
    startCalibration(this);
  },

  cancelCalibration(this: EditorStore): void {
    cancelCalibration(this);
  },

  handleCalibrationClick(this: EditorStore, screen: Point): void {
    handleCalibrationClick(this, screen);
  },

  /** Rescale everything so the two picked points are `distance` mm apart. */
  applyCalibration(this: EditorStore, distance: number): boolean {
    return applyCalibration(this, distance);
  },

  // --------------------------------------------------------- type-to-size box

  openDynInput(this: EditorStore, anchor: Point): void {
    openDynInput(this, anchor);
  },

  closeDynInput(this: EditorStore): void {
    closeDynInput(this);
  },

  dynNumbers(this: EditorStore): Record<string, number | null> {
    return dynNumbers(this);
  },

  /** The end point implied by whatever is typed, or null when nothing usable is. */
  resolveDyn(this: EditorStore): Point | null {
    return resolveDyn(this);
  },

  buildDynUi(this: EditorStore): DynUi | null {
    return buildDynUi(this);
  },

  setDynValue(this: EditorStore, key: string, raw: string): void {
    setDynValue(this, key, raw);
  },

  cycleDynMode(this: EditorStore): void {
    cycleDynMode(this);
  },

  /** Enter in the dyn box: finish the shape at the typed size. */
  commitDyn(this: EditorStore): void {
    commitDyn(this);
  },

  cancelDyn(this: EditorStore): void {
    cancelDyn(this);
  },
};
