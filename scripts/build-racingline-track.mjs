/**
 * build-racingline-track.mjs
 * ==========================================================================
 * Builds the "Racing Line" viz data for ONE circuit: a REAL track centreline
 * (with width, from OpenStreetMap) that the actual GPS racing line can be
 * overlaid on. Unlike circuits.json (whose `path` is itself a racing line),
 * this is the geometric centre of the asphalt — so the racing line visibly
 * cuts the apexes inside the ribbon.
 *
 * Pipeline:
 *   1. Read raw OSM `highway=raceway` ways (fetched via Overpass, saved to
 *      scripts/cache/<circuit>_osm.json).
 *   2. Keep the Grand-Prix asphalt segments, drop karting / unpaved / pit /
 *      Stowe-Circuit noise.
 *   3. Chain segments into a single closed loop by endpoint snapping.
 *   4. Validate: loop perimeter (m) should match the circuit's lapLength.
 *   5. Align the loop to our existing circuits.json `path` frame (similarity
 *      transform w/ reflection + cyclic offset search) so the racing line
 *      overlays correctly.
 *   6. Emit an SVG path in the 500x420 PATH space -> public/data/tracks/<id>.json
 *
 * Usage:  node scripts/build-racingline-track.mjs silverstone
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const PATH_VB = { w: 500, h: 420 }

const circuitId = process.argv[2] || 'silverstone'

// ── Load inputs ───────────────────────────────────────────────────────────────
const osm = JSON.parse(fs.readFileSync(path.join(__dirname, 'cache', `${circuitId}_osm.json`), 'utf8'))
const circuits = JSON.parse(fs.readFileSync(path.join(ROOT, 'public', 'data', 'circuits.json'), 'utf8'))
const circuit = circuits[circuitId]
if (!circuit) throw new Error(`No circuit ${circuitId} in circuits.json`)

// ── 1+2. Filter candidate ways ──────────────────────────────────────────────────
const BAD_SURFACE = new Set(['unpaved', 'dirt', 'gravel', 'ground'])
// Exclude pit *lanes* and the separate Stowe/karting/skid-pan tarmac — but keep
// "National Pit Straight" (an actual GP straight, not a pit lane).
const BAD_NAME = /stowe circuit|pit lane|ice hill|kick plate|limestone|priory|^bridge$/i
function isCandidate(w) {
  const t = w.tags || {}
  if (t.sport && t.sport.includes('karting')) return false
  if (t.surface && BAD_SURFACE.has(t.surface)) return false
  if (t.name && BAD_NAME.test(t.name)) return false
  if (!Array.isArray(w.geometry) || w.geometry.length < 2) return false
  return true
}
const ways = osm.elements.filter((e) => e.type === 'way' && isCandidate(e))
console.log(`candidate ways: ${ways.length} (of ${osm.elements.filter(e=>e.type==='way').length})`)

// ── lat/lon -> local metres (equirectangular about the centroid) ────────────────
let latSum = 0, lonSum = 0, n = 0
for (const w of ways) for (const g of w.geometry) { latSum += g.lat; lonSum += g.lon; n++ }
const lat0 = latSum / n, lon0 = lonSum / n
const M_LAT = 110540, M_LON = 111320 * Math.cos((lat0 * Math.PI) / 180)
const toM = (g) => ({ x: (g.lon - lon0) * M_LON, y: (g.lat - lat0) * M_LAT })
const polys = ways.map((w) => ({ id: w.id, name: (w.tags || {}).name || '', pts: w.geometry.map(toM) }))

function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y) }
function perimeter(pts) { let l = 0; for (let i = 1; i < pts.length; i++) l += dist(pts[i - 1], pts[i]); return l }

// ── 3. Chain into the GP loop by following the named corners in lap order ─────────
// Silverstone's OSM has many overlapping configs (National/International/Stowe), so
// blind endpoint-greedy picks the wrong tarmac. Instead we walk the GP lap by name.
const NAME_ORDER = circuit.lapSegments || [
  'Hamilton Straight', 'Abbey', 'Farm Curve', 'Village', 'The Loop', 'Aintree',
  'Wellington Straight', 'Brooklands', 'Luffield', 'Woodcote', 'National Pit Straight',
  'Copse', 'Maggotts', 'Becketts', 'Chapel Curve', 'Hangar Straight', 'Stowe', 'Vale', 'Club',
]
const byName = new Map()
for (const p of polys) if (p.name) { if (!byName.has(p.name)) byName.set(p.name, []); byName.get(p.name).push(p) }

// Attach a segment's points to the chain, orienting it so its nearer end joins the tail.
function attach(chain, pts) {
  if (chain.length === 0) return pts.slice()
  const tail = chain[chain.length - 1]
  const fwd = dist(tail, pts[0]), rev = dist(tail, pts[pts.length - 1])
  return chain.concat(rev < fwd ? pts.slice().reverse() : pts.slice())
}
let chain = []
const used = new Set()
const gaps = []
for (const name of NAME_ORDER) {
  let group = (byName.get(name) || []).slice()
  // Multiple ways share a name (split centreline) — attach them greedily by proximity.
  while (group.length) {
    let pick = 0
    if (chain.length) {
      const tail = chain[chain.length - 1]
      let bd = Infinity
      group.forEach((g, i) => { const d = Math.min(dist(tail, g.pts[0]), dist(tail, g.pts[g.pts.length - 1])); if (d < bd) { bd = d; pick = i } })
    }
    const g = group.splice(pick, 1)[0]
    if (chain.length) gaps.push({ name, gap: Math.round(Math.min(dist(chain[chain.length - 1], g.pts[0]), dist(chain[chain.length - 1], g.pts[g.pts.length - 1]))) })
    chain = attach(chain, g.pts)
    used.add(g.id)
  }
}
// Bridge large gaps with leftover (mostly unnamed) connector ways so chords don't
// cut across the slow complexes. Only accept a way that genuinely spans the gap.
function bridgeGaps(chain) {
  const leftover = polys.filter((p) => !used.has(p.id))
  for (let pass = 0; pass < 6; pass++) {
    let gi = -1, gd = 0
    for (let i = 0; i + 1 < chain.length; i++) { const d = dist(chain[i], chain[i + 1]); if (d > 45 && d > gd) { gd = d; gi = i } }
    if (gi < 0) break
    const A = chain[gi], B = chain[gi + 1]
    let best = null
    for (const w of leftover) {
      if (used.has(w.id)) continue
      const s = w.pts[0], e = w.pts[w.pts.length - 1]
      const fwd = dist(A, s) + dist(B, e), rev = dist(A, e) + dist(B, s)
      const cost = Math.min(fwd, rev)
      if (cost < gd * 1.05 && Math.max(dist(A, s), dist(B, e), dist(A, e), dist(B, s)) < gd) {
        if (!best || cost < best.cost) best = { w, cost, rev: rev < fwd }
      }
    }
    if (!best) break
    const pts = best.rev ? best.w.pts.slice().reverse() : best.w.pts.slice()
    chain = chain.slice(0, gi + 1).concat(pts, chain.slice(gi + 1))
    used.add(best.w.id)
  }
  return chain
}
chain = bridgeGaps(chain)
const loopLen = perimeter(chain)
console.log(`chained ${used.size} segments -> ${chain.length} pts, perimeter ${Math.round(loopLen)} m (lapLength ${circuit.lapLength} m)`)
console.log('largest joins (m):', gaps.sort((a, b) => b.gap - a.gap).slice(0, 6).map((g) => `${g.name}:${g.gap}`).join(', '))
const missing = NAME_ORDER.filter((nm) => !byName.has(nm))
if (missing.length) console.log('MISSING names:', missing.join(', '))

// ── 4. Resample loop by arc length ──────────────────────────────────────────────
function resample(pts, count) {
  const seg = [], cum = [0]
  let total = 0
  for (let i = 1; i < pts.length; i++) { const d = dist(pts[i - 1], pts[i]); seg.push(d); total += d; cum.push(total) }
  const out = []
  for (let i = 0; i < count; i++) {
    const target = (i / count) * total
    let j = 0; while (j < cum.length - 2 && cum[j + 1] < target) j++
    const t = (target - cum[j]) / (seg[j] || 1)
    out.push({ x: pts[j].x + (pts[j + 1].x - pts[j].x) * t, y: pts[j].y + (pts[j + 1].y - pts[j].y) * t })
  }
  return out
}

// reference loop = existing circuits.json path (M/L/Z numbers)
const refNums = circuit.path.match(/-?\d+\.?\d*/g).map(Number)
const refPts = []
for (let i = 0; i + 1 < refNums.length; i += 2) refPts.push({ x: refNums[i], y: refNums[i + 1] })

