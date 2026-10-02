// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '../EditorStore';
import { restoreSchematic } from '../../flow/Schematic';
import { parseDxf } from '../../io/importDxf/parseDxf';

/**
 * Inspects system clipboard (image blob, DXF text, JSON snapshot, or plain text)
 * and creates a new CAD drawing or places content on the canvas.
 */
export async function createFromClipboard(store: EditorStore): Promise<boolean> {
  await store.showLoading('Opening drawings', 'Reading and caching clipboard data...');
  try {
    // 1. Try reading clipboard items to see if an image is present
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.read) {
      try {
        const items = await navigator.clipboard.read();
        for (const item of items) {
          const imgType = item.types.find((t) => t.startsWith('image/'));
          if (imgType) {
            const blob = await item.getType(imgType);
            const ext = imgType.split('/')[1] || 'png';
            const file = new File([blob], `clipboard_image.${ext}`, { type: imgType });
            await store.importImage(file);
            store.showHint('Imported image from clipboard for tracing.', 3500);
            return true;
          }
        }
      } catch (err) {
        // clipboard.read() might fail if not permitted or if text only, proceed to readText
        console.warn('createFromClipboard: reading clipboard blobs skipped:', err);
      }
    }

    // 2. Try reading clipboard text
    if (typeof navigator === 'undefined' || !navigator.clipboard || !navigator.clipboard.readText) {
      store.showHint('Clipboard access is not supported by your browser.', 4000);
      return false;
    }

    const text = await navigator.clipboard.readText();
    if (!text || !text.trim()) {
      store.showHint('Clipboard is empty. Copy some DXF, an image, or text first.', 4000);
      return false;
    }

    const trimmed = text.trim();

    // Check if it's DXF format
    if (
      trimmed.includes('SECTION') ||
      trimmed.includes('ENTITIES') ||
      trimmed.includes('HEADER') ||
      /^\s*0\s*[\r\n]/.test(trimmed)
    ) {
      try {
        const result = parseDxf(trimmed);
        if (result.entities.length > 0) {
          await store.loadDxfText(trimmed, 'Clipboard.dxf');
          store.showHint(`Loaded ${result.entities.length} entities from clipboard DXF.`, 3500);
          return true;
        }
      } catch (e) {
        console.warn('Failed parsing as DXF, falling through to JSON/text check:', e);
      }
    }

    // Check if it's JSON drawing data
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const data = JSON.parse(trimmed);
        if (data && typeof data === 'object') {
          if (data.docSnapshot) {
            store.doc.restore(data.docSnapshot);
            if (data.schematic) restoreSchematic(store.schematic, data.schematic);
            store.currentFileName = data.currentFileName ?? 'Clipboard.json';
            store.markDocChanged();
            store.view.zoomToFit(store.doc.bounds());
            store.requestDraw();
            store.emit();
            store.showHint('Restored drawing from clipboard JSON.', 3500);
            return true;
          } else if (data.vertices && data.edges) {
            store.doc.restore(data);
            store.currentFileName = 'Clipboard.json';
            store.markDocChanged();
            store.view.zoomToFit(store.doc.bounds());
            store.requestDraw();
            store.emit();
            store.showHint('Restored drawing from clipboard JSON snapshot.', 3500);
            return true;
          }
        }
      } catch {
        // Not valid JSON, proceed to plain text
      }
    }

    // Plain text: create a new drawing and place the text at (0, 0)
    store.clearAll();
    store.currentFileName = 'Clipboard_Notes.dxf';
    store.doc.addText(trimmed, 0, 0, 0.5, 0, store.activeLayerId || '0');
    store.markDocChanged();
    store.view.zoomToFit(store.doc.bounds());
    store.requestDraw();
    store.emit();
    store.showHint('Created new drawing with clipboard text at (0, 0).', 3500);
    return true;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    store.showHint(`Could not read clipboard: ${msg}`, 4000);
    return false;
  } finally {
    store.hideLoading();
  }
}
