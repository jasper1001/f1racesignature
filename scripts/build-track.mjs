/**
 * build-track.mjs <circuitId>
 * ==========================================================================
 * General (per-track, no corner-name lists) builder for the "Racing Line" viz.
 * Produces public/data/tracks/<id>.json: a real OSM track centreline aligned to
 * our circuits.json racing-line path frame, so the telemetry line overlays it.
 *
 * Method — reference-guided snapping:
 *   1. OSM raceway points -> metres -> scaled to PATH units (scale from lapLength).
 *   2. Coarse align to the reference path (circuits.json `path`) by brute rotation
 *      + reflection, scored by one-way chamfer R->P (robust to extra OSM tarmac).
 *   3. ICP refine (rigid, scale fixed).
 *   4. For each ordered reference point, snap to the centroid of nearby aligned OSM
 *      points -> the real centreline, ordered correctly (racing line sits inside).
 *
 * Validation: centreline perimeter (m) ~ lapLength, and normalised alignment RMS.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { COORDS } from './track-coords.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const id = process.argv[2]
if (!id) throw new Error('usage: node scripts/build-track.mjs <circuitId>')

const circuits = JSON.parse(fs.readFileSync(path.join(ROOT, 'public', 'data', 'circuits.json'), 'utf8'))
const circuit = circuits[id]
if (!circuit) throw new Error(`no circuit ${id}`)
const coord = COORDS[id] || {}
const lapLen = coord.lapLength || circuit.lapLength
if (!lapLen) throw new Error(`no lapLength for ${id} (add override in track-coords.mjs)`)
const osm = JSON.parse(fs.readFileSync(path.join(__dirname, 'cache', `${id}_osm.json`), 'utf8'))

// ── helpers ───────────────────────────────────────────────────────────────────
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y)
function perimeter(pts, closed = false) {
  let l = 0
  for (let i = 1; i < pts.length; i++) l += dist(pts[i - 1], pts[i])
  if (closed) l += dist(pts[pts.length - 1], pts[0])
  return l
}
function resample(pts, count, closed = false) {
  const src = closed ? [...pts, pts[0]] : pts
  const cum = [0]; let total = 0
  for (let i = 1; i < src.length; i++) { total += dist(src[i - 1], src[i]); cum.push(total) }
  const out = []
  for (let i = 0; i < count; i++) {
    const target = (i / count) * total
    let j = 0; while (j < cum.length - 2 && cum[j + 1] < target) j++
    const seg = (cum[j + 1] - cum[j]) || 1
    const t = (target - cum[j]) / seg
    out.push({ x: src[j].x + (src[j + 1].x - src[j].x) * t, y: src[j].y + (src[j + 1].y - src[j].y) * t })
  }
  return out
}
function centroid(pts) { let x = 0, y = 0; for (const p of pts) { x += p.x; y += p.y } return { x: x / pts.length, y: y / pts.length } }

// ── 1. OSM candidates -> metres -> PATH-unit scale ──────────────────────────────
const BAD_SURFACE = new Set(['unpaved', 'dirt', 'gravel', 'ground', 'sand'])
const BAD_NAME = /pit lane|paddock|service|kart|drift|skid|run ?off/i
const ways = osm.elements.filter((e) => {
  if (e.type !== 'way' || !Array.isArray(e.geometry) || e.geometry.length < 2) return false
  const t = e.tags || {}
  if (t.sport && t.sport.includes('karting')) return false
  if (t.surface && BAD_SURFACE.has(t.surface)) return false
  if (t.name && BAD_NAME.test(t.name)) return false
  return true
})
let latSum = 0, lonSum = 0, n = 0
for (const w of ways) for (const g of w.geometry) { latSum += g.lat; lonSum += g.lon; n++ }
const lat0 = latSum / n, lon0 = lonSum / n
const M_LAT = 110540, M_LON = 111320 * Math.cos((lat0 * Math.PI) / 180)

// reference path (racing line) in PATH units
const refNums = circuit.path.match(/-?\d+\.?\d*/g).map(Number)
const refPts = []
for (let i = 0; i + 1 < refNums.length; i += 2) refPts.push({ x: refNums[i], y: refNums[i + 1] })
const refPerim = perimeter(refPts, true)
const scale = refPerim / lapLen // PATH units per metre

