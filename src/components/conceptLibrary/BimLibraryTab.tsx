// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
/**
 * 📚 THE LIBRARY IS THE BIM LIBRARY (ROAD-3587) — a sash over the drawing.
 *
 * The owner (2026-11-06), on the CAD's own "Universal Part & Concept Library" modal: "this
 * should be melded into the library front end — the BIM library". The modal and its
 * CAD-local tabs are gone; 📚 Library opens the BIM container's library app itself
 * (http://<host>:8160/library, or the gateway's https://<host>/library/), embedded with
 * `mode=pick`, as a SASH OVER THE CANVAS ("sash over top"): it slides in over the drawing
 * from the left — never over the toolbar or the menus — its right edge drags its width
 * (kept per viewer), and Esc or ✕ slides it away. The drawing keeps its full width.
 *
 * Everything the modal's tabs held is in the library: parts and the CAD's concepts
 * (concept/<id>: flow, schematic symbols, math & logic, adapters — BIM's
 * importers/import_cad_catalog.py) by search and category, and the closed connector
 * vocabulary (contracts/ifc/connectors.json) in its 🔌 Connectors lens.
 *
 * A part picked there comes back over postMessage (apk.bim.library@1 `part`) and is placed
 * on this drawing as its BIM block (partToDefinition, the Flow tool armed with it). A
 * concept is placed as the CAD's own symbol for it, so it looks as it always did.
 *
 * WHERE THE APP IS: localStorage `cad.bimLibraryUrl`, else `bimLibrary=` in the address,
 * else — on an https page (the gateway) — this origin's /library/ (http://<host>:8160 is
 * mixed content there), else this host on 8160. When that does not answer (cad.like.audio
 * has no BIM), the same app as published with its snapshot on apk.audio.
 * ITS THEME IS THIS EDITOR'S: ?theme=dark&tokens=… (the app is dark by default anyway).
 */
import { useEffect, useRef, useState } from 'react';
import { useStore } from '@state/useStore';
import { partToDefinition, type BimPart } from '../../flow/bimPart';
import { CATALOG } from '../../flow/catalog';
import type { BlockDefinition } from '../../core/types';

interface LibraryPart extends BimPart { maker?: string; category?: string; stage?: string; class?: string }

export const BIM_LIBRARY_PORT = 8160;
export const BIM_LIBRARY_PUBLIC = 'https://apk.audio/APK%3AOS/system/bim/library/library.html';
/** This editor's own colours, as the library app's tokens (apk-bim-lens-page.js). */
export const LIBRARY_THEME = { bg: '#1e1e1e', panel: '#181818', raise: '#252526', line: '#333333', text: '#e5e5e5',
                               dim: '#858585', accent: '#007acc', accentInk: '#ffffff' };
const SASH_KEY = 'cad.librarySash';
const SASH_MIN = 280;

function configuredUrl(): string {
  let saved = '';
  try { saved = localStorage.getItem('cad.bimLibraryUrl') ?? ''; } catch { /* private window */ }
  const fromHash = /[?&]bimLibrary=([^&]+)/.exec(window.location.hash)?.[1];
  if (saved) return saved;
  if (fromHash) return decodeURIComponent(fromHash);
  return window.location.protocol === 'https:'
    ? `${window.location.origin}/library/`
    : `${window.location.protocol}//${window.location.hostname}:${BIM_LIBRARY_PORT}/library`;
}

/** The app's address: the configured one if its API answers, else the published copy. */
export async function bimLibraryUrl(fetcher: typeof fetch = fetch): Promise<{ url: string; live: boolean }> {
  const url = configuredUrl();
  if (/\.html?$/.test(new URL(url).pathname)) return { url, live: false };   // a published copy: no API to ask
  try {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 2500);
    const res = await fetcher(new URL('/api/bim/health', url).href, { cache: 'no-store', signal: ctl.signal });
    clearTimeout(timer);
    if (res.ok) return { url, live: true };
  } catch { /* unreachable, refused, or mixed content */ }
  return { url: BIM_LIBRARY_PUBLIC, live: false };
}

/** The app's address with what this editor asks of it: pick mode, its theme. */
export function libraryFrameUrl(url: string): string {
  const u = new URL(url);
  u.searchParams.set('mode', 'pick');
  u.searchParams.set('theme', 'dark');
  u.searchParams.set('tokens', JSON.stringify(LIBRARY_THEME));
  return u.href;
}

/** A concept (concept/<slug of a CAD definition id>) is placed as this editor's own symbol for it. */
export function conceptDefinition(part: { id?: string; model?: string }, catalog: BlockDefinition[] = CATALOG): BlockDefinition | null {
  if (!String(part.id ?? '').startsWith('concept/')) return null;
  const slug = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const model = String(part.model ?? String(part.id).slice('concept/'.length));
  return catalog.find((d) => slug(d.id) === model) ?? null;
}

