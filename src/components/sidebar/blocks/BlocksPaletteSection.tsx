// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
/**
 * 🧱 BLOCKS — THE DESIGNCENTER PALETTE (ROAD-3577).
 *
 * The owner (2026-11-06), after AutoCAD's DesignCenter: "Import all blocks for a project. They
 * have make/model/name/location defined but aren't placed on drawings yet. Then drag and drop
 * them into drawings to place them in the signal flow." Three tabs:
 *
 *   📄 This drawing        the BIM blocks placed here, the project's instances first (with counts)
 *   📦 Project · unplaced  a project's instances (make, model, name, location) on no drawing yet —
 *                          the bench is project #1; another is imported from its device list
 *   📚 Library             every part (the library app's search), and the full 📚 Library sash
 *
 * Every row drags `application/x-apk-bim` { bim, ref[, occurrence] } onto the sheet, where it is
 * placed as its BIM block (dropBimPart.ts). Placing an instance marks it assigned to this drawing
 * and sheet in BIM, removing it (delete, undo, cut) frees it: the palette watches the drawing's
 * occurrences and writes each change through the gateway (shell/bimProjects.ts). BIM's socket
 * pushes every change back, so another editor's placement shows here at once. Counts are per
 * category: placed (anywhere) · available · here.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useStore } from '@state/useStore';
import { useUi } from '@state/useUi';
import { PanelSectionTitle } from '../PanelSectionTitle';
import { bimLibraryUrl } from '../../conceptLibrary/BimLibraryTab';
import { BIM_DRAG_MIME } from '@state/actions/dropBimPart';
import type { BimPart } from '../../../flow/bimPart';
import type { BimRef, BlockPlacement } from '../../../core/types';
import {
  assign, bimWriteBase, diffOccurrences, dragPayload, drawingName, free, importBody, importProject,
  libraryEndpoints, listProjects, occurrencesOn, readProject,
  type ProjectListing, type ProjectRow, type ProjectView,
} from '../../../shell/bimProjects';

type Tab = 'drawing' | 'project' | 'library';
const PROJECT_KEY = 'cad.blocksProject';
interface LibraryRow extends BimPart { category?: string; maker?: string; ref?: BimRef }

function startDrag(e: React.DragEvent, row: { bim?: BimPart; ref?: BimRef; occurrence?: ProjectRow['occurrence'] }) {
  e.dataTransfer.effectAllowed = 'copy';
  e.dataTransfer.setData(BIM_DRAG_MIME, dragPayload(row));
  e.dataTransfer.setData('text/plain', row.bim?.name ?? row.bim?.id ?? '');
}

export function BlocksPaletteSection() {
  const store = useStore();
  useUi();   // re-render as the drawing changes (its placements, its file name)
  const [tab, setTab] = useState<Tab>('project');
  const [api, setApi] = useState<string | null>(null);
  const [live, setLive] = useState<boolean | null>(null);
  const [listing, setListing] = useState<ProjectListing | null>(null);
  const [project, setProject] = useState(() => { try { return localStorage.getItem(PROJECT_KEY) || 'bench'; } catch { return 'bench'; } });
  const [view, setView] = useState<ProjectView | null>(null);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [libRows, setLibRows] = useState<LibraryRow[]>([]);
  const drawing = drawingName(store);
  const refresh = useRef<() => void>(() => {});

  /* where BIM is: the library app (reads + socket) */
  useEffect(() => {
    let alive = true;
    void bimLibraryUrl().then(({ url, live: up }) => {
      if (!alive) return;
      setLive(up);
      if (up) setApi(libraryEndpoints(url).api);
    });
    return () => { alive = false; };
  }, []);

  refresh.current = () => {
    if (!api) return;
    void listProjects(api).then(setListing).catch((e: Error) => setError(e.message));
    void readProject(api, project, drawing).then((v) => { setView(v); setError(''); }).catch((e: Error) => { setView(null); setError(e.message); });
  };
  useEffect(() => { refresh.current(); }, [api, project, drawing]);

  /* BIM's socket pushes every import / placement: read again (debounced) */
  useEffect(() => {
    if (!api) return;
    const { socket } = libraryEndpoints(api.replace(/\/api\/bim$/, '/library/'));
    let ws: WebSocket | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    try { ws = new WebSocket(socket); } catch { return; }
    ws.onmessage = (m) => {
      try {
        if ((JSON.parse(String(m.data)) as { type?: string }).type !== 'projects') return;
      } catch { return; }
      clearTimeout(timer);
      timer = setTimeout(() => refresh.current(), 150);
    };
    return () => { clearTimeout(timer); ws?.close(); };
  }, [api]);

  /* the drawing's occurrences, watched: placed → assigned, removed → freed (through the gateway) */
  const seen = useRef<{ drawing: string | null; occ: Map<string, BlockPlacement> }>({ drawing: null, occ: new Map() });
  const sync = useCallback(() => {
    const name = drawingName(store);
    const now = occurrencesOn(store.schematic.placements);
    const before = seen.current;
    seen.current = { drawing: name, occ: now };
    if (!name) return;
    const base = bimWriteBase();
    const fail = (e: Error) => { setError(e.message); store.showHint(e.message, 5000); };
    // a drawing just opened: every occurrence on it is (re)asserted there; nothing is freed
    const { placed, removed } = before.drawing === name ? diffOccurrences(before.occ, now) : { placed: [...now.values()], removed: [] };
    for (const p of placed) void assign(base, p.occurrence!, name, p.id).catch(fail);
    for (const p of removed) void free(base, p.occurrence!, name).catch(fail);
  }, [store]);
  useEffect(() => {
    sync();
    return store.subscribe(sync);
  }, [store, sync]);

  /* 📚 Library: the library app's own search */
  useEffect(() => {
    if (!api || tab !== 'library') return;
    const ctl = new AbortController();
    const t = setTimeout(() => {
      void fetch(`${api}/search?per=40&physical=1&q=${encodeURIComponent(q)}`, { signal: ctl.signal })
        .then((r) => r.json()).then((b: { parts?: LibraryRow[] }) => setLibRows(b.parts ?? [])).catch(() => {});
    }, 200);
    return () => { clearTimeout(t); ctl.abort(); };
  }, [api, tab, q]);

  // read every render (the store's arrays change in place; useUi above re-renders on each emit)
  const onSheet = (() => {
    const byGid = new Map((view?.instances ?? []).map((i) => [i.occurrence.globalId, i]));
    return store.schematic.placements.filter((p) => p.bimRef || p.occurrence).map((p) => {
      const def = store.schematic.definitions.find((d) => d.id === p.definitionId);
      const inst = p.occurrence ? byGid.get(p.occurrence.globalId) : undefined;
      return { p, name: inst?.name ?? p.refdes ?? def?.name ?? p.definitionId, part: p.bimRef?.part ?? p.definitionId.replace(/^bim\./, ''),
               category: inst?.category ?? 'Other', occ: p.occurrence };
    });
  })();
  const unplaced = (view?.instances ?? []).filter((i) => !i.assigned);
  const placedElsewhere = (view?.instances ?? []).filter((i) => i.assigned && i.assigned.drawing !== drawing);

  const onImport = async (file: File) => {
    const id = window.prompt('Project id (A-Z a-z 0-9 _ . -)', file.name.replace(/\.[^.]+$/, '').replace(/[^A-Za-z0-9_.-]+/g, '-'));
    if (!id) return;
    try {
      const v = await importProject(bimWriteBase(), id, importBody(file.name, await file.text(), id));
      setProject(id);
      try { localStorage.setItem(PROJECT_KEY, id); } catch { /* private window */ }
      store.showHint(`Imported ${v.total} devices into ${v.name}${v.unresolved ? ` — ${v.unresolved} with no library part` : ''}.`, 5000);
    } catch (e) { setError((e as Error).message); }
  };

  const cats = Object.entries(view?.by_category ?? {}).sort(([a], [b]) => a.localeCompare(b));
  /* a plain function, not a component: a component made per render would remount on every emit and lose clicks */
  const tabButton = (id: Tab, label: string, n?: number) => (
    <button key={id} data-tab={id} onClick={() => setTab(id)}
            className={`blocks-tab flex-1 px-1 py-1 text-[10px] ${tab === id ? 'bg-[#2d2d30] text-white' : 'text-[#999] hover:text-white'}`}>
      {label}{n !== undefined ? ` ${n}` : ''}
    </button>
  );

  return (
    <div className="blocks-palette flex h-full min-h-0 flex-col text-xs text-[#ccc]" data-drawing={drawing ?? ''}>
      <PanelSectionTitle label="Blocks">
        <span className="font-mono text-[10px] text-[#777]">{live === false ? 'no BIM here' : live ? 'live BIM' : '…'}</span>
      </PanelSectionTitle>
      <div className="flex border-b border-[#2d2d30] bg-[#222225]">
        {tabButton('drawing', '📄 This drawing', onSheet.length)}
        {tabButton('project', '📦 Project · unplaced', unplaced.length)}
        {tabButton('library', '📚 Library')}
      </div>
      {error && <div className="blocks-error border-b border-[#5a1d1d] bg-[#3a1d1d] px-2 py-1 text-[10px] text-[#f48771]">{error}</div>}
      {!drawing && tab !== 'library' && (
        <div className="px-2 py-1 text-[10px] text-[#e8a33d]">This drawing has no name yet: save it, and what is placed on it is tracked in BIM.</div>
      )}

      {tab === 'drawing' && (
        <div className="min-h-0 flex-1 overflow-auto">
          {view && <div className="px-2 py-1 text-[10px] text-[#858585]">{view.name}: {view.here ?? 0} here · {view.placed} placed · {view.available} available</div>}
          {onSheet.length === 0 && <div className="px-2 py-2 text-[#858585]">No BIM blocks on this drawing yet.</div>}
          {onSheet.map(({ p, name, part, occ }) => (
            <div key={p.id} className="blocks-here-row flex items-center gap-1 border-b border-[#2a2a2a] px-2 py-1" data-placement={p.id}
                 onDoubleClick={() => store.showHint(`${name} — ${part}`, 2500)}>
              <span className="flex-1 truncate" title={part}>{name}</span>
              <span className="text-[10px] text-[#777]">{occ ? `${occ.project}/${occ.instance} · ${occ.sheet ?? 'Model'}` : 'part only'}</span>
            </div>
          ))}
        </div>
      )}

      {tab === 'project' && (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex items-center gap-1 border-b border-[#2d2d30] px-2 py-1">
            <select className="blocks-project flex-1 bg-[#252526] text-xs" value={project}
                    onChange={(e) => { setProject(e.target.value); try { localStorage.setItem(PROJECT_KEY, e.target.value); } catch { /* */ } }}>
              {(listing?.items ?? [{ id: 'bench', name: 'Bench', total: 0, placed: 0, available: 0, unresolved: 0, builtin: true }]).map((p) => (
                <option key={p.id} value={p.id}>{p.builtin ? '#1 ' : ''}{p.name} ({p.available}/{p.total})</option>
              ))}
            </select>
            <label className="cursor-pointer rounded bg-[#333] px-1.5 py-0.5 text-[10px] hover:bg-[#444]" title="Import a project's device list (.csv: make, model, name, location — or .json)">
              ⇪ Import
              <input type="file" accept=".csv,.json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void onImport(f); e.target.value = ''; }} />
            </label>
          </div>
          {cats.length > 0 && (
            <div className="blocks-counts border-b border-[#2d2d30] px-2 py-1 text-[10px] text-[#858585]">
              {cats.map(([c, n]) => <div key={c} data-category={c}><span className="text-[#ccc]">{c}</span> · {n.placed} placed · {n.available} available{n.here ? ` · ${n.here} here` : ''}</div>)}
            </div>
          )}
          <div className="min-h-0 flex-1 overflow-auto">
            {unplaced.map((i) => (
              <div key={i.id} draggable={!!i.bim} data-instance={i.id}
                   onDragStart={(e) => startDrag(e, i)}
                   className={`blocks-instance border-b border-[#2a2a2a] px-2 py-1 ${i.bim ? 'cursor-grab hover:bg-[#2a2d2e]' : 'opacity-50'}`}
                   title={i.unresolved ?? `Drag onto the sheet: ${i.part}`}>
                <div className="truncate text-[#e5e5e5]">{i.name}</div>
                <div className="truncate text-[10px] text-[#858585]">{i.make} {i.model}{i.location ? ` · 📍 ${i.location}` : ''}</div>
              </div>
            ))}
            {view && unplaced.length === 0 && <div className="px-2 py-2 text-[#858585]">Every instance of {view.name} is placed.</div>}
            {placedElsewhere.length > 0 && (
              <details className="px-2 py-1 text-[10px] text-[#858585]">
                <summary>{placedElsewhere.length} on other drawings</summary>
                {placedElsewhere.map((i) => <div key={i.id}>{i.name} — {i.assigned!.drawing} · {i.assigned!.sheet}</div>)}
              </details>
            )}
          </div>
        </div>
      )}

      {tab === 'library' && (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex items-center gap-1 border-b border-[#2d2d30] px-2 py-1">
            <input className="blocks-search flex-1 bg-[#252526] px-1 text-xs" placeholder="Search every part…" value={q} onChange={(e) => setQ(e.target.value)} />
            <button className="rounded bg-[#007acc] px-1.5 py-0.5 text-[10px] text-white" onClick={() => store.triggerOpenConceptLibrary()}>📚 Full</button>
          </div>
          <div className="min-h-0 flex-1 overflow-auto">
            {libRows.map((r) => (
              <div key={r.id} draggable data-part={r.id} onDragStart={(e) => startDrag(e, { bim: r, ref: r.ref })}
                   className="blocks-part cursor-grab border-b border-[#2a2a2a] px-2 py-1 hover:bg-[#2a2d2e]">
                <div className="truncate text-[#e5e5e5]">{r.name || r.model}</div>
                <div className="truncate text-[10px] text-[#858585]">{r.manufacturer ?? r.maker} · {r.model} · {r.category}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
