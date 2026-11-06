// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
/**
 * A small ISO 10303-21 (STEP physical file) reader/writer for the APK IFC
 * subset (viewers-plumbing-2). Own MIT code, no dependencies, no schema: it
 * reads every entity generically into {id, type, args}, so a foreign file with
 * entities APK never writes is kept whole and written back without loss.
 * Geometry is not interpreted. IfcOpenShell stays the validation oracle (tests).
 *
 * Values (StepValue):
 *   'text'              -> string ('' quotes and \X2\ \X4\ \X\ \S\ escapes decoded)
 *   12, -3              -> number (STEP INTEGER)
 *   1.  0.5  1.E-05     -> {kind:'real', value, raw}  (raw keeps the exact lexeme)
 *   .SINK.              -> {kind:'enum', value:'SINK'}
 *   #12                 -> {kind:'ref', id:12}
 *   $                   -> null
 *   *                   -> DERIVED
 *   (a,b)               -> StepValue[]
 *   IFCLABEL('x')       -> {kind:'typed', type:'IFCLABEL', value:'x'}
 *   "0FF"               -> {kind:'binary', value:'0FF'}
 *
 * writeStep(parseStep(text)) === text for every file DATABASE.server.BIM
 * bim/ifc.py writes (held by test on contracts/vectors/ifc/parts). Files from
 * other writers come back equal in content, normalised in layout.
 */

export type StepReal = { kind: 'real'; value: number; raw?: string }
export type StepEnum = { kind: 'enum'; value: string }
export type StepRef = { kind: 'ref'; id: number }
export type StepTyped = { kind: 'typed'; type: string; value: StepValue }
export type StepBinary = { kind: 'binary'; value: string }
export type StepDerived = { kind: 'derived' }
export type StepValue =
  | null
  | string
  | number
  | StepReal
  | StepEnum
  | StepRef
  | StepTyped
  | StepBinary
  | StepDerived
  | StepValue[]

/** One header record or one simple instance's parameters. */
export type StepRecord = { type: string; args: StepValue[] }
/** One DATA instance. A complex instance (#1=(A()B());) has type '' and its parts in `complex`. */
export type StepEntity = StepRecord & { id: number; complex?: StepRecord[] }
export type StepFile = { header: StepRecord[]; entities: StepEntity[]; byId: Map<number, StepEntity> }

export const DERIVED: StepDerived = Object.freeze({ kind: 'derived' }) as StepDerived
export const real = (value: number): StepReal => ({ kind: 'real', value })
export const enumv = (value: string): StepEnum => ({ kind: 'enum', value })
export const ref = (id: number): StepRef => ({ kind: 'ref', id })
export const typed = (type: string, value: StepValue): StepTyped => ({ kind: 'typed', type, value })

const isObj = (v: StepValue): v is Exclude<StepValue, null | string | number | StepValue[]> =>
  v !== null && typeof v === 'object' && !Array.isArray(v)
export const isRef = (v: StepValue | undefined): v is StepRef => v != null && isObj(v) && v.kind === 'ref'

// ---------------------------------------------------------------- reading --

class Reader {
  i = 0
  constructor(readonly s: string) {}

  fail(msg: string): never {
    const line = this.s.slice(0, this.i).split('\n').length
    throw new Error(`STEP: ${msg} at line ${line}`)
  }

  ws(): void {
    for (;;) {
      const c = this.s.charCodeAt(this.i)
      if (c === 32 || c === 9 || c === 10 || c === 13) this.i++
      else if (c === 47 && this.s[this.i + 1] === '*') {
        const end = this.s.indexOf('*/', this.i + 2)
        if (end < 0) this.fail('unterminated comment')
        this.i = end + 2
      } else return
    }
  }

  peek(): string {
    this.ws()
    return this.s[this.i] ?? ''
  }

  eat(ch: string): void {
    if (this.peek() !== ch) this.fail(`expected '${ch}'`)
    this.i++
  }

  keyword(): string {
    this.ws()
    const m = /^!?[A-Za-z_][A-Za-z0-9_-]*/.exec(this.s.slice(this.i, this.i + 256))
    if (!m) this.fail('expected a keyword')
    this.i += m[0].length
    return m[0].toUpperCase()
  }

  /** `KEYWORD(params)` */
  record(): StepRecord {
    const type = this.keyword()
    return { type, args: this.list() }
  }