const N = 240
const A = resample(refPts, N)                 // target frame (500x420)
const B = resample(chain, N)                  // OSM loop (metres)

// ── 5. Similarity alignment (complex), search dir/reflect/cyclic offset ──────────
function centerScale(pts) {
  let cx = 0, cy = 0; for (const p of pts) { cx += p.x; cy += p.y } cx /= pts.length; cy /= pts.length
  let s = 0; const c = pts.map((p) => ({ x: p.x - cx, y: p.y - cy })); for (const p of c) s += p.x * p.x + p.y * p.y
  s = Math.sqrt(s / pts.length)
  return { c, cx, cy, s }
}
const aN = centerScale(A), bN = centerScale(B)
const a = aN.c.map((p) => ({ re: p.x / aN.s, im: p.y / aN.s }))
const bBase = bN.c.map((p) => ({ re: p.x / bN.s, im: p.y / bN.s }))

function variants(arr) {
  const rev = arr.slice().reverse()
  const conj = (s) => s.map((p) => ({ re: p.re, im: -p.im })) // reflection
  return [
    { name: 'fwd', s: arr }, { name: 'rev', s: rev },
    { name: 'fwd-refl', s: conj(arr) }, { name: 'rev-refl', s: conj(rev) },
  ]
}
let best = null
for (const v of variants(bBase)) {
  for (let off = 0; off < N; off++) {
    const b = []
    for (let i = 0; i < N; i++) b.push(v.s[(i + off) % N])
    // optimal λe^{iθ}: sum(a conj(b)) / sum(|b|^2); residual = ||a||^2 - |num|^2/den
    let numRe = 0, numIm = 0, den = 0, anorm = 0
    for (let i = 0; i < N; i++) {
      numRe += a[i].re * b[i].re + a[i].im * b[i].im
      numIm += a[i].im * b[i].re - a[i].re * b[i].im
      den += b[i].re * b[i].re + b[i].im * b[i].im
      anorm += a[i].re * a[i].re + a[i].im * a[i].im
    }
    const res = anorm - (numRe * numRe + numIm * numIm) / den
    if (!best || res < best.res) best = { res, v: v.name, off, lambdaRe: numRe / den, lambdaIm: numIm / den, b }
  }
}
const rmsNorm = Math.sqrt(best.res / N)
// Scale: 1 metre in OSM space -> this many 500x420 PATH units.
const lambdaAbs = Math.hypot(best.lambdaRe, best.lambdaIm)
const metreToPath = (lambdaAbs * aN.s) / bN.s
console.log(`alignment: variant=${best.v} offset=${best.off} normalised RMS=${rmsNorm.toFixed(4)}  (1m=${metreToPath.toFixed(3)}px)`)

