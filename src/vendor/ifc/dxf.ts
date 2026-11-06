// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
/**
 * IFC INSIDE A DXF (ROAD-3598 answer 2) — the one helper every DXF writer in the
 * tree calls. DXF stays the 2D drawing everywhere; IFC is added beside it (every
 * export that offers .dxf also offers .ifc) AND each DXF carries the IFC data of
 * every object it draws on a hidden layer, so a reader that ignores that layer
 * sees the normal drawing and a reader that knows it gets the model back.
 *
 * FORMAT  apk-ifc-dxf/1 (Python twin: apkaudio_contracts.ifc_dxf, held to
 * contracts/vectors/ifc/dxf.json byte for byte):
 *
 *   LAYER   'APK_IFC'  70 = 1 (frozen), 62 = -8 (off), 290 = 0 (never plotted)
 *   APPID   'APK_IFC'  registered in the APPID table (created when the file has none,
 *                      with ACAD, which a reader expects to find there)
 *   one POINT per object part on layer APK_IFC, at the object's placement (x, y of its
 *   IfcLocalPlacement chain, in the model's length unit; the origin when it has none),
 *   carrying XDATA — the DXF mechanism for application data, kept by every DXF
 *   program that re-saves the file and ignored by every one that does not know it:
 *
 *     1001 APK_IFC
 *     1000 apk-ifc-dxf/1
 *     1000 <GlobalId>                  the object (22 chars, IFC base64)
 *     1070 <part>                      1-based
 *     1070 <parts>                     a payload over IFC_DXF_PART chars is split across
 *                                      several POINTs (XDATA holds ≤ 16 KB per entity)
 *     1000 <chunk> …                   ≤ 250 chars each (a 1000 string is ≤ 255 bytes)
 *
 *   payload = the object as compact JSON {guid, ifc, name?, tag?, psets?, step?}: ifc is
 *   its STEP entity name (IFCCABLESEGMENT), psets its property and quantity sets merged
 *   type-first as getPsets() reads them, step its own instance line as ISO 10303-21 text
 *   (#12=IFCCABLESEGMENT('…',…);). The JSON is pure printable ASCII with no space:
 *   anything else (non-ASCII, space, ^, DEL) is a \uXXXX escape, so no DXF reader's
 *   trimming, code page or caret decoding can change a byte.
 *
 * addIfcToDxf(dxfText, blobs) puts the layer, the APPID and the carriers into any DXF
 * text (R12 without handles, or R2000 with handles, owners and subclass markers — it
 * follows what the file already does, and moves $HANDSEED past what it adds);
 * readIfcDxf(dxfText) reads them back. ifcDxfBlobs(stepText) makes the blobs from the
 * same model's .ifc twin, so a writer that already has the twin needs one line.
 */
import { getPsets, isRef, parseStep, writeEntity, type StepEntity, type StepFile, type StepValue } from './step.js'

export const IFC_DXF_LAYER = 'APK_IFC'
export const IFC_DXF_APPID = 'APK_IFC'
export const IFC_DXF_FORMAT = 'apk-ifc-dxf/1'
/** Characters per XDATA 1000 string. */
export const IFC_DXF_CHUNK = 250
/** Payload characters per carrier POINT (60 chunks, well under XDATA's 16 KB per entity). */
export const IFC_DXF_PART = 15000

/** One object's IFC data as a DXF carries it. `at` is where its carrier POINT sits (not in the payload). */
export interface IfcDxfBlob {
  guid: string
  ifc: string
  name?: string | null
  tag?: string | null
  psets?: Record<string, Record<string, unknown>>
  step?: string
  at?: { x: number; y: number }
}

// ---------------------------------------------------------------- payload --