// all OSM points in PATH-unit scale (metres * scale), each carrying a unit tangent
// computed from its same-way neighbours (used to disambiguate figure-8 crossovers).
let P = []
for (const w of ways) {
  const s = w.geometry.map((g) => ({ x: (g.lon - lon0) * M_LON * scale, y: (g.lat - lat0) * M_LAT * scale }))
  for (let i = 0; i < s.length; i++) {
    const a = s[Math.max(0, i - 1)], b = s[Math.min(s.length - 1, i + 1)]
    let tx = b.x - a.x, ty = b.y - a.y; const m = Math.hypot(tx, ty) || 1
    P.push({ x: s[i].x, y: s[i].y, tx: tx / m, ty: ty / m })
  }
}
if (P.length > 1600) { const step = Math.ceil(P.length / 1600); P = P.filter((_, i) => i % step === 0) }

// ── 2. Coarse align: rotation + reflection, scored by one-way chamfer R->P ───────
const R = resample(refPts, 360, true)
const Rc = centroid(R)
function transformP(arr, pc, refl, theta, tx, ty) {
  const c = Math.cos(theta), s = Math.sin(theta)
  return arr.map((p) => {
    const x = (refl ? -(p.x - pc.x) : (p.x - pc.x)), y = p.y - pc.y
    const dx = refl ? -p.tx : p.tx, dy = p.ty
    return { x: x * c - y * s + tx, y: x * s + y * c + ty, tx: dx * c - dy * s, ty: dx * s + dy * c }
  })
}
function meanNearest(A, B) {
  let sum = 0
  for (const a of A) { let best = Infinity; for (const b of B) { const d = (a.x - b.x) ** 2 + (a.y - b.y) ** 2; if (d < best) best = d } sum += Math.sqrt(best) }
  return sum / A.length
}
function kabsch(srcPts, dstPts) {
  const sc = centroid(srcPts), dc = centroid(dstPts)
  let num = 0, den = 0
  for (let i = 0; i < srcPts.length; i++) {
    const sx = srcPts[i].x - sc.x, sy = srcPts[i].y - sc.y
    const dx = dstPts[i].x - dc.x, dy = dstPts[i].y - dc.y
    num += sx * dy - sy * dx
    den += sx * dx + sy * dy
  }
  const th = Math.atan2(num, den), c = Math.cos(th), s = Math.sin(th)
  return { c, s, tx: dc.x - (sc.x * c - sc.y * s), ty: dc.y - (sc.x * s + sc.y * c) }
}
// Coarse rotation/reflection search (chamfer R->P) then rigid ICP refine.
function align(pts) {
  const pc = centroid(pts)
  let coarse = null
  for (const refl of [false, true]) {
    for (let deg = 0; deg < 360; deg += 4) {
      const th = (deg * Math.PI) / 180
      const score = meanNearest(R, transformP(pts, pc, refl, th, Rc.x, Rc.y))
      if (!coarse || score < coarse.score) coarse = { score, refl, th }
    }
  }
  let cur = transformP(pts, pc, coarse.refl, coarse.th, Rc.x, Rc.y)
  for (let iter = 0; iter < 24; iter++) {
    const src = [], dst = [], resid = []
    for (const r of R) {
      let best = Infinity, bi = -1
      for (let j = 0; j < cur.length; j++) { const d = (r.x - cur[j].x) ** 2 + (r.y - cur[j].y) ** 2; if (d < best) { best = d; bi = j } }
      resid.push(Math.sqrt(best)); src.push(cur[bi]); dst.push(r)
    }
    const sorted = [...resid].sort((a, b) => a - b)
    const cut = sorted[Math.floor(sorted.length * 0.7)] * 1.4 + 1e-6
    const S = [], D = []
    for (let i = 0; i < src.length; i++) if (resid[i] <= cut) { S.push(src[i]); D.push(dst[i]) }
    const k = kabsch(S, D)
    cur = cur.map((p) => ({
      x: p.x * k.c - p.y * k.s + k.tx, y: p.x * k.s + p.y * k.c + k.ty,
      tx: p.tx * k.c - p.ty * k.s, ty: p.tx * k.s + p.ty * k.c,
    }))
  }
  return { cur, refl: coarse.refl }
}
const rmsRadius = Math.sqrt(R.reduce((a, r) => a + (r.x - Rc.x) ** 2 + (r.y - Rc.y) ** 2, 0) / R.length)
// Two-stage: align everything, then drop OSM points far from the racing line (the
// theme-park / alt-config tarmac at places like Suzuka) and re-align on the GP loop
// only, so its centroid — and the fit — aren't biased by the noise.
let { cur, refl: coarseRefl } = align(P)
{
  const keepBand = 22 * scale
  const Pin = P.filter((_, i) => {
    let best = Infinity
    for (const r of R) { const d = (cur[i].x - r.x) ** 2 + (cur[i].y - r.y) ** 2; if (d < best) best = d }
    return Math.sqrt(best) < keepBand
  })
  if (Pin.length > 40 && Pin.length < P.length) { const a = align(Pin); cur = a.cur; coarseRefl = a.refl }
}
const alignRms = meanNearest(R, cur)
const alignRmsNorm = alignRms / rmsRadius

