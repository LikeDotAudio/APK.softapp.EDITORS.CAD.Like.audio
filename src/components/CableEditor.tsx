// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { useEffect, useState, type KeyboardEvent } from 'react';
import { CABLE_STATUSES, isPartId, normaliseCable } from '../flow/cables';
import { loadApkLibrary } from '../shell/apkLibrary';
import { useStore } from '../state/useStore';
import { useUi } from '../state/useUi';

/**
 * THE CABLE EDITOR (ROAD-3582 r4). The Wire tool opens it on the wire you click:
 * mark the drawn wire as a real cable and say which — its BIM cable part (📚
 * calls up the library, category Cable), the label on it, its length in mm,
 * colour and status. Saved, the wire is Connector.cable, which the drawing's
 * .ifc writes as an IfcCableSegment realizing the connection (typed by the
 * part's IfcCableSegmentType, Qto_CableSegmentBaseQuantities.Length, the
 * APK_Connection words). "Not a cable" makes it only a line again.
 */
interface Fields { part: string; tag: string; length_mm: string; colour: string; status: string }

const FIELD = 'w-full rounded border border-[#3c3c3c] bg-[#1e1e1e] px-2 py-1 font-mono text-xs text-white focus:border-accent focus:outline-none';
const LABEL = 'block font-mono text-[9.5px] uppercase tracking-[0.05em] text-[#aaa]';
const BUTTON = 'rounded border border-[#3c3c3c] px-2.5 py-1 font-mono text-[11px] text-white hover:border-white disabled:opacity-40';

export function CableEditor() {
  const store = useStore();
  const { cable } = useUi();
  const [f, setF] = useState<Fields>({ part: '', tag: '', length_mm: '', colour: '', status: '' });
  const [note, setNote] = useState('');
  const key = cable ? `${cable.connectorId}` : '';

  // the fields start from the wire each time the editor opens on one
  useEffect(() => {
    if (!cable) return;
    setF({ part: cable.part, tag: cable.tag, length_mm: cable.length_mm, colour: cable.colour, status: cable.status });
    setNote('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  if (!cable) return null;

  const set = (k: keyof Fields) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const partBad = !!f.part.trim() && !isPartId(f.part.trim().toLowerCase());
  const lengthBad = !!f.length_mm.trim() && !(Number(f.length_mm.replace(',', '.')) > 0);

  const save = () => {
    if (partBad || lengthBad) return;
    store.setCable(cable.connectorId, normaliseCable(f));
    store.showHint(`${cable.title} is a cable${f.tag.trim() ? ` (${f.tag.trim()})` : ''}.`, 2500);
    store.closeCableEditor();
  };
  const unmark = () => {
    store.setCable(cable.connectorId, null);
    store.showHint(`${cable.title} is only a line again.`, 2500);
    store.closeCableEditor();
  };
  const pickPart = async () => {
    setNote('');
    try {
      const lib = (await loadApkLibrary()) as unknown as { pick?: (o: unknown) => Promise<{ bim?: { id?: string }; ref?: { part?: string } }[]> };
      if (typeof lib.pick !== 'function') throw new Error('this picker cannot pick');
      const [hit] = await lib.pick({ filter: { category: 'Cable' } });
      const id = hit?.ref?.part ?? hit?.bim?.id;
      if (id) setF((x) => ({ ...x, part: String(id) }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!/cancel|closed/i.test(msg)) setNote(`The library is not to hand here (${msg}): type the part as <maker>/<model>.`);
    }
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); save(); }
    if (e.key === 'Escape') { e.preventDefault(); store.closeCableEditor(); }
  };

  return (
    <div
      data-cable-editor
      role="dialog"
      aria-label="Cable"
      onKeyDown={onKey}
      className="absolute right-3 top-3 z-[60] w-[290px] space-y-2 rounded-[9px] border border-[#3c3c3c] bg-[#252526] p-3 shadow-[3px_3px_0_rgba(0,0,0,.35)]"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-white">{cable.isCable ? 'Cable' : 'Make it a cable'}</h2>
          <p className="max-w-[230px] truncate font-mono text-[10px] text-[#888]" title={cable.title}>{cable.title}</p>
        </div>
        <button type="button" onClick={() => store.closeCableEditor()} className="text-sm text-[#888] hover:text-white" aria-label="Close">✕</button>
      </div>

      <label className={LABEL}>
        BIM part
        <span className="mt-0.5 flex gap-1">
          <input className={FIELD} value={f.part} onChange={set('part')} placeholder="hosa/cmr-206" spellCheck={false} autoFocus />
          <button type="button" className={BUTTON} onClick={() => void pickPart()} title="Pick a cable from the BIM library">📚</button>
        </span>
      </label>
      {partBad && <p className="font-mono text-[10px] text-[#f87171]">A part is &lt;maker&gt;/&lt;model&gt;: lower-case words and dashes.</p>}
      <div className="grid grid-cols-2 gap-2">
        <label className={LABEL}>
          Label
          <input className={FIELD} value={f.tag} onChange={set('tag')} placeholder="W-001" spellCheck={false} />
        </label>
        <label className={LABEL}>
          Length (mm)
          <input className={FIELD} value={f.length_mm} onChange={set('length_mm')} placeholder="1800" inputMode="decimal" />
        </label>
        <label className={LABEL}>
          Colour
          <input className={FIELD} value={f.colour} onChange={set('colour')} placeholder="black" spellCheck={false} />
        </label>
        <label className={LABEL}>
          Status
          <input className={FIELD} value={f.status} onChange={set('status')} list="cad-cable-statuses" placeholder="planned" spellCheck={false} />
          <datalist id="cad-cable-statuses">
            {CABLE_STATUSES.map((s) => <option key={s} value={s} />)}
          </datalist>
        </label>
      </div>
      {lengthBad && <p className="font-mono text-[10px] text-[#f87171]">The length is a positive number of mm.</p>}
      {note && <p className="font-mono text-[10px] text-[#fbbf24]">{note}</p>}

      <div className="flex items-center justify-end gap-2 border-t border-[#3c3c3c] pt-2">
        {cable.isCable && <button type="button" className={BUTTON} onClick={unmark}>Not a cable</button>}
        <button type="button" className={`${BUTTON} border-accent`} onClick={save} disabled={partBad || lengthBad}>
          {cable.isCable ? 'Save' : 'Make it a cable'}
        </button>
      </div>
    </div>
  );
}
