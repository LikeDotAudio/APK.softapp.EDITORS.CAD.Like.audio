// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { useState } from 'react';
import { useStore } from '@state/useStore';
import { useUi } from '@state/useUi';
import { portsOf } from '../../../flow/Schematic';
import { selectedWire, selectWire } from '../../../flow/wireSelection';
import { deleteWire, renameNet, reroute, setWireEnd, wireRecord, netOfWire, type WireEnd } from '../../../flow/wires';
import { PropertyRow } from './PropertyRow';

/**
 * THE WIRE AS A RECORD (the owner, 2026-11-11: "this is the property"): a selected wire shows
 * From and To (device · port · pin · connector), its Net, its length in mm and its bends —
 * the same record the drawing saves and IFC, the wirelist and the netlist carry
 * (flow/wires.ts wireRecord). From and To re-pick the end; the net renames; Re-route squares
 * it up; every change is one undo step.
 */
export function WireProperties() {
  useUi();   // redrawn on every change
  const store = useStore();
  const model = store.schematic;
  const id = selectedWire(model);
  const [netDraft, setNetDraft] = useState<string | null>(null);
  if (id === null) return null;
  const c = model.connectors.find((w) => w.id === id);
  if (!c) return null;
  const rec = wireRecord(model, c);
  const pins = model.placements.flatMap((p) => portsOf(model, p.id).map((r) => ({
    key: `${r.ref.placementId}|${r.ref.portId}`, ref: r.ref,
    text: `${(p.refdes ?? `#${p.id}`).split(' · ')[0]} · ${p.portLabels?.[r.port.id] ?? r.port.label ?? r.port.id}`,
  })));
  const endText = (e: WireEnd) => [e.device, e.port, e.pin, e.connector || '—'].join(' · ');
  const repick = (which: 'from' | 'to', key: string) => {
    const pin = pins.find((p) => p.key === key);
    if (!pin) return;
    if (!store.editFlow(() => setWireEnd(model, id, which, pin.ref))) store.showHint('Not re-picked — that would wire a pin to itself or repeat a wire.', 3000);
  };
  const end = (which: 'from' | 'to') => {
    const e = rec[which];
    return (
      <div className="space-y-1">
        <PropertyRow label={which === 'from' ? 'From' : 'To'}>
          <select
            className="min-w-0 flex-1 rounded border border-[#3c3c3c] bg-[#1e1e1e] px-1 py-0.5 text-[11px] text-[#ddd]"
            value={`${e.placementId}|${e.portId}`}
            title={endText(e)}
            onChange={(ev) => repick(which, ev.target.value)}
          >
            {!pins.some((p) => p.key === `${e.placementId}|${e.portId}`) && <option value={`${e.placementId}|${e.portId}`}>{endText(e)} (not on the sheet)</option>}
            {pins.map((p) => <option key={p.key} value={p.key}>{p.text}</option>)}
          </select>
        </PropertyRow>
        <div className="pl-[88px] font-mono text-[10px] text-[#999]" data-wire-end={which}>{endText(e)}</div>
      </div>
    );
  };
  const net = netOfWire(model, id)?.name ?? rec.net;
  const commitNet = () => {
    if (netDraft === null || netDraft.trim() === net) { setNetDraft(null); return; }
    if (!store.editFlow(() => renameNet(model, net, netDraft))) store.showHint(`Net not renamed — "${netDraft.trim()}" is another net's name.`, 3000);
    setNetDraft(null);
  };
  return (
    <div className="space-y-2 rounded border border-[#333] bg-[#1e1e1e] p-2.5" data-wire-properties={id}>
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[#aaa]">Wire W-{String(id).padStart(3, '0')}</div>
      {end('from')}
      {end('to')}
      <PropertyRow label="Net">
        <input
          className="min-w-0 flex-1 rounded border border-[#3c3c3c] bg-[#1e1e1e] px-1 py-0.5 font-mono text-[11px] text-[#ddd]"
          value={netDraft ?? net}
          onChange={(ev) => setNetDraft(ev.target.value)}
          onBlur={commitNet}
          onKeyDown={(ev) => { if (ev.key === 'Enter') commitNet(); if (ev.key === 'Escape') setNetDraft(null); }}
        />
      </PropertyRow>
      <PropertyRow label="Length"><span className="font-mono text-[#ddd]">{rec.length_mm === null ? '—' : `${rec.length_mm} mm`}</span></PropertyRow>
      <PropertyRow label="Bends"><span className="font-mono text-[#ddd]">{rec.bends.length}</span></PropertyRow>
      <div className="flex gap-1.5 pt-1">
        <button type="button" className="rounded bg-[#333] px-2 py-0.5 text-[11px] text-[#ddd] hover:bg-[#444]"
                title="Square the wire up: an orthogonal route of its own between its pins"
                onClick={() => store.editFlow(() => reroute(model, id))}>Re-route</button>
        <button type="button" className="rounded bg-[#333] px-2 py-0.5 text-[11px] text-[#ddd] hover:bg-[#444]"
                title="Delete the wire (Ctrl+Z brings it back)"
                onClick={() => { store.editFlow(() => deleteWire(model, id)); selectWire(model, null); store.emit(); }}>Delete</button>
      </div>
    </div>
  );
}