// ── 4. Snap reference to nearby OSM centroid -> the real centreline ──────────────
// Direction-aware: only snap to OSM points whose tangent aligns with the reference's
// local heading, so a figure-8 crossover (two tracks crossing at an angle) doesn't
// blend the wrong section in. |dot| (not dot) because OSM ways may be digitised
// either way round.
const band = 11 * scale // ~11 m search band around each reference point
const DIR_COS = 0.8     // keep OSM points within ~37° of the reference heading
const refTan = R.map((_, i) => {
  const a = R[(i - 1 + R.length) % R.length], b = R[(i + 1) % R.length]
  let tx = b.x - a.x, ty = b.y - a.y; const m = Math.hypot(tx, ty) || 1
  return { x: tx / m, y: ty / m }
})
const centre = R.map((r, i) => {
  const rt = refTan[i]
  const aligned = (p) => Math.abs(p.tx * rt.x + p.ty * rt.y) > DIR_COS
  const near = cur.filter((p) => Math.abs(p.x - r.x) < band && Math.abs(p.y - r.y) < band && dist(p, r) < band && aligned(p))
  if (near.length) return centroid(near)
  // Widen the band but KEEP the direction constraint, so a crossover never snaps to
  // the crossing branch. Ultimate fallback is the racing line itself (clean), never
  // wrong-direction tarmac.
  const wide = cur.filter((p) => dist(p, r) < band * 2 && aligned(p))
  return wide.length ? centroid(wide) : { x: r.x, y: r.y }
})
// Safeguard: the real centreline is always within ~half a track-width of the racing
// line. Wherever the snap landed further than that, it grabbed the wrong tarmac (a
// crossover's other branch) — clamp those back to the racing line so no shortcut is
// drawn across the crossing.
const maxOffset = 15 * scale * 0.9 // ~half a track width
for (let i = 0; i < centre.length; i++) {
  if (dist(centre[i], R[i]) > maxOffset) centre[i] = { x: R[i].x, y: R[i].y }
}
// smooth (closed moving average) + resample
const sm = centre.map((_, i) => {
  let x = 0, y = 0, w = 0
  for (let k = -3; k <= 3; k++) { const p = centre[(i + k + centre.length) % centre.length]; x += p.x; y += p.y; w++ }
  return { x: x / w, y: y / w }
})
const finalLoop = resample(sm, 300, true)
const clPerimM = perimeter(finalLoop, true) / scale

// ── 5. Emit ──────────────────────────────────────────────────────────────────────
const d = 'M ' + finalLoop.map((p, i) => `${i === 0 ? '' : 'L '}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') + ' Z'
const widthPath = Number((15 * scale).toFixed(2))
const outDir = path.join(ROOT, 'public', 'data', 'tracks')
fs.mkdirSync(outDir, { recursive: true })
fs.writeFileSync(path.join(outDir, `${id}.json`), JSON.stringify({
  id, source: 'osm', viewBox: '0 0 500 420',
  perimeterM: Math.round(clPerimM), lapLengthM: lapLen,
  alignRmsNorm: Number(alignRmsNorm.toFixed(4)), widthPath, centerlinePath: d,
}, null, 0) + '\n')

const perimErr = Math.abs(clPerimM - lapLen) / lapLen
const ok = alignRmsNorm < 0.06 && perimErr < 0.12
console.log(`${id}: refl=${coarseRefl} rmsNorm=${alignRmsNorm.toFixed(4)} perim=${Math.round(clPerimM)}m (lap ${lapLen}m, err ${(perimErr * 100).toFixed(1)}%) width=${widthPath} -> ${ok ? 'OK' : 'CHECK'}`)