/** The canonical payload text of a blob: compact JSON, printable ASCII only, no space. */
export function encodeIfcDxfPayload(blob: IfcDxfBlob): string {
  const o: Record<string, unknown> = { guid: blob.guid, ifc: blob.ifc }
  if (blob.name != null) o.name = blob.name
  if (blob.tag != null) o.tag = blob.tag
  if (blob.psets && Object.keys(blob.psets).length) o.psets = blob.psets
  if (blob.step != null) o.step = blob.step
  return JSON.stringify(o).replace(/[^\x21-\x7e]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`)
}

export function decodeIfcDxfPayload(text: string): IfcDxfBlob {
  const o = JSON.parse(text) as IfcDxfBlob
  if (!o || typeof o.guid !== 'string' || typeof o.ifc !== 'string') throw new Error('apk-ifc-dxf: payload has no guid / ifc')
  return o
}

const chunks = (s: string, n: number): string[] => {
  const out: string[] = []
  for (let i = 0; i < s.length; i += n) out.push(s.slice(i, i + n))
  return out.length ? out : ['']
}

// ---------------------------------------------------------------- the blobs of a model --

const NOT_OBJECTS = /^IFC(REL|PROPERTYSET|ELEMENTQUANTITY|PROPERTYSETTEMPLATE|PROPERTYTEMPLATE|SIMPLEPROPERTYTEMPLATE|COMPLEXPROPERTYTEMPLATE|PROFILEDEF|QUANTITYSET|PREDEFINEDPROPERTYSET)/
const isTypeName = (t: string) => /TYPE$|^IFCTYPE|STYLE$/.test(t) && t !== 'IFCRELDEFINESBYTYPE'
const GUID = /^[0-3][0-9A-Za-z_$]{21}$/

type StepRefLike = { id: number }

const num = (v: StepValue | undefined): number => {
  if (typeof v === 'number') return v
  if (v && typeof v === 'object' && !Array.isArray(v) && v.kind === 'real') return v.value
  return 0
}

/** The 2D world origin of an IfcObjectPlacement (IfcLocalPlacement chain), or null. */
function placementAt(file: StepFile, ref: StepValue | undefined, depth = 0): { x: number; y: number; c: number; s: number } | null {
  if (!isRef(ref) || depth > 64) return null
  const lp = file.byId.get(ref.id)
  if (!lp || lp.type !== 'IFCLOCALPLACEMENT') return null
  const parent = placementAt(file, lp.args[0], depth + 1) ?? { x: 0, y: 0, c: 1, s: 0 }
  const ax = isRef(lp.args[1]) ? file.byId.get(lp.args[1].id) : undefined
  let x = 0, y = 0, c = 1, s = 0
  if (ax) {
    const loc = isRef(ax.args[0]) ? file.byId.get(ax.args[0].id) : undefined
    const xyz = loc && Array.isArray(loc.args[0]) ? loc.args[0] : []
    x = num(xyz[0])
    y = num(xyz[1])
    const refDir = ax.type === 'IFCAXIS2PLACEMENT3D' ? ax.args[2] : ax.type === 'IFCAXIS2PLACEMENT2D' ? ax.args[1] : null
    const d = isRef(refDir ?? undefined) ? file.byId.get((refDir as StepRefLike).id) : undefined
    const r = d && Array.isArray(d.args[0]) ? d.args[0] : null
    if (r) {
      const len = Math.hypot(num(r[0]), num(r[1]))
      if (len > 0) { c = num(r[0]) / len; s = num(r[1]) / len }
    }
  }
  return {
    x: parent.x + parent.c * x - parent.s * y,
    y: parent.y + parent.s * x + parent.c * y,
    c: parent.c * c - parent.s * s,
    s: parent.s * c + parent.c * s,
  }
}

const round = (v: number) => Math.round(v * 1e6) / 1e6 + 0

/**
 * One blob per object of an IFC model (its .ifc twin): every rooted entity (it has a
 * GlobalId) that is not a relationship, a property definition or a type — products,
 * ports, spatial elements, groups, controls, the project. A type's sets reach its
 * occurrences through getPsets. `include` replaces that rule.
 */
export function ifcDxfBlobs(model: string | StepFile, opts: { include?: (e: StepEntity) => boolean } = {}): IfcDxfBlob[] {
  const file = typeof model === 'string' ? parseStep(model) : model
  const include = opts.include ?? ((e: StepEntity) => !NOT_OBJECTS.test(e.type) && !isTypeName(e.type))
  const out: IfcDxfBlob[] = []
  for (const e of file.entities) {
    const guid = e.args[0]
    if (e.complex || typeof guid !== 'string' || !GUID.test(guid) || !include(e)) continue
    const blob: IfcDxfBlob = { guid, ifc: e.type }
    if (typeof e.args[2] === 'string') blob.name = e.args[2]
    // no schema here, so no Tag guessed from a position (attribute 7 is Tag on an element,
    // LongName on a space, Status on a task): it is in `step`; a writer that knows it sets `tag`
    const psets = getPsets(file, e)
    if (Object.keys(psets).length) blob.psets = psets
    blob.step = writeEntity(e)
    const at = placementAt(file, e.args[5])
    if (at) blob.at = { x: round(at.x), y: round(at.y) }
    out.push(blob)
  }
  return out
}

// ---------------------------------------------------------------- writing --

/** How the file being written does DXF: handles (5), owners (330) and subclass markers (100) or not. */
export interface IfcDxfStyle {
  /** Next handle, or undefined for a file without handles (R12). */
  handle?: () => string
  /** Write AcDb subclass markers and 330 owners (R13+). */
  subclass?: boolean
  /** The owner handle of what is written (LAYER table, APPID table, *Model_Space record). */
  owner?: string
}

const pair = (code: string, value: string | number) => `${code}\n${value}\n`
const fixed = (v: number) => (Number.isFinite(v) ? v : 0).toFixed(6)

function head(type: string, st: IfcDxfStyle, ...subclasses: string[]): string {
  let out = pair('  0', type)
  if (st.handle) out += pair('  5', st.handle())
  if (st.subclass && st.owner) out += pair('330', st.owner)
  if (st.subclass) for (const s of subclasses) out += pair('100', s)
  return out
}

/** The LAYER record of the hidden layer. */
export function ifcDxfLayerRecord(st: IfcDxfStyle = {}): string {
  let out = head('LAYER', st, 'AcDbSymbolTableRecord', 'AcDbLayerTableRecord') +
    pair('  2', IFC_DXF_LAYER) +
    pair(' 70', 1) + // frozen
    pair(' 62', -8) + // off (a negative colour is how DXF says it)
    pair('  6', 'CONTINUOUS')
  if (st.subclass) out += pair('290', 0) + pair('370', -3) // never plotted
  return out
}

/** One APPID record. */
export function ifcDxfAppIdRecord(st: IfcDxfStyle = {}, name = IFC_DXF_APPID): string {
  return head('APPID', st, 'AcDbSymbolTableRecord', 'AcDbRegAppTableRecord') + pair('  2', name) + pair(' 70', 0)
}

/** The carrier POINTs of the blobs (one per part), on the hidden layer. */
export function ifcDxfCarriers(blobs: readonly IfcDxfBlob[], st: IfcDxfStyle = {}): string {
  let out = ''
  for (const b of blobs) {
    const parts = chunks(encodeIfcDxfPayload(b), IFC_DXF_PART)
    parts.forEach((part, i) => {
      out += head('POINT', st, 'AcDbEntity') + pair('  8', IFC_DXF_LAYER)
      if (st.subclass) out += pair('100', 'AcDbPoint')
      out += pair(' 10', fixed(b.at?.x ?? 0)) + pair(' 20', fixed(b.at?.y ?? 0)) + pair(' 30', fixed(0))
      out += pair('1001', IFC_DXF_APPID) + pair('1000', IFC_DXF_FORMAT) + pair('1000', b.guid) +
        pair('1070', i + 1) + pair('1070', parts.length)
      for (const c of chunks(part, IFC_DXF_CHUNK)) out += pair('1000', c)
    })
  }
  return out
}

// ---------------------------------------------------------------- the DXF as tags --

type Tag = [string, string]

function tagsOf(text: string): { tags: Tag[]; eol: string } {
  const eol = text.includes('\r\n') ? '\r\n' : '\n'
  const lines = text.split(/\r?\n/)
  const tags: Tag[] = []
  for (let i = 0; i + 1 < lines.length; i += 2) tags.push([lines[i]!, lines[i + 1]!])
  return { tags, eol }
}

const code = (t: Tag | undefined) => (t ? t[0].trim() : '')
const is = (t: Tag | undefined, c: string, v?: string) => !!t && code(t) === c && (v === undefined || t[1].trim().toUpperCase() === v.toUpperCase())

/** Index of the (0, SECTION)(2, name) pair, or -1. */
function sectionAt(tags: Tag[], name: string): number {
  for (let i = 0; i + 1 < tags.length; i++) if (is(tags[i], '0', 'SECTION') && is(tags[i + 1], '2', name)) return i
  return -1
}

function endsecFrom(tags: Tag[], i: number): number {
  for (let j = i; j < tags.length; j++) if (is(tags[j], '0', 'ENDSEC')) return j
  return -1
}

/** [start, endtab] of TABLE `name` inside the TABLES section, or null. */
function tableAt(tags: Tag[], from: number, to: number, name: string): [number, number] | null {
  for (let i = from; i + 1 < to; i++) {
    if (is(tags[i], '0', 'TABLE') && is(tags[i + 1], '2', name)) {
      for (let j = i + 2; j < to; j++) if (is(tags[j], '0', 'ENDTAB')) return [i, j]
    }
  }
  return null
}

const fromText = (s: string): Tag[] => tagsOf(s).tags

/** Records of one table as [start index, name]. */
function recordsOf(tags: Tag[], [s, e]: [number, number], type: string): { at: number; name: string; handle?: string }[] {
  const out: { at: number; name: string; handle?: string }[] = []
  for (let i = s + 2; i < e; i++) {
    if (!is(tags[i], '0', type)) continue
    let name = '', handle: string | undefined
    for (let j = i + 1; j < e && code(tags[j]) !== '0'; j++) {
      if (code(tags[j]) === '2' && !name) name = tags[j]![1].trim()
      if (code(tags[j]) === '5' && !handle) handle = tags[j]![1].trim()
    }
    out.push({ at: i, name, ...(handle ? { handle } : {}) })
  }
  return out
}

function tableHandle(tags: Tag[], start: number): string | undefined {
  for (let j = start + 2; j < tags.length && code(tags[j]) !== '0'; j++) if (code(tags[j]) === '5') return tags[j]![1].trim()
  return undefined
}

function bumpCount(tags: Tag[], start: number, by: number): void {
  for (let j = start + 2; j < tags.length && code(tags[j]) !== '0'; j++) {
    if (code(tags[j]) === '70') {
      tags[j] = [tags[j]![0], String((parseInt(tags[j]![1], 10) || 0) + by)]
      return
    }
  }
}

/** Drop every entity on the hidden layer between [from, to); returns how many tags went. */
function dropCarriers(tags: Tag[], from: number, to: number): number {
  let removed = 0
  let i = from
  while (i < to - removed) {
    if (code(tags[i]) !== '0') { i++; continue }
    let j = i + 1
    let mine = false
    while (j < to - removed && code(tags[j]) !== '0') {
      if (code(tags[j]) === '8' && tags[j]![1].trim().toUpperCase() === IFC_DXF_LAYER) mine = true
      j++
    }
    if (mine) { tags.splice(i, j - i); removed += j - i } else i = j
  }
  return removed
}

/**
 * `dxf` with the IFC data of `blobs` on the hidden layer: the APK_IFC layer and APPID
 * declared, one carrier POINT per object part in ENTITIES, $HANDSEED past every new
 * handle. Writing it twice replaces the first carriers. Every other tag of the file is
 * left exactly as it was.
 */
export function addIfcToDxf(dxf: string, blobs: readonly IfcDxfBlob[]): string {
  const { tags, eol } = tagsOf(dxf)
  // ---- the file's own style
  let seedAt = -1
  let acadver = ''
  for (let i = 0; i + 1 < tags.length; i++) {
    if (is(tags[i], '9', '$HANDSEED') && code(tags[i + 1]) === '5') seedAt = i + 1
    if (is(tags[i], '9', '$ACADVER')) acadver = tags[i + 1]![1].trim().toUpperCase()
    if (is(tags[i], '0', 'ENDSEC') && seedAt >= 0) break
  }
  const handles = seedAt >= 0
  const subclass = handles && acadver !== '' && acadver > 'AC1009'
  let next = 0
  if (handles) {
    next = parseInt(tags[seedAt]![1].trim(), 16) || 1
    for (const t of tags) {
      const c = code(t)
      if (c === '5' || c === '105') {
        const h = parseInt(t[1].trim(), 16)
        if (Number.isFinite(h) && h >= next) next = h + 1
      }
    }
  }
  const handle = handles ? () => (next++).toString(16).toUpperCase() : undefined
  const style = (owner?: string): IfcDxfStyle => ({ ...(handle ? { handle } : {}), subclass, ...(owner ? { owner } : {}) })

  // ---- TABLES (made when the file has none)
  let tablesAt = sectionAt(tags, 'TABLES')
  if (tablesAt < 0) {
    const headerAt = sectionAt(tags, 'HEADER')
    const at = headerAt >= 0 ? endsecFrom(tags, headerAt) + 1 : 0
    tags.splice(at, 0, ['  0', 'SECTION'], ['  2', 'TABLES'], ['  0', 'ENDSEC'])
    tablesAt = at
  }
  let tablesEnd = endsecFrom(tags, tablesAt)

  // LAYER
  let layer = tableAt(tags, tablesAt, tablesEnd, 'LAYER')
  if (!layer) {
    const t = fromText(pair('  0', 'TABLE') + pair('  2', 'LAYER') + (handle ? pair('  5', handle()) : '') +
      (subclass ? pair('330', '0') + pair('100', 'AcDbSymbolTable') : '') + pair(' 70', 0) + pair('  0', 'ENDTAB'))
    tags.splice(tablesEnd, 0, ...t)
    tablesEnd += t.length
    layer = tableAt(tags, tablesAt, tablesEnd, 'LAYER')!
  }
  if (!recordsOf(tags, layer, 'LAYER').some((r) => r.name.toUpperCase() === IFC_DXF_LAYER)) {
    const t = fromText(ifcDxfLayerRecord(style(tableHandle(tags, layer[0]))))
    tags.splice(layer[1], 0, ...t)
    bumpCount(tags, layer[0], 1)
    tablesEnd += t.length
  }

  // APPID
  const appid = tableAt(tags, tablesAt, tablesEnd, 'APPID')
  if (appid) {
    const names = recordsOf(tags, appid, 'APPID').map((r) => r.name.toUpperCase())
    if (!names.includes(IFC_DXF_APPID)) {
      const t = fromText(ifcDxfAppIdRecord(style(tableHandle(tags, appid[0]))))
      tags.splice(appid[1], 0, ...t)
      bumpCount(tags, appid[0], 1)
      tablesEnd += t.length
    }
  } else {
    const own = handle ? handle() : undefined
    const t = fromText(pair('  0', 'TABLE') + pair('  2', 'APPID') + (own ? pair('  5', own) : '') +
      (subclass ? pair('330', '0') + pair('100', 'AcDbSymbolTable') : '') + pair(' 70', 2) +
      ifcDxfAppIdRecord(style(own), 'ACAD') + ifcDxfAppIdRecord(style(own)) + pair('  0', 'ENDTAB'))
    // conventional order: before BLOCK_RECORD (R2000) when it is there, else last
    const br = tableAt(tags, tablesAt, tablesEnd, 'BLOCK_RECORD')
    const at = br ? br[0] : tablesEnd
    tags.splice(at, 0, ...t)
    tablesEnd += t.length
  }

  // ---- ENTITIES
  let model: string | undefined
  const br = tableAt(tags, tablesAt, tablesEnd, 'BLOCK_RECORD')
  if (br) model = recordsOf(tags, br, 'BLOCK_RECORD').find((r) => r.name.toUpperCase() === '*MODEL_SPACE')?.handle
  let entAt = sectionAt(tags, 'ENTITIES')
  if (entAt < 0) {
    let eof = tags.findIndex((t) => is(t, '0', 'EOF'))
    if (eof < 0) { tags.push(['  0', 'EOF']); eof = tags.length - 1 }
    tags.splice(eof, 0, ['  0', 'SECTION'], ['  2', 'ENTITIES'], ['  0', 'ENDSEC'])
    entAt = eof
  }
  let entEnd = endsecFrom(tags, entAt)
  entEnd -= dropCarriers(tags, entAt + 2, entEnd)
  tags.splice(entEnd, 0, ...fromText(ifcDxfCarriers(blobs, style(model))))

  if (handles) tags[seedAt] = [tags[seedAt]![0], (next + 16).toString(16).toUpperCase()]
  return tags.map(([c, v]) => `${c}${eol}${v}${eol}`).join('')
}

// ---------------------------------------------------------------- reading --

/** Every object a DXF carries on the hidden layer, parts joined, in the order the file first names them. */
export function readIfcDxf(dxf: string): IfcDxfBlob[] {
  const { tags } = tagsOf(dxf)
  const parts = new Map<string, { n: number; got: Map<number, string>; at: { x: number; y: number } }>()
  for (let i = 0; i < tags.length; i++) {
    if (!is(tags[i], '1001', IFC_DXF_APPID)) continue
    // the entity this XDATA hangs on: its layer and its point
    let s = i
    while (s > 0 && code(tags[s]) !== '0') s--
    let layer = '', x = 0, y = 0
    for (let k = s + 1; k < i; k++) {
      const c = code(tags[k])
      if (c === '8') layer = tags[k]![1].trim().toUpperCase()
      else if (c === '10') x = Number(tags[k]![1])
      else if (c === '20') y = Number(tags[k]![1])
    }
    if (layer !== IFC_DXF_LAYER) continue
    const vals: [string, string][] = []
    for (let k = i + 1; k < tags.length && code(tags[k]) !== '0' && code(tags[k]) !== '1001'; k++) vals.push([code(tags[k]), tags[k]![1]])
    if (vals[0]?.[1].trim() !== IFC_DXF_FORMAT || vals[1]?.[0] !== '1000') continue
    const guid = vals[1][1].trim()
    const part = Number(vals[2]?.[1]), count = Number(vals[3]?.[1])
    if (!(part >= 1) || !(count >= part)) continue
    const text = vals.slice(4).filter(([c]) => c === '1000').map(([, v]) => v.replace(/\r$/, '')).join('')
    const slot = parts.get(guid) ?? { n: count, got: new Map(), at: { x, y } }
    slot.got.set(part, text)
    parts.set(guid, slot)
  }
  const out: IfcDxfBlob[] = []
  for (const [guid, slot] of parts) {
    if (slot.got.size !== slot.n) throw new Error(`apk-ifc-dxf: ${guid} has ${slot.got.size} of ${slot.n} parts`)
    const text = Array.from({ length: slot.n }, (_, k) => slot.got.get(k + 1)).join('')
    out.push({ ...decodeIfcDxfPayload(text), at: slot.at })
  }
  return out
}
