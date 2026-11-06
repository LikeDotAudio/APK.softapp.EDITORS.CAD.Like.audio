// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
/**
 * ONE GlobalId RULE, site-wide (viewers-plumbing-1).
 *
 *   ifcGuid(...roles) = uuid5(IFC_GUID_NAMESPACE, roles.join('/'))
 *                       packed into 22 characters of IFC base64 (0-9A-Za-z_$),
 *                       most significant first
 *
 * Bit-identical to DATABASE.server.BIM `bim/ifc.py guid()` and to
 * `ifcopenshell.guid.compress(uuid5(...).hex)`; the Python twin is
 * `apkaudio_contracts.ifc_guid`. All three are held to contracts/vectors/ifc-guid.json,
 * which is generated FROM ifc.py (contracts/scripts/ifc_vectors.py).
 *
 * Synchronous and dependency-free on purpose: crypto.subtle is async and absent
 * on http://apk.local:8080 (not a secure context), so SHA-1 is done here.
 *
 * ROLE GRAMMAR (the roles are the identity; never an IP, never a bench ref
 * like U1, because refs renumber):
 *   type                  part/<maker>/<model>
 *   port on a type        part/<id>/port/<i>/<n>
 *   occurrence            inst/mac:<mac> | inst/serial:<maker>/<serial> | inst/nmos:<uuid>
 *   declared device       decl/<project-gid>/<name>
 *   spatial               site/<project-gid>/<slug> … space/<drawing-id>/<room-key>
 *   relationship          rel/<kind>/<gidA>/<gidB>
 * ifc.py's existing per-part roles (<id>, 'element' | 'project' | 'port', i | …)
 * keep their strings so files already exported keep their ids.
 * Changing the namespace or a role string re-identifies every object.
 */

export const IFC_GUID_NAMESPACE = '6f1d3a52-7c0b-4b8e-9a51-6b8f0a7d3e11'
export const IFC_GUID_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_$'
export const IFC_GUID_RE = /^[0-3][0-9A-Za-z_$]{21}$/

/** SHA-1 (FIPS 180-4) of a byte array — just enough for uuid5. */
export function sha1(bytes: Uint8Array): Uint8Array {
  const ml = bytes.length
  const words = (((ml + 8) >> 6) + 1) * 16
  const w32 = new Uint32Array(words)
  for (let i = 0; i < ml; i++) w32[i >> 2]! |= bytes[i]! << (24 - (i % 4) * 8)
  w32[ml >> 2]! |= 0x80 << (24 - (ml % 4) * 8)
  w32[words - 2] = Math.floor((ml * 8) / 0x100000000)
  w32[words - 1] = (ml * 8) >>> 0
  let h0 = 0x67452301, h1 = 0xefcdab89, h2 = 0x98badcfe, h3 = 0x10325476, h4 = 0xc3d2e1f0
  const w = new Uint32Array(80)
  for (let off = 0; off < words; off += 16) {
    for (let t = 0; t < 16; t++) w[t] = w32[off + t]!
    for (let t = 16; t < 80; t++) {
      const x = w[t - 3]! ^ w[t - 8]! ^ w[t - 14]! ^ w[t - 16]!
      w[t] = (x << 1) | (x >>> 31)
    }
    let a = h0, b = h1, c = h2, d = h3, e = h4
    for (let t = 0; t < 80; t++) {
      const f = t < 20 ? (b & c) | (~b & d) : t < 40 ? b ^ c ^ d : t < 60 ? (b & c) | (b & d) | (c & d) : b ^ c ^ d
      const k = t < 20 ? 0x5a827999 : t < 40 ? 0x6ed9eba1 : t < 60 ? 0x8f1bbcdc : 0xca62c1d6
      const tmp = (((a << 5) | (a >>> 27)) + f + e + k + w[t]!) >>> 0
      e = d; d = c; c = (b << 30) | (b >>> 2); b = a; a = tmp
    }
    h0 = (h0 + a) >>> 0; h1 = (h1 + b) >>> 0; h2 = (h2 + c) >>> 0; h3 = (h3 + d) >>> 0; h4 = (h4 + e) >>> 0
  }
  const out = new Uint8Array(20)
  ;[h0, h1, h2, h3, h4].forEach((h, i) => {
    out[i * 4] = h >>> 24; out[i * 4 + 1] = (h >>> 16) & 255; out[i * 4 + 2] = (h >>> 8) & 255; out[i * 4 + 3] = h & 255
  })
  return out
}

function uuidBytes(uuid: string): Uint8Array {
  const hex = uuid.replace(/-/g, '')
  if (!/^[0-9a-fA-F]{32}$/.test(hex)) throw new Error(`not a UUID: ${uuid}`)
  const b = new Uint8Array(16)
  for (let i = 0; i < 16; i++) b[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  return b
}

/** RFC 4122 v5 UUID bytes of `name` (UTF-8) in `namespace`. */
export function uuid5Bytes(namespace: string, name: string): Uint8Array {
  const ns = uuidBytes(namespace)
  const nm = new TextEncoder().encode(name)
  const buf = new Uint8Array(ns.length + nm.length)
  buf.set(ns)
  buf.set(nm, ns.length)
  const h = sha1(buf).slice(0, 16)
  h[6] = (h[6]! & 0x0f) | 0x50
  h[8] = (h[8]! & 0x3f) | 0x80
  return h
}

/** 16 UUID bytes -> 22-char IFC GlobalId (1 byte -> 2 chars, then 5 x 3 bytes -> 4 chars). */
export function compressGuid(bytes: Uint8Array): string {
  if (bytes.length !== 16) throw new Error('a GUID is 16 bytes')
  const A = IFC_GUID_ALPHABET
  let out = A[bytes[0]! >> 6]! + A[bytes[0]! & 63]!
  for (let i = 1; i < 16; i += 3) {
    const n = (bytes[i]! << 16) | (bytes[i + 1]! << 8) | bytes[i + 2]!
    out += A[(n >> 18) & 63]! + A[(n >> 12) & 63]! + A[(n >> 6) & 63]! + A[n & 63]!
  }
  return out
}

/** 22-char IFC GlobalId -> canonical lower-case UUID string. */
export function expandGuid(gid: string): string {
  if (!IFC_GUID_RE.test(gid)) throw new Error(`not an IFC GlobalId: ${gid}`)
  const v = (c: string) => IFC_GUID_ALPHABET.indexOf(c)
  const b = [(v(gid[0]!) << 6) | v(gid[1]!)]
  for (let i = 2; i < 22; i += 4) {
    const n = (v(gid[i]!) << 18) | (v(gid[i + 1]!) << 12) | (v(gid[i + 2]!) << 6) | v(gid[i + 3]!)
    b.push((n >> 16) & 255, (n >> 8) & 255, n & 255)
  }
  const hex = b.map((x) => x.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

/** The deterministic GlobalId of an object, from its roles (see the grammar above). */
export function ifcGuid(...roles: string[]): string {
  return compressGuid(uuid5Bytes(IFC_GUID_NAMESPACE, roles.join('/')))
}
