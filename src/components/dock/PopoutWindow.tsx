// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

const HOST_ID = 'cad-popout';

/**
 * Dress a blank window like this one — the same stylesheets, the same dark
 * page — and hand back the element a panel renders into. Idempotent, because
 * strict mode runs the effect that calls it twice.
 */
function preparePopout(win: Window, title: string): HTMLElement {
  const doc = win.document;
  doc.title = title;
  const existing = doc.getElementById(HOST_ID);
  if (existing) return existing;

  for (const node of document.head.querySelectorAll('style, link[rel="stylesheet"]')) {
    const copy = doc.importNode(node, true);
    // about:blank may not share our base URL — pin links to where they really are.
    if (node instanceof HTMLLinkElement) (copy as HTMLLinkElement).href = node.href;
    doc.head.appendChild(copy);
  }
  doc.documentElement.className = document.documentElement.className;
  doc.documentElement.style.height = '100%';
  doc.body.style.cssText = 'margin:0;height:100%;background:#252526;overflow:hidden';

  const host = doc.createElement('div');
  host.id = HOST_ID;
  host.style.height = '100%';
  doc.body.appendChild(host);
  return host;
}

export interface PopoutWindowProps {
  win: Window;
  title: string;
  /** The user closed the window — put the panel back. */
  onClosed: () => void;
  children: ReactNode;
}

/**
 * A panel rendered into a window of its own. It is still this React tree —
 * same store, same state, live both ways — only its DOM lives over there.
 */
export function PopoutWindow({ win, title, onClosed, children }: PopoutWindowProps) {
  const [host, setHost] = useState<HTMLElement | null>(null);
  const closed = useRef(onClosed);

  useEffect(() => {
    closed.current = onClosed;
  }, [onClosed]);

  useEffect(() => {
    setHost(preparePopout(win, title));
    const gone = () => closed.current();
    win.addEventListener('pagehide', gone);
    // pagehide is not promised for a closed popup in every browser; this is.
    const poll = window.setInterval(() => {
      if (win.closed) gone();
    }, 500);
    return () => {
      win.removeEventListener('pagehide', gone);
      window.clearInterval(poll);
    };
  }, [win, title]);

  return host ? createPortal(children, host) : null;
}