  list(): StepValue[] {
    this.eat('(')
    const out: StepValue[] = []
    if (this.peek() === ')') {
      this.i++
      return out
    }
    for (;;) {
      out.push(this.value())
      const c = this.peek()
      this.i++
      if (c === ')') return out
      if (c !== ',') this.fail("expected ',' or ')'")
    }
  }

  value(): StepValue {
    const c = this.peek()
    if (c === "'") return this.string()
    if (c === '(') return this.list()
    if (c === '$') return this.i++, null
    if (c === '*') return this.i++, DERIVED
    if (c === '#') {
      const m = /^#(\d+)/.exec(this.s.slice(this.i, this.i + 32))
      if (!m) this.fail('bad reference')
      this.i += m[0].length
      return { kind: 'ref', id: Number(m[1]) }
    }
    if (c === '.') {
      const m = /^\.([A-Za-z_][A-Za-z0-9_]*)\./.exec(this.s.slice(this.i, this.i + 256))
      if (!m) this.fail('bad enumeration')
      this.i += m[0].length
      return { kind: 'enum', value: m[1]!.toUpperCase() }
    }
    if (c === '"') {
      const end = this.s.indexOf('"', this.i + 1)
      if (end < 0) this.fail('unterminated binary')
      const value = this.s.slice(this.i + 1, end)
      this.i = end + 1
      return { kind: 'binary', value }
    }
    if (/[-+0-9]/.test(c)) {
      const m = /^[-+]?\d+(\.\d*)?([eE][-+]?\d+)?/.exec(this.s.slice(this.i, this.i + 64))
      if (!m) this.fail('bad number')
      this.i += m[0].length
      if (m[1] === undefined && m[2] === undefined) return Number(m[0])
      return { kind: 'real', value: Number(m[0]), raw: m[0] }
    }
    if (/[A-Za-z_!]/.test(c)) {
      const type = this.keyword()
      const args = this.list()
      return { kind: 'typed', type, value: args.length === 1 ? args[0]! : args }
    }
    return this.fail(`unexpected '${c}'`)
  }

  string(): string {
    const s = this.s
    let i = this.i + 1
    let out = ''
    for (;;) {
      const c = s[i]
      if (c === undefined) this.fail('unterminated string')
      if (c === "'") {
        if (s[i + 1] === "'") {
          out += "'"
          i += 2
          continue
        }
        this.i = i + 1
        return out
      }
      if (c === '\\') {
        const rest = s.slice(i, i + 4)
        if (rest.startsWith('\\\\')) {
          out += '\\'
          i += 2
        } else if (rest === '\\X2\\' || rest === '\\X4\\') {
          const width = rest === '\\X2\\' ? 4 : 8
          const end = s.indexOf('\\X0\\', i + 4)
          if (end < 0) this.fail('unterminated \\X2\\ or \\X4\\')
          const hex = s.slice(i + 4, end)
          if (hex.length % width || /[^0-9A-Fa-f]/.test(hex)) this.fail('bad \\X2\\ or \\X4\\ hex')
          for (let k = 0; k < hex.length; k += width) {
            const code = parseInt(hex.slice(k, k + width), 16)
            out += width === 4 ? String.fromCharCode(code) : String.fromCodePoint(code)
          }
          i = end + 4
        } else if (rest.startsWith('\\X\\')) {
          out += String.fromCharCode(parseInt(s.slice(i + 3, i + 5), 16))
          i += 5
        } else if (rest.startsWith('\\S\\')) {
          out += String.fromCharCode(s.charCodeAt(i + 3) + 128)
          i += 4
        } else if (/^\\P[A-I]\\/.test(rest)) {
          i += 4 // code page switch: \S\ is read as ISO 8859-1 regardless
        } else {
          out += '\\'
          i += 1
        }
        continue
      }
      out += c
      i++
    }
  }
}

