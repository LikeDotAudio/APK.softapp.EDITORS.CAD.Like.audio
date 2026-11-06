// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
/**
 * 🏗 BIM LIBRARY in the 📚 Library (ROAD-3570): the BIM library app, embedded.
 *
 * The browser is not in this editor. It lives in the BIM container and is served on
 * its own port, http://<host>:8160/library — category › maker, search as you type
 * over its socket, the parametric filter drawer. Opened here with `mode=pick`: a part
 * chosen there comes back over postMessage (apk.bim.library@1 `part`) and is placed
 * on the user's own drawing as its BIM block — partToDefinition, the Flow tool armed
 * with it — as the 🏗 BIM button does.
 *
 * WHERE THE APP IS: localStorage `cad.bimLibraryUrl`, else `bimLibrary=` in the
 * address, else this host on 8160. When that does not answer (cad.like.audio has no
 * BIM), the same app as published with its snapshot on apk.audio, BIM_LIBRARY_PUBLIC.
 */
import { useEffect, useRef, useState } from 'react';
import { useStore } from '@state/useStore';
import { partToDefinition, type BimPart } from '../../flow/bimPart';

interface LibraryPart extends BimPart { maker?: string; category?: string; stage?: string; class?: string }

export const BIM_LIBRARY_PORT = 8160;
export const BIM_LIBRARY_PUBLIC = 'https://apk.audio/APK%3AOS/system/bim/library/library.html';

function configuredUrl(): string {
  let saved = '';
  try { saved = localStorage.getItem('cad.bimLibraryUrl') ?? ''; } catch { /* private window */ }
  const fromHash = /[?&]bimLibrary=([^&]+)/.exec(window.location.hash)?.[1];
  return saved || (fromHash ? decodeURIComponent(fromHash) : `${window.location.protocol}//${window.location.hostname}:${BIM_LIBRARY_PORT}/library`);
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

export function BimLibraryTab({ onPlaced }: { onPlaced: () => void }) {
  const store = useStore();
  const frame = useRef<HTMLIFrameElement | null>(null);
  const [src, setSrc] = useState('');
  const [live, setLive] = useState<boolean | null>(null);
  const [part, setPart] = useState<LibraryPart | null>(null);

  useEffect(() => {
    let alive = true;
    void bimLibraryUrl().then(({ url, live: up }) => {
      if (!alive) return;
      const u = new URL(url);
      u.searchParams.set('mode', 'pick');
      setSrc(u.href);
      setLive(up);
    });
    const onMessage = (e: MessageEvent) => {
      const msg = e.data as { protocol?: string; type?: string; part?: LibraryPart } | null;
      if (!frame.current || e.source !== frame.current.contentWindow) return;
      if (!msg || msg.protocol !== 'apk.bim.library@1' || msg.type !== 'part' || !msg.part?.id) return;
      setPart(msg.part);
    };
    window.addEventListener('message', onMessage);
    return () => { alive = false; window.removeEventListener('message', onMessage); };
  }, []);

  const place = () => {
    if (!part) return;
    const def = partToDefinition(part);
    if (!store.schematic.definitions.some((d) => d.id === def.id)) store.schematic.definitions.push(def);
    store.setFlowDefinition(def.id);
    store.setTool('flow');
    store.showHint(`Click to place ${part.name || part.model} — its BIM block.`, 4000);
    onPlaced();
  };

  const ports = part ? (part.ports ?? []).reduce((n, p) => n + Math.max(1, p.count ?? 1), 0) : 0;
  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">
      <div className="w-[460px] max-w-[55%] border-r border-[#333] bg-[#181818]">
        {src && <iframe ref={frame} src={src} title="BIM Library" className="h-full w-full border-0 bim-library-frame" />}
      </div>
      <div className="flex-1 overflow-y-auto p-6 bg-[#1b1b1c] text-sm">
        {live === false && (
          <p className="mb-3 text-[11px] text-[#858585]">No BIM server here — browsing the published library snapshot.</p>
        )}
        {!part && <p className="text-[#858585]">Choose a category or a maker, or search; then a part to place on your drawing.</p>}
        {part && (
          <div className="bim-library-part">
            <h3 className="text-base font-bold text-white">{part.name || `${part.manufacturer ?? ''} ${part.model ?? ''}`}</h3>
            <p className="text-[#999]">{part.manufacturer ?? part.maker} · {part.model} · {part.category}{part.class ? ` · ${part.class}` : ''}</p>
            <p className="text-[#999]">{ports} port{ports === 1 ? '' : 's'} · {part.id}</p>
            {part.stage === 'seeded' && (
              <p className="mt-2 text-[#e8a33d]">⚠ seeded — unverified: filled from a seed corpus, not the maker&apos;s word</p>
            )}
            <button
              onClick={place}
              className="mt-4 rounded bg-[#007acc] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#1188dd] bim-library-place"
            >
              Place on drawing as its BIM block
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
