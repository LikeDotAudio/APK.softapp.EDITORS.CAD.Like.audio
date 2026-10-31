// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { SavedSession } from '@io/browserStorage/SavedSession';

/**
 * CAD TO CAD, NOT THROUGH THE HOST
 *
 * A host that moves this editor from its iframe to a window of its own (the
 * acoustic softapp's pop-out) used to ask the docked CAD for its whole
 * session and carry it to the new window itself — a read-back of the drawing
 * through a page that has no business holding it. Now the two CADs hand it
 * over between themselves, on a same-origin BroadcastChannel:
 *
 *   1. the host makes up a token, opens the window at
 *      `#/drawing?host=…&resume&handover=<token>` and sends the docked CAD
 *      `handover` { token } (offerHandover);
 *   2. the new CAD, starting, asks the channel for that token (`want`) and the
 *      docked one answers with its session (`session`) — whichever of the two
 *      speaks first, the other is already listening, because the docked one
 *      also broadcasts the moment it is told and answers every `want` after;
 *   3. the new CAD puts it on its sheet, saves it to the browser, says `taken`
 *      (the docked one stops offering) and only then tells its host `ready` —
 *      so the host blanks the iframe after the drawing has moved, never before.
 *
 * Nobody answers within HANDOVER_MS (the docked CAD was gone, or a reload) —
 * the new CAD restores the browser's autosave instead, as `&resume` alone does.
 * The token pairs one docked CAD with one window: two hosts popping out at
 * once never swap drawings. The session crosses without the user's sign-in.
 */

export const HANDOVER_CHANNEL = 'cad.like.audio/handover';
/** How long a new window waits for the docked CAD before it falls back to the autosave. */
export const HANDOVER_MS = 4000;
/** How long a docked CAD keeps offering its drawing when nobody says `taken`. */
export const OFFER_MS = 15000;

export type HandoverMessage =
  | { kind: 'want'; token: string }
  | { kind: 'session'; token: string; session: SavedSession }
  | { kind: 'taken'; token: string };

/** The minimal channel this needs — BroadcastChannel in a browser, a fake in tests. */
export interface HandoverChannel {
  postMessage(m: HandoverMessage): void;
  close(): void;
  onmessage: ((e: { data: unknown }) => void) | null;
}

type ChannelFactory = () => HandoverChannel | null;
const browserChannel: ChannelFactory = () => (typeof BroadcastChannel === 'undefined' ? null : (new BroadcastChannel(HANDOVER_CHANNEL) as unknown as HandoverChannel));

/** `#/drawing?host=acoustic&resume&handover=<token>` → the token, else null. */
export function handoverFromHash(hash: string): string | null {
  const m = /[?&]handover=([\w-]{1,64})(?=&|$)/.exec(hash);
  return m ? m[1]! : null;
}

function isHandover(data: unknown, token: string): data is HandoverMessage {
  return Boolean(data) && typeof data === 'object' && (data as HandoverMessage).token === token;
}

/**
 * The docked side: offer this drawing to the window holding `token`, now and
 * on every `want`, until it says `taken` or OFFER_MS passes. `session` is read
 * at each answer, so the window gets the drawing as it is when it asks.
 */
export function offerHandover(token: string, session: () => SavedSession, { channel = browserChannel, ms = OFFER_MS } = {}): () => void {
  const ch = channel();
  if (!ch) return () => {};
  let open = true;
  const close = () => {
    if (!open) return;
    open = false;
    clearTimeout(timer);
    ch.close();
  };
  const offer = () => ch.postMessage({ kind: 'session', token, session: { ...session(), userAuth: undefined } });
  ch.onmessage = (e) => {
    if (!isHandover(e.data, token)) return;
    if (e.data.kind === 'want') offer();
    else if (e.data.kind === 'taken') close();
  };
  const timer = setTimeout(close, ms);
  offer();
  return close;
}

/**
 * The new window's side: the docked CAD's session for `token`, or null when
 * none came within `ms`. Says `taken` once it has it.
 */
export function receiveHandover(token: string, { channel = browserChannel, ms = HANDOVER_MS } = {}): Promise<SavedSession | null> {
  const ch = channel();
  if (!ch) return Promise.resolve(null);
  return new Promise((resolve) => {
    const done = (session: SavedSession | null) => {
      clearTimeout(timer);
      ch.onmessage = null;
      if (session) ch.postMessage({ kind: 'taken', token });
      ch.close();
      resolve(session);
    };
    ch.onmessage = (e) => {
      if (!isHandover(e.data, token) || e.data.kind !== 'session') return;
      const s = e.data.session;
      if (s && Array.isArray(s.docSnapshot?.edges)) done(s);
    };
    const timer = setTimeout(() => done(null), ms);
    ch.postMessage({ kind: 'want', token });
  });
}
