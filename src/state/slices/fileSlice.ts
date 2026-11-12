// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
/** fileSlice.ts — Files and the modals the UI registers: DXF / KiCad / IFC out and in, block editor, library, startup, loading, auto layout.
 *  Bound onto EditorStore's prototype in EditorStore.ts; each method keeps the signature and body it had
 *  in the class (`this` is the store). */
import type { EditorStore } from '../EditorStore';
import type { Units } from '../../core/types';
import { autoLayoutSchematic } from '../../flow/autoLayout';
import { applyChamfers } from '../../flow/autoWire';
import { createFromClipboard } from '../actions/createFromClipboard';
import { exportDxf } from '../actions/exportDxf';
import { exportKicad } from '../actions/exportKicad';
import { openIfcText, saveIfcFile } from '../actions/ifcFile';
import { importDxf } from '../actions/importDxf';
import { loadDxfText } from '../actions/loadDxfText';

export const fileSlice = {
  async exportDxf(this: EditorStore): Promise<void> {
    return await exportDxf(this);
  },

  /** File › Export KiCad: the sheet as a KiCad 9/10 project (.kicad_sch, KLC symbols, sym-lib-table). */
  async exportKicad(this: EditorStore): Promise<void> {
    return await exportKicad(this);
  },

  /** File → Save .ifc: the drawing as IFC4X3_ADD2 (src/io/ifc). */
  async saveIfcFile(this: EditorStore): Promise<void> {
    return await saveIfcFile(this);
  },

  /** File → Open .ifc: an IFC file replaces the drawing (one undo step). */
  async openIfcText(this: EditorStore, text: string, fileName: string): Promise<boolean> {
    return await openIfcText(this, text, fileName);
  },

  openFileDialog(this: EditorStore): void {
    if (this.openFilePicker) {
      this.openFilePicker();
    }
  },

  triggerOpenBlockEditor(this: EditorStore, blockName?: string): void {
    if (this.openBlockEditorModal) {
      this.openBlockEditorModal(blockName);
    }
  },

  triggerOpenSoftappBridge(this: EditorStore, blockName?: string, defaultAppId?: string): void {
    if (this.openSoftappBridgeModal) {
      this.openSoftappBridgeModal(blockName, defaultAppId);
    }
  },

  runAutoLayoutSchematic(this: EditorStore): boolean {
    const success = this.editFlow(() => {
      return autoLayoutSchematic(this.schematic);
    });
    if (success) {
      this.showHint('⚡ Schematic automatically placed and aligned.', 2500);
    } else {
      this.showHint('No schematic placements to layout.', 2000);
    }
    return success;
  },

  runAutoRouteWires(this: EditorStore): boolean {
    const success = this.editFlow(() => {
      let changed = false;
      for (const connector of this.schematic.connectors) {
        if (connector.route && connector.route.length >= 3) {
          connector.route = applyChamfers(connector.route);
          changed = true;
        }
      }
      return changed;
    });
    if (success) {
      this.showHint('⚡ Chamfered 45° vector routes applied to schematic wires.', 2500);
    } else {
      this.showHint('No multi-point connector routes to chamfer.', 2000);
    }
    return success;
  },

  triggerOpenConceptLibrary(this: EditorStore): void {
    if (this.openLibrarySash) {
      this.openLibrarySash();
    }
  },

  triggerOpenStartupModal(this: EditorStore): void {
    if (this.openStartupModal) {
      this.openStartupModal();
    }
  },

  async createFromClipboard(this: EditorStore): Promise<boolean> {
    return await createFromClipboard(this);
  },

  /**
   * Display loading screen with "Opening drawings" and caching status,
   * yielding execution to the browser to ensure the overlay renders before heavy CPU work.
   */
  async showLoading(this: EditorStore, title = 'Opening drawings', subtitle?: string): Promise<void> {
    this.loading = { active: true, title, subtitle };
    this.emit();
    await new Promise<void>((resolve) => setTimeout(resolve, 30));
  },

  /** Dismiss the loading screen. */
  hideLoading(this: EditorStore): void {
    this.loading = null;
    this.emit();
  },

  toggleFixedTextSize(this: EditorStore): void {
    this.fixedTextSize = !this.fixedTextSize;
    this.requestDraw();
    this.emit();
    this.showHint(
      this.fixedTextSize ? 'Fixed text size enabled (no zoom scaling).' : 'World scaled text enabled.',
      2500,
    );
  },

  async importDxf(this: EditorStore, file: File): Promise<void> {
    return await importDxf(this, file);
  },

  async loadDxfText(this: EditorStore, text: string,
    filename = 'drawing.dxf',
    sourceUnit?: Units,
    targetUnit?: Units,): Promise<void> {
    return await loadDxfText(this, text, filename, sourceUnit, targetUnit);
  },
};