// Build the full transform applied to RAW metre points -> 500x420:
//   1) translate by -bN centroid, scale 1/bN.s  -> bBase frame
//   2) apply reflection (if variant has 'refl')  -> im *= -1
//   3) multiply by λ (complex)                   -> rotate+scale into a-normalised
//   4) scale by aN.s, translate by aN centroid   -> 500x420
const reflect = best.v.includes('refl')
function mapPoint(p) {
  let re = (p.x - bN.cx) / bN.s, im = (p.y - bN.cy) / bN.s
  if (reflect) im = -im
  const r = re * best.lambdaRe - im * best.lambdaIm
  const i2 = re * best.lambdaIm + im * best.lambdaRe
  return { x: r * aN.s + aN.cx, y: i2 * aN.s + aN.cy }
}
// Reverse the chain too if the winning variant reversed it, so the emitted loop
// runs the same direction as the reference (keeps start marker sensible).
let outChain = reflect && best.v.startsWith('rev') ? chain.slice().reverse()
  : best.v.startsWith('rev') ? chain.slice().reverse() : chain.slice()
const mapped = resample(outChain, 300).map(mapPoint)

// ── 6. Emit SVG path + JSON ──────────────────────────────────────────────────────
const d = 'M ' + mapped.map((p, i) => `${i === 0 ? '' : 'L '}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') + ' Z'
const outDir = path.join(ROOT, 'public', 'data', 'tracks')
fs.mkdirSync(outDir, { recursive: true })
const outFile = path.join(outDir, `${circuitId}.json`)
const TRACK_WIDTH_M = 15 // typical modern F1 track width
fs.writeFileSync(outFile, JSON.stringify({
  id: circuitId, source: 'osm', viewBox: '0 0 500 420',
  perimeterM: Math.round(loopLen), lapLengthM: circuit.lapLength,
  alignRmsNorm: Number(rmsNorm.toFixed(4)),
  widthPath: Number((TRACK_WIDTH_M * metreToPath).toFixed(2)),
  centerlinePath: d,
}, null, 0) + '\n')
console.log(`wrote ${outFile}`)

// Debug overlay so we can eyeball centreline (grey) vs existing path (pink).
const dbg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 420" width="700" height="588">
<rect width="500" height="420" fill="#111"/>
<path d="${d}" fill="none" stroke="#888" stroke-width="22" stroke-linejoin="round" stroke-linecap="round" opacity="0.6"/>
<path d="${circuit.path}" fill="none" stroke="#ec4899" stroke-width="2.5" stroke-linejoin="round"/>
</svg>`
fs.writeFileSync(path.join(__dirname, 'cache', `${circuitId}_overlay.svg`), dbg)
console.log('wrote debug overlay svg')