/** Parse a whole ISO 10303-21 file. Throws with a line number on malformed input. */
export function parseStep(text: string): StepFile {
  const r: Reader = new Reader(text)
  const word = (w: string) => {
    if (r.keyword() !== w) r.fail(`expected ${w}`)
  }
  word('ISO-10303-21')
  r.eat(';')
  word('HEADER')
  r.eat(';')
  const header: StepRecord[] = []
  for (r.ws(); !/^ENDSEC\b/i.test(text.slice(r.i, r.i + 7)); r.ws()) {
    header.push(r.record())
    r.eat(';')
  }
  word('ENDSEC')
  r.eat(';')
  word('DATA')
  if (r.peek() === '(') r.list() // DATA(name, schemas) — kept simple: not retained
  r.eat(';')
  const entities: StepEntity[] = []
  const byId = new Map<number, StepEntity>()
  while (r.peek() === '#') {
    const m = /^#(\d+)/.exec(text.slice(r.i, r.i + 32))
    if (!m) r.fail('bad instance name')
    r.i += m[0].length
    r.eat('=')
    let e: StepEntity
    if (r.peek() === '(') {
      r.i++
      const complex: StepRecord[] = []
      while (r.peek() !== ')') complex.push(r.record())
      r.i++
      e = { id: Number(m[1]), type: '', args: [], complex }
    } else {
      e = { id: Number(m[1]), ...r.record() }
    }
    r.eat(';')
    if (byId.has(e.id)) r.fail(`duplicate #${e.id}`)
    entities.push(e)
    byId.set(e.id, e)
  }
  word('ENDSEC')
  r.eat(';')
  word('END-ISO-10303-21')
  r.eat(';')
  return { header, entities, byId }
}

// ---------------------------------------------------------------- writing --

/** A STEP string literal, the same encoding bim/ifc.py s() uses ('' and \\ and per-char \X2\). */
export function encodeString(text: string): string {
  let out = "'"
  for (const ch of text) {
    const cp = ch.codePointAt(0)!
    if (ch === "'") out += "''"
    else if (ch === '\\') out += '\\\\'
    else if (cp >= 32 && cp < 127) out += ch
    else if (cp <= 0xffff) out += `\\X2\\${cp.toString(16).toUpperCase().padStart(4, '0')}\\X0\\`
    else out += `\\X4\\${cp.toString(16).toUpperCase().padStart(8, '0')}\\X0\\`
  }
  return out + "'"
}

/** A REAL with no source lexeme: '3.' for whole numbers, else shortest form with a '.' and 'E'. */
export function formatReal(x: number): string {
  if (!Number.isFinite(x)) throw new Error(`STEP has no ${x}`)
  if (Number.isInteger(x) && Math.abs(x) < 1e21) return `${x.toFixed(0)}.`
  const s = String(x)
  const m = /^(-?\d+)(\.\d+)?e([-+]\d+)$/.exec(s)
  if (!m) return s
  return `${m[1]}${m[2] ?? '.'}E${m[3]!.replace('+', '')}`
}

export function writeValue(v: StepValue): string {
  if (v === null) return '$'
  if (typeof v === 'string') return encodeString(v)
  if (typeof v === 'number') {
    if (!Number.isInteger(v)) throw new Error(`STEP INTEGER expected, got ${v} (use real())`)
    return String(v)
  }
  if (Array.isArray(v)) return `(${v.map(writeValue).join(',')})`
  switch (v.kind) {
    case 'real':
      return v.raw !== undefined && Number(v.raw) === v.value ? v.raw : formatReal(v.value)
    case 'enum':
      return `.${v.value}.`
    case 'ref':
      return `#${v.id}`
    case 'typed':
      return `${v.type}(${writeValue(v.value)})`
    case 'binary':
      return `"${v.value}"`
    case 'derived':
      return '*'
  }
}

const writeRecord = (r: StepRecord) => `${r.type}(${r.args.map(writeValue).join(',')})`

export function writeEntity(e: StepEntity): string {
  const body = e.complex ? `(${e.complex.map(writeRecord).join('')})` : writeRecord(e)
  return `#${e.id}=${body};`
}

/** Write a file in the layout bim/ifc.py uses: one record per line, no spaces, trailing newline. */
export function writeStep(file: Pick<StepFile, 'header' | 'entities'>): string {
  return [
    'ISO-10303-21;',
    'HEADER;',
    ...file.header.map((h) => `${writeRecord(h)};`),
    'ENDSEC;',
    'DATA;',
    ...file.entities.map(writeEntity),
    'ENDSEC;',
    'END-ISO-10303-21;',
    '',
  ].join('\n')
}

// ---------------------------------------------------------------- helpers --

