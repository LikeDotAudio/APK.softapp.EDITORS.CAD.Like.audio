// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { useMemo, useState } from 'react';
import { useStore } from '@state/useStore';
import { useUi } from '@state/useUi';
import { portsOf } from '../../flow/Schematic';
import { selectWire } from '../../flow/wireSelection';
import {
  acceptCandidates, deleteWire, discoverWires, mergeDuplicates, netlistCsv, pathOf, pinSpots, renameNet, reroute,
  setWireEnd, wireRecords, wireStatuses, wirelistCsv, type LineSegment, type WireCandidate, type WireEnd, type WireRecord,
} from '../../flow/wires';
import { ApkTable, buttonNode, h, inputNode, selectNode } from '../common/ApkTable';

const CELL = 'w-full bg-transparent px-1 focus:bg-[#111] focus:outline-none';
const BTN = 'rounded border border-[#555] bg-[#333] px-2.5 py-1 text-xs text-white hover:bg-[#444] transition-colors';
/** How near a pin a line's end counts as landing on it, mm. */
const SNAP_MM = 15;

function download(name: string, text: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8;' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const endText = (e: WireEnd) => `${e.device} · ${e.port}${e.pin !== '1' ? ` · ${e.pin}` : ''}`;

/**
 * 🧵 THE WIRE MANAGER (the owner, 2026-11-11: "the wires need a manager that discovers the
 * lines and manages them") — CellHell's connections tab. It only shows and calls: every rule
 * is flow/wires.ts.
 *
 *  DISCOVER: the sheet's plain lines that are wires in fact (a line or a run of touching lines
 *  ending on pins) proposed as wire records; accept one or all (the lines become the wire, one
 *  undo step); a run with one loose end is flagged dangling.
 *  MANAGE: every wire — From, To, Net, connectors, length, bends, status — its 📍 number
 *  selects and frames it on the sheet; re-pick From/To, rename the net, re-route, delete; merge
 *  duplicates; the wirelist and the netlist out as CSV.
 */
export function WireManagerTab({ search, onFrame }: { search: string; onFrame: () => void }) {
  useUi();
  const store = useStore();
  const model = store.schematic;
  const [candidates, setCandidates] = useState<WireCandidate[] | null>(null);
  const [sort, setSort] = useState<'id' | 'status'>('id');

  const rows = wireRecords(model);
  const status = wireStatuses(model);
  const q = search.trim().toLowerCase();
  const shown = rows
    .filter((w) => !q || [endText(w.from), endText(w.to), w.net, w.from.connector, w.to.connector, (status.get(w.id) ?? []).join(' ')].join(' ').toLowerCase().includes(q))
    .sort((a, b) => (sort === 'status' ? Number((status.get(a.id) ?? ['ok'])[0] === 'ok') - Number((status.get(b.id) ?? ['ok'])[0] === 'ok') : 0) || a.id - b.id);
  const pins = useMemo(() => model.placements.flatMap((p) => portsOf(model, p.id).map((r) => ({
    value: `${r.ref.placementId}|${r.ref.portId}`,
    label: `${(p.refdes ?? `#${p.id}`).split(' · ')[0]} · ${p.portLabels?.[r.port.id] ?? r.port.label ?? r.port.id}`,
  }))), [model, rows.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const lines = (): LineSegment[] => [...store.doc.edges.values()]
    .filter((e) => e.type === 'line')
    .map((e) => { const [a, b] = store.doc.endpointsOf(e); return { id: e.id, a: { x: a.x, y: a.y }, b: { x: b.x, y: b.y }, layer: e.layerId }; });
  const discover = () => setCandidates(discoverWires(lines(), pinSpots(model), SNAP_MM, model));
  const accept = (list: WireCandidate[]) => {
    const ok = list.filter((k) => k.from && k.to && !k.duplicate);
    if (!ok.length) return;
    store.editFlow(() => {
      const made = acceptCandidates(model, ok, store.activeLayerId);
      // the lines a wire was drawn with are the wire now: they go with it, in the same undo step
      for (const k of ok) for (const id of k.segments) store.doc.removeEdge(id);
      return made.length > 0;
    });
    store.showHint(`${ok.length} wire${ok.length === 1 ? '' : 's'} declared from drawn lines · Ctrl+Z undoes it.`, 3000);
    discover();
  };
  const frame = (w: WireRecord) => {
    const c = model.connectors.find((x) => x.id === w.id);
    const path = c && pathOf(model, c);
    selectWire(model, w.id);
    if (path?.length) {
      const xs = path.map((p) => p.x), ys = path.map((p) => p.y);
      const pad = 60;
      store.view.zoomToFit({ x1: Math.min(...xs) - pad, y1: Math.min(...ys) - pad, x2: Math.max(...xs) + pad, y2: Math.max(...ys) + pad });
    }
    store.requestDraw();
    store.emit();
    onFrame();
  };
  const flow = (fn: () => boolean) => store.editFlow(fn);
  const pinOf = (v: string) => ({ placementId: Number(v.slice(0, v.indexOf('|'))), portId: v.slice(v.indexOf('|') + 1) });
  const statusText = (id: number) => (status.get(id) ?? ['ok']).join(' · ');
  const dupes = rows.filter((w) => (status.get(w.id) ?? []).includes('duplicate')).length;

  return (
    <div className="flex flex-col gap-2" data-wire-manager>
      <div className="flex flex-wrap items-center gap-2 px-1">
        <span className="font-mono text-[11px] text-[#aaa]">🧵 {rows.length} wire{rows.length === 1 ? '' : 's'} · {new Set(rows.map((w) => w.net)).size} net{new Set(rows.map((w) => w.net)).size === 1 ? '' : 's'}</span>
        <button type="button" className={BTN} onClick={discover} title="Find the drawn lines that are wires in fact: a line or a run of touching lines ending on pins">🔎 Discover wires</button>
        <button type="button" className={BTN} disabled={!dupes} onClick={() => flow(() => mergeDuplicates(model) > 0)} title="Fold every wire that repeats another's two pins into the first">⧉ Merge duplicates ({dupes})</button>
        <button type="button" className={BTN} onClick={() => setSort(sort === 'id' ? 'status' : 'id')} title="Sort by wire number, or the ones with a problem first">↕ {sort === 'id' ? 'By number' : 'Problems first'}</button>
        <button type="button" className={BTN} onClick={() => download('wirelist.csv', wirelistCsv(model))} title="The wirelist (EDITORS.Wirelist's columns, and the net)">⬇ Wirelist CSV</button>
        <button type="button" className={BTN} onClick={() => download('netlist.csv', netlistCsv(model))} title="The netlist: every net and the pins on it">⬇ Netlist CSV</button>
      </div>

      {candidates && (
        <div className="rounded border border-[#38bdf8]/40 bg-[#38bdf8]/5 p-2" data-wire-candidates={candidates.length}>
          <div className="mb-1 flex items-center gap-2">
            <span className="font-mono text-[11px] text-[#38bdf8]">{candidates.length ? `${candidates.length} drawn line run${candidates.length === 1 ? '' : 's'} look like wires` : 'No undeclared wires among the drawn lines.'}</span>
            {candidates.some((k) => k.from && k.to && !k.duplicate) && (
              <button type="button" className={BTN} onClick={() => accept(candidates)}>✓ Accept all</button>
            )}
            <button type="button" className={BTN} onClick={() => setCandidates(null)}>✕</button>
          </div>
          {candidates.map((k, i) => (
            <div key={i} className="flex items-center gap-2 py-0.5 font-mono text-[11px]">
              <span className={k.confidence === 'high' ? 'text-[#4ade80]' : k.confidence === 'medium' ? 'text-[#fbbf24]' : 'text-[#f87171]'}>{k.confidence}</span>
              <span className="text-white">{k.from ? pins.find((p) => p.value === `${k.from!.placementId}|${k.from!.portId}`)?.label : '—'} → {k.to ? pins.find((p) => p.value === `${k.to!.placementId}|${k.to!.portId}`)?.label : 'loose end'}</span>
              <span className="text-[#888]">{k.reason}{k.bends.length ? ` · ${k.bends.length} bend${k.bends.length === 1 ? '' : 's'}` : ''}{k.dangling ? ' · ⚠ dangling' : ''}{k.duplicate ? ' · already wired' : ''}</span>
              {k.from && k.to && !k.duplicate && <button type="button" className={BTN} onClick={() => accept([k])}>Accept</button>}
            </div>
          ))}
        </div>
      )}

      <ApkTable
        id="cad-sheet-connectors"
        className="cad-apk cad-sheet text-xs font-mono"
        rows={shown}
        columns={[
          // the wire's number selects it and frames it on the sheet (the cells beside it edit it)
          { key: 'id', label: 'Wire #', width: '84px', value: (w) => w.id, node: (w) => buttonNode(`📍 W-${String(w.id).padStart(3, '0')}`, () => frame(w), BTN, 'Select this wire and frame it on the sheet') },
          { key: 'from', label: 'From', value: (w) => endText(w.from), node: (w) => selectNode(pins, `${w.from.placementId}|${w.from.portId}`, (v) => flow(() => setWireEnd(model, w.id, 'from', pinOf(v))), `${CELL} text-white`) },
          { key: 'to', label: 'To', value: (w) => endText(w.to), node: (w) => selectNode(pins, `${w.to.placementId}|${w.to.portId}`, (v) => flow(() => setWireEnd(model, w.id, 'to', pinOf(v))), `${CELL} text-white`) },
          { key: 'net', label: 'Net', width: '96px', value: (w) => w.net, node: (w) => inputNode(w.net, (v) => { if (!flow(() => renameNet(model, w.net, v))) store.showHint(`"${v}" is another net's name.`, 2500); }, `${CELL} text-[#38bdf8]`) },
          { key: 'conn', label: 'Connectors', value: (w) => `${w.from.connector || '—'} → ${w.to.connector || '—'}` },
          { key: 'len', label: 'Length mm', width: '80px', align: 'right', value: (w) => w.length_mm ?? '' },
          { key: 'bends', label: 'Bends', width: '56px', align: 'center', value: (w) => w.bends.length },
          { key: 'layer', label: 'Layer', width: '64px', value: (w) => w.layer },
          { key: 'status', label: 'Status', width: '120px', value: (w) => statusText(w.id), style: (w) => ({ color: statusText(w.id) === 'ok' ? '#4ade80' : '#fbbf24' }) },
          { key: 'act', label: '', width: '150px', node: (w) => {
            const box = h('span', { display: 'flex', gap: '4px' });
            box.append(
              buttonNode('Re-route', () => flow(() => reroute(model, w.id)), BTN, 'Square it up: an orthogonal route between its pins'),
              buttonNode('Delete', () => flow(() => deleteWire(model, w.id)), BTN, 'Delete the wire (Ctrl+Z brings it back)'),
            );
            return box;
          } },
        ]}
      />
    </div>
  );
}
