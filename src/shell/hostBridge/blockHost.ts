// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { HOST_PROTOCOL } from './hostBridge';

/**
 * THE OTHER DOOR: THIS CAD AS THE PARENT OF A BLOCK EDITOR
 *
 * hostBridge.ts is the CAD inside someone else's iframe. Here the roles turn
 * round: SoftappBlockBridgeModal puts a block-editing softapp (Rack Elevation,
 * Patchbay, Computer Buddy …) in an iframe of OURS and the two speak the same
 * `cad.like.audio/host@1`, in the directions the schema names for it:
 *
 *   toEditor.load      { block, meta }   the block to edit (on iframe load and on every editorReady)
 *   toEditor.request   {}                "Save into CAD": answer with blockSave now
 *   toCad.editorReady  { editor, blockType }
 *   toCad.blockChanged { block, meta? }  edited, not saved
 *   toCad.blockSave    { block, meta?, editor?, blockType? }  store it under meta.blockName
 *   toCad.editorClose  { editor? }
 *
 * Same origin both ways: posts go to `location.origin`, never '*', and a
 * message is taken only when its source is that iframe's own window and its
 * origin is ours. The editor side is WEB.Frontend-Assets
 * FrontEnd/shared/apk-softapp.js (APKSoftapp.connectHost).
 */

/** What a block editor may send the CAD. */
export const BLOCK_EDITOR_INBOUND_TYPES = ['editorReady', 'blockChanged', 'blockSave', 'editorClose'] as const;
export type BlockEditorInboundType = (typeof BLOCK_EDITOR_INBOUND_TYPES)[number];

/** What the CAD sends a block editor. */
export const BLOCK_EDITOR_OUTBOUND_TYPES = ['load', 'request'] as const;
export type BlockEditorOutboundType = (typeof BLOCK_EDITOR_OUTBOUND_TYPES)[number];

export interface BlockMeta {
  source?: string;
  blockName?: string;
  title?: string;
  filename?: string;
  editor?: string;
  blockType?: string;
}

export interface BlockEditorMessage {
  protocol: typeof HOST_PROTOCOL;
  type: BlockEditorInboundType;
  block?: Record<string, unknown>;
  meta?: BlockMeta;
  editor?: string;
  blockType?: string;
}

/** One toEditor message, shaped as the schema says. */
export function toEditor(type: 'load', body: { block: Record<string, unknown>; meta: BlockMeta }): Record<string, unknown>;
export function toEditor(type: 'request'): Record<string, unknown>;
export function toEditor(type: BlockEditorOutboundType, body: object = {}): Record<string, unknown> {
  return { protocol: HOST_PROTOCOL, type, ...body };
}

/** Post one toEditor message to the editor's window, same origin only. */
export function postToEditor(frame: Window | null | undefined, message: Record<string, unknown>, origin: string): void {
  frame?.postMessage(message, origin);
}

/**
 * The message as a block editor's, or null: wrong source (not the iframe's
 * own window), wrong origin, another protocol or a type that is not one of
 * BLOCK_EDITOR_INBOUND_TYPES. Block and meta are kept only when they are objects.
 */
export function blockEditorMessage(
  e: Pick<MessageEvent, 'data' | 'origin' | 'source'>,
  frame: Window | null | undefined,
  origin: string,
): BlockEditorMessage | null {
  if (!frame || e.source !== frame || e.origin !== origin) return null;
  const msg = e.data as Record<string, unknown> | null;
  if (!msg || typeof msg !== 'object' || msg.protocol !== HOST_PROTOCOL) return null;
  if (!(BLOCK_EDITOR_INBOUND_TYPES as readonly unknown[]).includes(msg.type)) return null;
  const obj = (v: unknown) => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : undefined);
  const str = (v: unknown) => (typeof v === 'string' ? v : undefined);
  const out: BlockEditorMessage = { protocol: HOST_PROTOCOL, type: msg.type as BlockEditorInboundType };
  const block = obj(msg.block);
  if (block) out.block = block;
  const meta = obj(msg.meta);
  if (meta) out.meta = meta as BlockMeta;
  if (str(msg.editor)) out.editor = str(msg.editor);
  if (str(msg.blockType)) out.blockType = str(msg.blockType);
  return out;
}