/** The schema id from FILE_SCHEMA, e.g. 'IFC4X3_ADD2'. */
export function schemaOf(file: StepFile): string | undefined {
  const fs = file.header.find((h) => h.type === 'FILE_SCHEMA')?.args[0]
  return Array.isArray(fs) && typeof fs[0] === 'string' ? fs[0] : undefined
}

/** Every entity of exactly this type (no inheritance — there is no schema here). */
export function entitiesByType(file: StepFile, type: string): StepEntity[] {
  const t = type.toUpperCase()
  return file.entities.filter((e) => e.type === t)
}

const inverses = new WeakMap<StepFile, Map<number, StepEntity[]>>()

/** id -> the entities whose arguments reference it (each referrer once, file order). Cached per file. */
export function inverseIndex(file: StepFile): Map<number, StepEntity[]> {
  let inv = inverses.get(file)
  if (inv) return inv
  inv = new Map()
  const walk = (v: StepValue, from: StepEntity, seen: Set<number>) => {
    if (Array.isArray(v)) v.forEach((x) => walk(x, from, seen))
    else if (isRef(v)) {
      if (seen.has(v.id)) return
      seen.add(v.id)
      const list = inv!.get(v.id)
      if (list) list.push(from)
      else inv!.set(v.id, [from])
    } else if (isObj(v) && v.kind === 'typed') walk(v.value, from, seen)
  }
  for (const e of file.entities) {
    const seen = new Set<number>()
    for (const a of e.args) walk(a, e, seen)
    for (const p of e.complex ?? []) for (const a of p.args) walk(a, e, seen)
  }
  inverses.set(file, inv)
  return inv
}

/** The entity a reference points at (undefined for $, a dangling ref, or a non-ref). */
export function deref(file: StepFile, v: StepValue | undefined): StepEntity | undefined {
  return isRef(v) ? file.byId.get(v.id) : undefined
}

const refsIn = (v: StepValue | undefined): number[] =>
  Array.isArray(v) ? v.flatMap(refsIn) : isRef(v) ? [v.id] : []

/** Referrers of `id` of one type whose argument `index` points at it. */
function referrers(file: StepFile, id: number, type: string, index: number): StepEntity[] {
  return (inverseIndex(file).get(id) ?? []).filter((r) => r.type === type && refsIn(r.args[index]).includes(id))
}

/** A plain JS value: typed values unwrapped, reals as numbers, enums as strings (.T./.F. as booleans). */
export function unwrap(v: StepValue | undefined): unknown {
  if (v === undefined || v === null) return null
  if (typeof v === 'string' || typeof v === 'number') return v
  if (Array.isArray(v)) return v.map(unwrap)
  switch (v.kind) {
    case 'real':
      return v.value
    case 'enum':
      return v.value === 'T' ? true : v.value === 'F' ? false : v.value === 'U' ? 'UNKNOWN' : v.value
    case 'typed':
      return unwrap(v.value)
    case 'ref':
      return { ref: v.id }
    case 'binary':
      return v.value
    case 'derived':
      return null
  }
}

/** IfcTypeObject and its subtypes, recognised by name (checked against IFC2X3/IFC4/IFC4X3_ADD2). */
export const isTypeObject = (type: string): boolean =>
  type !== 'IFCRELDEFINESBYTYPE' && (/TYPE$|^IFCTYPE/.test(type) || /^IFC(DOOR|WINDOW)STYLE$/.test(type))

export type PsetProperty = { value: unknown; measure?: string; unit?: StepEntity }
export type Psets = Record<string, Record<string, unknown>>

/** The value of one property (IfcProperty* / IfcQuantity*), as IfcOpenShell's get_psets gives it. */
function propertyValue(file: StepFile, p: StepEntity): PsetProperty {
  const a = p.args
  const measured = (v: StepValue | undefined, unitAt: number): PsetProperty => {
    const out: PsetProperty = { value: unwrap(v) }
    if (v != null && isObj(v) && v.kind === 'typed') out.measure = v.type
    const unit = deref(file, a[unitAt])
    if (unit) out.unit = unit
    return out
  }
  switch (p.type) {
    case 'IFCPROPERTYSINGLEVALUE': // Name, Specification, NominalValue, Unit
      return measured(a[2], 3)
    case 'IFCPROPERTYLISTVALUE': // Name, Specification, ListValues, Unit
    case 'IFCPROPERTYENUMERATEDVALUE': // Name, Specification, EnumerationValues, EnumerationReference
      return measured(a[2], p.type === 'IFCPROPERTYLISTVALUE' ? 3 : -1)
    case 'IFCPROPERTYBOUNDEDVALUE': // Name, Specification, UpperBoundValue, LowerBoundValue, Unit, SetPointValue
      return {
        value: { UpperBoundValue: unwrap(a[2]), LowerBoundValue: unwrap(a[3]), SetPointValue: unwrap(a[5]) },
        ...(deref(file, a[4]) ? { unit: deref(file, a[4])! } : {}),
      }
    case 'IFCPROPERTYREFERENCEVALUE': // Name, Specification, UsageName, PropertyReference
      return { value: unwrap(a[3]) }
    default:
      if (p.type.startsWith('IFCQUANTITY')) return measured(a[3], 2) // Name, Description, Unit, <Value>, …
      return { value: unwrap(a[2]) }
  }
}