export function LibrarySash({ open, onClose }: { open: boolean; onClose: () => void }) {
  const store = useStore();
  const frame = useRef<HTMLIFrameElement | null>(null);
  const [src, setSrc] = useState('');
  const [live, setLive] = useState<boolean | null>(null);
  const [part, setPart] = useState<LibraryPart | null>(null);
  const [width, setWidth] = useState(() => {
    try { return Math.max(SASH_MIN, Number(localStorage.getItem(SASH_KEY)) || 440); } catch { return 440; }
  });
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (!open || src) return;
    let alive = true;
    void bimLibraryUrl().then(({ url, live: up }) => {
      if (!alive) return;
      setSrc(libraryFrameUrl(url));
      setLive(up);
    });
    return () => { alive = false; };
  }, [open, src]);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      const msg = e.data as { protocol?: string; type?: string; part?: LibraryPart; bim?: LibraryPart } | null;
      if (!frame.current || e.source !== frame.current.contentWindow) return;
      if (!msg || msg.protocol !== 'apk.bim.library@1' || msg.type !== 'part') return;
      const got = msg.bim ?? msg.part;
      if (got?.id) setPart(got);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && open) onClose(); };
    window.addEventListener('message', onMessage);
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('message', onMessage); window.removeEventListener('keydown', onKey); };
  }, [open, onClose]);

  const startDrag = (e: React.PointerEvent) => {
    e.preventDefault();
    const left = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect().left;
    const max = ((e.currentTarget.parentElement?.parentElement as HTMLElement | null)?.getBoundingClientRect().width ?? 1200) - 48;
    setDragging(true);
    let w = width;
    const move = (ev: PointerEvent) => { w = Math.round(Math.min(max, Math.max(SASH_MIN, ev.clientX - left))); setWidth(w); };
    const up = () => {
      setDragging(false);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      try { localStorage.setItem(SASH_KEY, String(w)); } catch { /* private window */ }
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const place = () => {
    if (!part) return;
    const def = conceptDefinition(part) ?? partToDefinition(part);
    if (!store.schematic.definitions.some((d) => d.id === def.id)) store.schematic.definitions.push(def);
    store.setFlowDefinition(def.id);
    store.setTool('flow');
    store.showHint(`Click to place ${part.name || part.model} — ${def.id.startsWith('bim.') ? 'its BIM block' : 'its symbol'}.`, 4000);
    onClose();
  };

  const ports = part ? (part.ports ?? []).reduce((n, p) => n + Math.max(1, p.count ?? 1), 0) : 0;
  return (
    <div
      className="library-sash absolute left-0 top-0 bottom-0 z-30 flex flex-col border-r border-[#333] bg-[#1e1e1e] text-sm"
      style={{ width, maxWidth: 'calc(100% - 48px)', transform: open ? 'none' : 'translateX(calc(-100% - 2px))',
               transition: dragging ? 'none' : 'transform .24s cubic-bezier(.16,1,.3,1)',
               boxShadow: open ? '8px 0 28px rgba(0,0,0,.5)' : 'none', pointerEvents: open ? 'auto' : 'none' }}
      aria-hidden={!open}
    >
      <div className="flex items-center gap-2 border-b border-[#333] px-2 py-1 text-xs text-[#ccc]">
        <span className="font-semibold">📚 Library</span>
        <span className="text-[#858585]">{live === false ? 'published snapshot — no BIM here' : live ? 'live BIM' : '…'}</span>
        <span className="flex-1" />
        <button className="library-sash-close rounded px-2 hover:bg-[#333]" title="Close (Esc)" onClick={onClose}>✕</button>
      </div>
      <div className="relative flex-1 min-h-0">
        {src && <iframe ref={frame} src={src} title="BIM Library" className="bim-library-frame h-full w-full border-0"
                        style={{ pointerEvents: dragging ? 'none' : 'auto' }} />}
      </div>
      {part && (
        <div className="bim-library-part border-t border-[#333] bg-[#181818] p-3">
          <div className="font-bold text-white">{part.name || `${part.manufacturer ?? ''} ${part.model ?? ''}`}</div>
          <div className="text-xs text-[#999]">{part.manufacturer ?? part.maker} · {part.model} · {part.category}{part.class ? ` · ${part.class}` : ''} · {ports} port{ports === 1 ? '' : 's'}</div>
          {part.stage === 'seeded' && <div className="mt-1 text-xs text-[#e8a33d]">⚠ seeded — unverified: filled from a seed corpus, not the maker&apos;s word</div>}
          <button onClick={place} className="bim-library-place mt-2 rounded bg-[#007acc] px-3 py-1 text-xs font-semibold text-white hover:bg-[#1188dd]">
            Place on the drawing
          </button>
        </div>
      )}
      <div className="library-sash-grip absolute top-0 bottom-0 -right-1 w-2 cursor-ew-resize" title="Drag to resize the library" onPointerDown={startDrag} />
    </div>
  );
}
