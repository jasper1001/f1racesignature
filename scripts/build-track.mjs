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

// all OSM points in PATH-unit scale (metres * scale), centred at OSM centroid
let P = []
for (const w of ways) for (const g of w.geometry) P.push({ x: (g.lon - lon0) * M_LON * scale, y: (g.lat - lat0) * M_LAT * scale })
if (P.length > 1600) { const step = Math.ceil(P.length / 1600); P = P.filter((_, i) => i % step === 0) }

// ── 2. Coarse align: rotation + reflection, scored by one-way chamfer R->P ───────
const R = resample(refPts, 360, true)
const Rc = centroid(R)
const Pc = centroid(P)
function transformP(arr, refl, theta, tx, ty) {
  const c = Math.cos(theta), s = Math.sin(theta)
  return arr.map((p) => {
    const x = (refl ? -(p.x - Pc.x) : (p.x - Pc.x)), y = p.y - Pc.y
    return { x: x * c - y * s + tx, y: x * s + y * c + ty }
  })
}
// nearest-dist helpers (brute; sizes are small)
function meanNearest(A, B) {
  let sum = 0
  for (const a of A) { let best = Infinity; for (const b of B) { const d = (a.x - b.x) ** 2 + (a.y - b.y) ** 2; if (d < best) best = d } sum += Math.sqrt(best) }
  return sum / A.length
}
let coarse = null
for (const refl of [false, true]) {
  for (let deg = 0; deg < 360; deg += 6) {
    const th = (deg * Math.PI) / 180
    const TP = transformP(P, refl, th, Rc.x, Rc.y) // translate centroid->Rc
    const score = meanNearest(R, TP)
    if (!coarse || score < coarse.score) coarse = { score, refl, th }
  }
}

// ── 3. ICP refine (rigid, scale fixed) ──────────────────────────────────────────
let cur = transformP(P, coarse.refl, coarse.th, Rc.x, Rc.y)
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
for (let iter = 0; iter < 20; iter++) {
  // correspondences R -> nearest in cur (so every reference point pulls a track point)
  const src = [], dst = []
  const resid = []
  for (const r of R) {
    let best = Infinity, bi = -1
    for (let j = 0; j < cur.length; j++) { const d = (r.x - cur[j].x) ** 2 + (r.y - cur[j].y) ** 2; if (d < best) { best = d; bi = j } }
    resid.push(Math.sqrt(best)); src.push(cur[bi]); dst.push(r)
  }
  const sorted = [...resid].sort((a, b) => a - b)
  const cut = sorted[Math.floor(sorted.length * 0.8)] * 1.5 + 1e-6 // inliers only
  const S = [], D = []
  for (let i = 0; i < src.length; i++) if (resid[i] <= cut) { S.push(src[i]); D.push(dst[i]) }
  const k = kabsch(S, D)
  cur = cur.map((p) => ({ x: p.x * k.c - p.y * k.s + k.tx, y: p.x * k.s + p.y * k.c + k.ty }))
}
const rmsRadius = Math.sqrt(R.reduce((a, r) => a + (r.x - Rc.x) ** 2 + (r.y - Rc.y) ** 2, 0) / R.length)
const alignRms = meanNearest(R, cur)
const alignRmsNorm = alignRms / rmsRadius

// ── 4. Snap reference to nearby OSM centroid -> the real centreline ──────────────
const band = 18 * scale // ~18 m search band around each reference point
const centre = R.map((r) => {
  const near = cur.filter((p) => Math.abs(p.x - r.x) < band && Math.abs(p.y - r.y) < band && dist(p, r) < band)
  return near.length ? centroid(near) : { x: r.x, y: r.y }
})
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
console.log(`${id}: refl=${coarse.refl} rmsNorm=${alignRmsNorm.toFixed(4)} perim=${Math.round(clPerimM)}m (lap ${lapLen}m, err ${(perimErr * 100).toFixed(1)}%) width=${widthPath} -> ${ok ? 'OK' : 'CHECK'}`)