function definitionProps(file: StepFile, def: StepEntity, detail: boolean): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  // IfcPropertySet.HasProperties is attribute 4; IfcElementQuantity.Quantities is 5 (after MethodOfMeasurement).
  const list = def.type === 'IFCELEMENTQUANTITY' ? def.args[5] : def.args[4]
  for (const id of refsIn(list)) {
    const p = file.byId.get(id)
    if (!p || typeof p.args[0] !== 'string') continue
    if (p.type === 'IFCCOMPLEXPROPERTY') {
      // Name, Specification, UsageName, HasProperties
      out[p.args[0]] = definitionProps(file, { ...p, args: [null, null, null, null, p.args[3] ?? null] }, detail)
      continue
    }
    const v = propertyValue(file, p)
    out[p.args[0]] = detail ? v : v.value
  }
  return out
}

/**
 * Property and quantity sets of an object, merged the way IfcOpenShell's
 * util.element.get_psets does: the type's HasPropertySets first, then the
 * occurrence's IfcRelDefinesByProperties on top. `detail` gives
 * {value, measure, unit} per property (the unit is where Vpp/Vpk/dBu live).
 */
export function getPsets(file: StepFile, entity: StepEntity, opts: { detail?: boolean } = {}): Psets {
  const detail = opts.detail ?? false
  const out: Psets = {}
  const add = (def: StepEntity | undefined) => {
    if (!def || typeof def.args[2] !== 'string') return
    Object.assign((out[def.args[2]] ??= {}), definitionProps(file, def, detail))
  }
  if (isTypeObject(entity.type)) {
    refsIn(entity.args[5]).forEach((id) => add(file.byId.get(id)))
    return out
  }
  for (const rel of referrers(file, entity.id, 'IFCRELDEFINESBYTYPE', 4)) {
    const type = deref(file, rel.args[5])
    if (type) Object.assign(out, getPsets(file, type, opts))
  }
  for (const rel of referrers(file, entity.id, 'IFCRELDEFINESBYPROPERTIES', 4)) {
    refsIn(rel.args[5]).forEach((id) => add(file.byId.get(id)))
  }
  return out
}

/** The IfcDistributionPorts nested under an element (IfcRelNests), plus IFC2X3's IfcRelConnectsPortToElement. */
export function ports(file: StepFile, element: StepEntity): StepEntity[] {
  const out: StepEntity[] = []
  for (const rel of referrers(file, element.id, 'IFCRELNESTS', 4)) {
    for (const id of refsIn(rel.args[5])) {
      const p = file.byId.get(id)
      if (p?.type === 'IFCDISTRIBUTIONPORT') out.push(p)
    }
  }
  for (const rel of referrers(file, element.id, 'IFCRELCONNECTSPORTTOELEMENT', 5)) {
    const p = deref(file, rel.args[4])
    if (p) out.push(p)
  }
  return out
}

export type PortConnection = {
  rel: StepEntity
  relating: StepEntity | undefined
  related: StepEntity | undefined
  realizing: StepEntity | undefined
}

/** Every IfcRelConnectsPorts: RelatingPort -> RelatedPort, and the cable (RealizingElement) if any. */
export function connections(file: StepFile): PortConnection[] {
  return entitiesByType(file, 'IFCRELCONNECTSPORTS').map((rel) => ({
    rel,
    relating: deref(file, rel.args[4]),
    related: deref(file, rel.args[5]),
    realizing: deref(file, rel.args[6]),
  }))
}
